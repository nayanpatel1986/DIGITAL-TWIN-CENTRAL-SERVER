import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { ShieldAlert } from 'lucide-react';
import { useRig } from '../../context/RigContext';
import WellControlStats from './WellControlStats';
import BOPStack from './BOPStack';
import KillSheet from './KillSheet';

const WellControlDashboard = () => {
    const { globalRigData, apiBaseUrl, socket } = useRig();
    const [layout, setLayout] = useState([
        { id: 'wellcontrol_stats', type: 'stats', gridWidth: 12 },
        { id: 'bop_stack', type: 'bop', gridWidth: 4 },
        { id: 'killsheet', type: 'killsheet', gridWidth: 8 }
    ]);
    
    useEffect(() => {
        // Load layout
        fetch(`${apiBaseUrl}/api/dashboard/layout?page=wellcontrol`)
            .then(res => res.json())
            .then(config => {
                if (config.layout && config.layout.length > 0) {
                    setLayout(config.layout);
                }
            })
            .catch(err => console.error("Failed to load wellcontrol layout", err));

        if (socket) {
            socket.on('dashboard_layout_update', (config) => {
                if (config.pages?.wellcontrol?.layout) {
                    setLayout(config.pages.wellcontrol.layout);
                }
            });
        }
        return () => socket?.off('dashboard_layout_update');
    }, [apiBaseUrl, socket]);

    return (
        <Box sx={{ p: 2, bgcolor: '#0f172a', minHeight: '100vh', color: 'white' }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 1.5,
                p: 1.5,
                bgcolor: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                        p: 1, 
                        bgcolor: 'rgba(56, 189, 248, 0.1)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.1)'
                    }}>
                        <ShieldAlert color="#38bdf8" size={24} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, mb: 0, letterSpacing: -0.5 }}>Well Control Center</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            <Box sx={{ 
                                width: 6, 
                                height: 6, 
                                bgcolor: '#ef4444', 
                                borderRadius: '50%', 
                                mr: 1, 
                                animation: 'pulseIndicator 2s infinite'
                            }} />
                            Real-time BOP & Pressure Monitoring
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {layout.map((item) => (
                    <Grid item key={item.id} xs={12} md={item.gridWidth || 4}>
                        <Box sx={{ 
                            height: '100%',
                            bgcolor: 'rgba(30, 41, 59, 0.3)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(12px)',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                            {item.type === 'stats' ? (
                                <WellControlStats data={globalRigData.well_control || {}} />
                            ) : item.type === 'bop' || item.type === 'bop_stack' ? (
                                <BOPStack data={globalRigData.well_control || {}} />
                            ) : item.type === 'killsheet' ? (
                                <KillSheet data={globalRigData.well_control || {}} />
                            ) : null}
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default WellControlDashboard;
