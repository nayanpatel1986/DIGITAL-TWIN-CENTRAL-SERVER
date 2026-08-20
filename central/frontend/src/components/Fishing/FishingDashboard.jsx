import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, Grid, TextField, Button, Alert, LinearProgress, Select, MenuItem, FormControl } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Anchor, Activity, AlertTriangle, Gauge, ArrowDown, ArrowUp, Settings, RotateCw, Droplets, Edit2, Check } from 'lucide-react';
import { useRig } from '../../context/RigContext';
import AnalogGauge from '../RomCommon/AnalogGauge';
import GridResizablePanel from '../RomCommon/GridResizablePanel';
import FishingStats from './FishingStats';

const DEFAULT_FISHING_LAYOUT = [
    { id: 'overpull_gauge', type: 'overpull_gauge', gridWidth: 5 },
    { id: 'hook_load', type: 'metric', label: 'Actual Hook Load', dataKey: 'hookLoad', color: '#38bdf8', gridWidth: 3 },
    { id: 'settings', type: 'settings', gridWidth: 4 },
    { id: 'analytics', type: 'analytics', gridWidth: 6 },
    { id: 'overpull_hist', type: 'overpull_hist', gridWidth: 6 },
    { id: 'depth_pos', type: 'depth_pos', gridWidth: 3 },
    { id: 'jarring', type: 'jarring', gridWidth: 3 },
    { id: 'pressure', type: 'pressure', gridWidth: 3 },
    { id: 'torque', type: 'metric', label: 'Rotary Torque', dataKey: 'torque', color: '#a78bfa', unit: 'ft-lbs', gridWidth: 3 }
];

const FishingDashboard = () => {
    const { globalRigData, apiBaseUrl } = useRig();

    // 1. Critical Hoisting Parameters
    const [hoisting, setHoisting] = useState({
        hookLoad: 0,        // tons
        stringWeight: 210,  // tons
        slackOffWeight: 0,  // tons
        blockPosition: 0,   // %
        torque: 0
    });

    // 2. Depth & Speed
    const [depth, setDepth] = useState({
        bitDepth: 5200,     // ft
        fishTopDepth: 5150, // ft
        lineSpeed: 0        // ft/min
    });

    // 3. Jarring
    const [jarring] = useState({
        upImpacts: 12,
        downImpacts: 5,
        lastImpactLoad: 80 // tons
    });

    // 4. Pressure & Pumping
    const [pressure, setPressure] = useState({
        tbg: 2500, // psi
        csg: 500,  // psi
        pump: 2800 // psi
    });

    const [graphData, setGraphData] = useState([]);
    const [alarms, setAlarms] = useState([]);

    // Time Range States
    const [timeRange, setTimeRange] = useState('live');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [isCustom, setIsCustom] = useState(false);

    // Derived: Overpull
    const overpull = Math.max(0, hoisting.hookLoad - hoisting.stringWeight);
    const tensileLimit = 500; // tons (Pipe Limit)
    const overpullPercentage = Math.min(100, (overpull / (tensileLimit - hoisting.stringWeight)) * 100);

    const fetchHistory = async () => {
        if (timeRange === 'live') {
            setGraphData([]);
            return;
        }
        try {
            let url = `${apiBaseUrl}/api/history`;
            if (isCustom && customRange.start && customRange.end) {
                url += `?start=${new Date(customRange.start).toISOString()}&stop=${new Date(customRange.end).toISOString()}`;
            } else {
                url += `?range=${timeRange}`;
            }

            const res = await axios.get(url);
            if (res.data && res.data.length > 0) {
                const formatted = res.data.map(row => {
                    const dateObj = new Date(row.timestamp);
                    const hl = Number(row['drawworks.hook_load']) || 0;
                    const op = Math.max(0, hl - hoisting.stringWeight);
                    return {
                        time: row.name || dateObj.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        hookload: hl,
                        depth: Number(row['drilling.hole_depth']) || depth.bitDepth,
                        overpull: op,
                        torque: Number(row['engine.torque']) || 0
                    };
                });
                setGraphData(formatted);
            } else {
                setGraphData([]);
            }
        } catch (err) {
            console.error("Failed to fetch fishing history", err);
            setGraphData([]);
        }
    };

    useEffect(() => {
        if (timeRange !== 'live') {
            if (!isCustom || (isCustom && customRange.start && customRange.end)) {
                fetchHistory();
            }
        }
    }, [timeRange, isCustom, customRange.start, customRange.end, hoisting.stringWeight]); // Re-fetch or recalculate overpull if stringWeight changes

    // Socket Listener replacement
    useEffect(() => {
        if (!globalRigData) return;

        const data = globalRigData;

        if (data.drawworks) {
            setHoisting(prev => ({
                ...prev,
                hookLoad: Number(data.drawworks.hook_load) || 0,
                blockPosition: Number(data.drawworks.block_position) || 0
            }));
        }
        if (data.engine) {
            setHoisting(prev => ({
                ...prev,
                torque: Number(data.engine.torque) || 0
            }));
        }
        if (data.mudpump) {
            setPressure(prev => ({
                ...prev,
                pump: Number(data.mudpump.pressure) || 0
            }));
        }

        // Only update graph with live data if we are not looking at a Custom specific range 
        // OR if we are looking at a preset range (like 1h), we can still append to the end.
        if (!isCustom) {
            setGraphData(prev => {
                const newData = [...prev];
                newData.push({
                    time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    hookload: Number(data.drawworks?.hook_load) || 0,
                    depth: depth.bitDepth,
                    overpull: Math.max(0, (Number(data.drawworks?.hook_load) || 0) - hoisting.stringWeight),
                    torque: Number(data.engine?.torque) || 0
                });

                // Keep bounded size if accumulating live points. 
                // E.g., if fetchHistory gave us 3600 points, we can safely drop older ones as new ones arrive.
                if (newData.length > 5000) newData.shift(); 
                return newData;
            });
        }
    }, [globalRigData, hoisting.stringWeight, depth.bitDepth, isCustom]);

    // Safety Alarms Logic
    useEffect(() => {
        const newAlarms = [];
        if (overpull > 100) newAlarms.push({ id: 'overpull', msg: 'HIGH OVERPULL WARNING', severity: 'error' });
        if (pressure.pump > 4500) newAlarms.push({ id: 'pump', msg: 'PUMP OVERPRESSURE', severity: 'warning' });
        setAlarms(newAlarms);
    }, [overpull, pressure.pump]);

    return (
        <Box sx={{ p: 2, color: 'white', minHeight: '100vh', bgcolor: '#0f172a' }}>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, bgcolor: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <Anchor size={24} color="#38bdf8" />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>FISHING OPERATIONS</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                LIVE WELL INTERVENTION MONITORING • DEPTH: {depth.bitDepth} FT
                            </Typography>
                        </Box>
                    </Box>


                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {alarms.map(alarm => (
                            <Alert key={alarm.id} severity={alarm.severity} variant="filled" sx={{ fontWeight: 900, borderRadius: '10px', py: 0, fontSize: '0.75rem' }}>
                                {alarm.msg}
                            </Alert>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Top Stat HUD */}
            <FishingStats hoisting={hoisting} pressure={pressure} overpull={overpull} />

            <Grid container spacing={2}>
                {/* Left Column: Monitoring Charts */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Hook Load vs Depth Chart */}
                        <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 900, display: 'block', letterSpacing: 1.5 }}>
                                    HOOK LOAD vs DEPTH TREND
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isCustom && (
                                        <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                                            <TextField
                                                type="datetime-local"
                                                size="small"
                                                value={customRange.start}
                                                onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
                                                sx={{ '& .MuiOutlinedInput-root': { color: 'white', bgcolor: 'rgba(15, 23, 42, 0.4)', borderRadius: '4px', height: '24px' }, '& .MuiInputBase-input': { p: '0 6px', fontSize: '0.65rem' } }}
                                            />
                                            <TextField
                                                type="datetime-local"
                                                size="small"
                                                value={customRange.end}
                                                onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
                                                sx={{ '& .MuiOutlinedInput-root': { color: 'white', bgcolor: 'rgba(15, 23, 42, 0.4)', borderRadius: '4px', height: '24px' }, '& .MuiInputBase-input': { p: '0 6px', fontSize: '0.65rem' } }}
                                            />
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                onClick={() => fetchHistory()} 
                                                sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0ea5e9' }, textTransform: 'none', height: '24px', minWidth: '40px', fontSize: '0.65rem', px: 1, py: 0 }}
                                            >
                                                Apply
                                            </Button>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {[
                                            { label: 'LIVE', val: 'live' },
                                            { label: '1M', val: '-1m' },
                                            { label: '5M', val: '-5m' },
                                            { label: '30M', val: '-30m' },
                                            { label: '1H', val: '-1h' },
                                            { label: '6H', val: '-6h' },
                                            { label: '12H', val: '-12h' }
                                        ].map(opt => (
                                            <Button
                                                key={opt.val}
                                                variant={timeRange === opt.val && !isCustom ? "contained" : "outlined"}
                                                onClick={() => {
                                                    setTimeRange(opt.val);
                                                    setIsCustom(false);
                                                }}
                                                size="small"
                                                sx={{
                                                    bgcolor: timeRange === opt.val && !isCustom ? '#38bdf8' : 'transparent',
                                                    color: timeRange === opt.val && !isCustom ? '#0f172a' : '#94a3b8',
                                                    borderColor: '#334155',
                                                    minWidth: '32px',
                                                    fontSize: '0.65rem',
                                                    py: 0.25, px: 0.5
                                                }}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                        <Button
                                            variant={isCustom ? "contained" : "outlined"}
                                            onClick={() => {
                                                setTimeRange('custom');
                                                setIsCustom(true);
                                            }}
                                            size="small"
                                            sx={{
                                                bgcolor: isCustom ? '#38bdf8' : 'transparent',
                                                color: isCustom ? '#0f172a' : '#94a3b8',
                                                borderColor: '#334155',
                                                minWidth: '40px',
                                                fontSize: '0.65rem',
                                                py: 0.25, px: 0.5
                                            }}
                                        >
                                            CUSTOM
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="colorHookload" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                    <XAxis dataKey="time" stroke="#475569" fontSize={9} />
                                    <YAxis stroke="#475569" fontSize={9} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="hookload" stroke="#38bdf8" fillOpacity={1} fill="url(#colorHookload)" strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>

                        {/* Overpull History Chart */}
                        <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                            <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>OVERPULL UTILIZATION HISTORY</Typography>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={graphData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                    <XAxis dataKey="time" stroke="#475569" fontSize={9} />
                                    <YAxis stroke="#475569" fontSize={9} domain={[0, 150]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="overpull" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>
                </Grid>

                {/* Right Column: Operation Details Sidebar */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Depth & Position Tracker */}
                        <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                            <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>DEPTH & POSITION TRACKER</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>BIT DEPTH</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 1000, color: '#22c55e', fontFamily: 'monospace' }}>{depth.bitDepth.toLocaleString()} <span style={{fontSize: '0.6em'}}>ft</span></Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>FISH TOP</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 1000, color: '#fbbf24', fontFamily: 'monospace' }}>{depth.fishTopDepth.toLocaleString()} <span style={{fontSize: '0.6em'}}>ft</span></Typography>
                                </Box>
                                <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.05)', textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, mb: 0.2, display: 'block', fontSize: '0.6rem' }}>REMAINING DISTANCE</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 1000, color: 'white', fontFamily: 'monospace' }}>
                                        {(depth.fishTopDepth - depth.bitDepth).toFixed(1)} <span style={{fontSize: '0.5em', color: '#475569'}}>ft</span>
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Jarring Ops Tracker */}
                        <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                            <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>JARRING OPERATIONS</Typography>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Box sx={{ flex: 1, p: 1.5, bgcolor: '#0f172a', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.05)' }}>
                                    <ArrowUp size={20} color="#38bdf8" />
                                    <Typography variant="h5" sx={{ fontWeight: 1000, mt: 1, color: '#38bdf8', fontFamily: 'monospace' }}>{jarring.upImpacts}</Typography>
                                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.65rem' }}>UP JARS</Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1.5, bgcolor: '#0f172a', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(251, 191, 36, 0.05)' }}>
                                    <ArrowDown size={20} color="#fbbf24" />
                                    <Typography variant="h5" sx={{ fontWeight: 1000, mt: 1, color: '#fbbf24', fontFamily: 'monospace' }}>{jarring.downImpacts}</Typography>
                                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.65rem' }}>DOWN JARS</Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Well Parameters Settings */}
                        <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>WELL PARAMETERS</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="String Weight (tons)"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={hoisting.stringWeight}
                                    onChange={(e) => setHoisting({ ...hoisting, stringWeight: Number(e.target.value) })}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { color: 'white', borderRadius: '10px', bgcolor: 'rgba(15, 23, 42, 0.2)', fontSize: '0.85rem' },
                                        '& .MuiInputLabel-root': { color: '#475569', fontSize: '0.85rem' }
                                    }}
                                />
                                <TextField
                                    label="Fish Top Depth (ft)"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={depth.fishTopDepth}
                                    onChange={(e) => setDepth({ ...depth, fishTopDepth: Number(e.target.value) })}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { color: 'white', borderRadius: '10px', bgcolor: 'rgba(15, 23, 42, 0.2)', fontSize: '0.85rem' },
                                        '& .MuiInputLabel-root': { color: '#475569', fontSize: '0.85rem' }
                                    }}
                                />
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};


export default FishingDashboard;
