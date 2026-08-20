import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { Gauge, Thermometer, Fuel, Battery, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { useRig } from '../../context/RigContext';
import MaintenancePanel from './MaintenancePanel';

const ICONS = { Gauge, Thermometer, Fuel, Battery, Activity };

const DEFAULT_ENGINE_LAYOUT = [
    { id: 'rpm', type: 'metric', title: 'RPM', dataKey: 'rpm', unit: 'RPM', iconName: 'Activity', color: '#38bdf8' },
    { id: 'fuel', type: 'metric', title: 'FUEL', dataKey: 'fuel_level', unit: '%', iconName: 'Fuel', color: '#10b981' },
    { id: 'oil_press', type: 'metric', title: 'OIL PRESS', dataKey: 'oil_pressure', unit: 'psi', iconName: 'Gauge', color: '#f59e0b' },
    { id: 'battery', type: 'metric', title: 'BATTERY', dataKey: 'battery_voltage', unit: 'V', iconName: 'Battery', color: '#6366f1' },
    { id: 'coolant', type: 'metric', title: 'COOLANT', dataKey: 'coolant_temp', unit: '°C', iconName: 'Thermometer', color: '#ef4444' },
    { id: 'oil_temp', type: 'metric', title: 'OIL TEMP', dataKey: 'oil_temp', unit: '°C', iconName: 'Thermometer', color: '#ef4444' }
];

function EngineTile({ label, value, unit, icon: Icon, color }) {
    return (
        <Paper sx={{ 
            p: 1.5, 
            bgcolor: 'rgba(30, 41, 59, 0.5)', 
            border: '1px solid rgba(51, 65, 85, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 90,
            transition: 'all 0.3s ease',
            '&:hover': {
                bgcolor: 'rgba(51, 65, 85, 0.6)',
                borderColor: '#38bdf8'
            }
        }}>
            <Box sx={{ color: color, mb: 0.5 }}>
                <Icon size={20} />
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.2, fontWeight: 600 }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography variant="h6" sx={{ color: color || 'white', fontWeight: 800, fontFamily: 'monospace' }}>
                    {Number(value || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                    {unit}
                </Typography>
            </Box>
        </Paper>
    );
}

export default function EngineDashboard() {
    const { globalRigData, apiBaseUrl } = useRig();
    const [layout] = useState(DEFAULT_ENGINE_LAYOUT);
    
    const [engineData, setEngineData] = useState(() => {
        const initial = {
            rpm: 0,
            oil_pressure: 0,
            oil_temp: 0,
            coolant_temp: 0,
            exhaust_temp: 0,
            fuel_level: 0,
            battery_voltage: 0,
            torque: 0
        };
        return globalRigData?.engine ?? initial;
    });

    const [graphData, setGraphData] = useState([]);
    const [timeRange, setTimeRange] = useState('live');
    const [historyData, setHistoryData] = useState([]);

    // Live Data Update
    useEffect(() => {
        if (globalRigData && globalRigData.engine) {
            setEngineData(globalRigData.engine);
            
            // Build the live trend graph
            setGraphData(prev => {
                const newData = [...prev];
                const now = new Date();
                newData.push({
                    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    rpm: Number(globalRigData.engine.rpm) || 0,
                    fuel: Number(globalRigData.engine.fuel_level) || 0,
                    oil_press: Number(globalRigData.engine.oil_pressure) || 0,
                    battery: Number(globalRigData.engine.battery_voltage) || 0,
                    coolant: Number(globalRigData.engine.coolant_temp) || 0,
                    oil_temp: Number(globalRigData.engine.oil_temp) || 0
                });

                if (newData.length > 50) newData.shift();
                return newData;
            });
        }
    }, [globalRigData]);

    // Historical Data Fetch
    useEffect(() => {
        if (timeRange === 'live') return;
        let isMounted = true;
        
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${apiBaseUrl}/api/history?range=${timeRange}`);
                if (isMounted && res.data) {
                    const mapped = res.data.map(pt => ({
                        time: new Date(pt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        rpm: pt['engine.rpm'] || 0,
                        fuel: pt['engine.fuel_level'] || 0,
                        oil_press: pt['engine.oil_pressure'] || 0,
                        battery: pt['engine.battery_voltage'] || 0,
                        coolant: pt['engine.coolant_temp'] || 0,
                        oil_temp: pt['engine.oil_temp'] || 0,
                        timestamp: pt.timestamp
                    })).sort((a,b) => a.timestamp - b.timestamp);
                    setHistoryData(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch historical data", e);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [timeRange, apiBaseUrl]);

    const activeData = timeRange === 'live' ? graphData : historyData;

    return (
        <Box sx={{ p: 1.5, minHeight: '100vh', bgcolor: '#0f172a' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
                    Engine & Power Monitoring
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.5, fontSize: '0.65rem' }}>
                    SYSTEM STATUS: NORMAL
                </Typography>
            </Box>

            <Grid container spacing={1.5}>
                {/* Left Column: Metric Tiles + Analytic Graph */}
                <Grid item xs={12} md={8.5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Metric Tiles */}
                        <Grid container spacing={1}>
                            {layout.filter(item => item.type === 'metric').map((item) => (
                                <Grid item key={item.id} xs={12} sm={6} md={4}>
                                    <EngineTile
                                        label={item.title}
                                        value={engineData[item.dataKey]}
                                        unit={item.unit}
                                        icon={ICONS[item.iconName] || Activity}
                                        color={item.color}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Analytic Graph */}
                        <Paper sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(30, 41, 59, 0.4)', 
                            borderRadius: '20px', 
                            border: '1px solid rgba(255, 255, 255, 0.05)', 
                            backdropFilter: 'blur(10px)', 
                            mt: 1 
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 900, letterSpacing: 1.5 }}>
                                    ANALYTIC TRENDS
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {[
                                        { label: 'Live', val: 'live' },
                                        { label: '15m', val: '-15m' },
                                        { label: '1h', val: '-1h' },
                                        { label: '6h', val: '-6h' },
                                        { label: '24h', val: '-24h' }
                                    ].map(opt => (
                                        <Button
                                            key={opt.val}
                                            variant={timeRange === opt.val ? "contained" : "outlined"}
                                            onClick={() => setTimeRange(opt.val)}
                                            size="small"
                                            sx={{
                                                bgcolor: timeRange === opt.val ? '#38bdf8' : 'transparent',
                                                color: timeRange === opt.val ? '#0f172a' : '#94a3b8',
                                                borderColor: '#334155',
                                                minWidth: '40px',
                                                fontSize: '0.7rem',
                                                py: 0.25, px: 1
                                            }}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={activeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                    <XAxis dataKey="time" stroke="#475569" fontSize={9} />
                                    <YAxis stroke="#475569" fontSize={9} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '12px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="rpm" name="RPM" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="fuel" name="FUEL" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="oil_press" name="OIL PRESS" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="battery" name="BATTERY" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="coolant" name="COOLANT" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="oil_temp" name="OIL TEMP" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>
                </Grid>

                {/* Right Column: Maintenance Lifecycle */}
                <Grid item xs={12} md={3.5}>
                    <Box sx={{ 
                        height: '100%', 
                        bgcolor: 'rgba(30, 41, 59, 0.25)', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden'
                    }}>
                        <MaintenancePanel engineData={engineData} />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
