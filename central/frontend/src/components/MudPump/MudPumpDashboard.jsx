import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Gauge, Droplets, Waves, Edit2, Check, Settings } from 'lucide-react';
import { useRig } from '../../context/RigContext';
import ResizablePanel from '../RomCommon/ResizablePanel';

const ICONS = { Activity, Gauge, Droplets, Waves };

const DEFAULT_MUD_PUMP_LAYOUT = [
    { id: 'spm', type: 'metric', title: 'PUMP SPM', dataKey: 'spm', unit: 'SPM', iconName: 'Activity', color: '#ec4899', gridWidth: 3 },
    { id: 'pressure', type: 'metric', title: 'PRESSURE', dataKey: 'pressure', unit: 'psi', iconName: 'Gauge', color: '#ef4444', gridWidth: 3 },
    { id: 'flow_in', type: 'metric', title: 'FLOW IN', dataKey: 'flow_in', unit: 'GPM', iconName: 'Droplets', color: '#3b82f6', gridWidth: 3 },
    { id: 'flow_out', type: 'metric', title: 'FLOW OUT', dataKey: 'flow_out', unit: 'GPM', iconName: 'Waves', color: '#22c55e', gridWidth: 3 },
    { id: 'total_strokes', type: 'metric', title: 'TOTAL STROKES', dataKey: 'total_spm', unit: 'Strokes', iconName: 'Activity', color: '#f59e0b', gridWidth: 3 },
    { id: 'trend', type: 'trend', gridWidth: 12 }
];

function MetricCard({ title, value, unit, icon: Icon, color = '#38bdf8' }) {
    return (
        <Paper sx={{ p: 2, bgcolor: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}20`, color: color }}>
                <Icon size={24} />
            </Box>
            <Box>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>{title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {value} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{unit}</span>
                </Typography>
            </Box>
        </Paper>
    );
}

export default function MudPumpDashboard() {
    const { globalRigData, apiBaseUrl, socket } = useRig();
    const [editMode, setEditMode] = useState(false);
    const [layout, setLayout] = useState(DEFAULT_MUD_PUMP_LAYOUT);

    const [pumpData, setPumpData] = useState(() => {
        const initial = {
            spm: 0,
            pressure: 0,
            total_spm: 0,
            flow_in: 0,
            flow_out: 0
        };
        return globalRigData?.mudpump ?? initial;
    });
    const [flowTrend, setFlowTrend] = useState([]);

    useEffect(() => {
        // Load layout
        fetch(`${apiBaseUrl}/api/dashboard/layout?page=mudpump`)
            .then(res => res.json())
            .then(config => {
                if (config.layout && config.layout.length > 0) {
                    setLayout(config.layout);
                }
            })
            .catch(err => console.error("Failed to load mudpump layout", err));

        if (socket) {
            socket.on('dashboard_layout_update', (config) => {
                if (config.pages?.mudpump?.layout) {
                    setLayout(config.pages.mudpump.layout);
                }
            });
        }
        return () => socket?.off('dashboard_layout_update');
    }, [apiBaseUrl, socket]);

    useEffect(() => {
        if (!globalRigData || !globalRigData.mudpump) return;

        const data = globalRigData;
        setPumpData(data.mudpump);

        // Update Flow Trend
        setFlowTrend(prev => {
            const newPoint = {
                name: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                flow_in: data.mudpump.flow_in,
                flow_out: data.mudpump.flow_out
            };
            const updated = [...prev, newPoint];
            if (updated.length > 30) updated.shift();
            return updated;
        });
    }, [globalRigData]);

    const saveLayout = (newLayout) => {
        setLayout(newLayout);
        fetch(`${apiBaseUrl}/api/dashboard/layout?page=mudpump`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout: newLayout })
        }).catch(err => console.error("Failed to save mudpump layout", err));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: 'rgba(30, 41, 59, 0.4)', borderRadius: 1, border: '1px solid #334155' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold', color: 'white' }}>
                    <Droplets color="#38bdf8" /> Mud Pump #1 Control
                </Typography>
                <Button
                    onClick={() => setEditMode(!editMode)}
                    variant="outlined"
                    startIcon={editMode ? <Check size={18} /> : <Edit2 size={18} />}
                    sx={{ color: editMode ? '#fbbf24' : '#94a3b8', borderColor: editMode ? '#fbbf24' : '#334155', fontWeight: 'bold' }}
                >
                    {editMode ? "FINISH EDITING" : "EDIT LAYOUT"}
                </Button>
            </Box>

            <Grid container spacing={3} id="mudpump-grid-container">
                {layout.map((item) => (
                    <Grid item key={item.id} xs={12} md={item.gridWidth || 3}>
                        <ResizablePanel
                            gridWidth={item.gridWidth || 3}
                            editMode={editMode}
                            containerId="mudpump-grid-container"
                            onResize={(newWidth) => {
                                const newLayout = layout.map(l => l.id === item.id ? { ...l, gridWidth: newWidth } : l);
                                saveLayout(newLayout);
                            }}
                        >
                            {item.type === 'metric' ? (
                                <MetricCard
                                    title={item.title}
                                    value={pumpData[item.dataKey]}
                                    unit={item.unit}
                                    icon={ICONS[item.iconName] || Activity}
                                    color={item.color}
                                />
                            ) : item.type === 'trend' ? (
                                <Paper sx={{ p: 3, bgcolor: '#1e293b', color: 'white', height: '100%', minHeight: 400 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Flow In vs Flow Out Trend</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={flowTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="flow_in" stroke="#3b82f6" name="Flow In" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="flow_out" stroke="#22c55e" name="Flow Out" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Paper>
                            ) : null}
                        </ResizablePanel>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
