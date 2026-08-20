import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, LinearProgress, Button, Alert, Chip } from '@mui/material';
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const MaintenancePanel = ({ engineData }) => {
    // Simulated State (In real app, fetch from backend DB)
    const [maintenanceState, setMaintenanceState] = useState({
        totalRunningHours: 4850,
        lastServicePM1: 4700,
        lastServicePM2: 4500,
        lastServicePM3: 4000,
        lastServicePM4: 2000,
        lastServicePM5: 0
    });

    const [alerts, setAlerts] = useState([]);

    // Intervals
    const INTERVAL_PM1 = 250;   
    const INTERVAL_PM2 = 500;   
    const INTERVAL_PM3 = 1000;  
    const INTERVAL_PM4 = 2500;  
    const INTERVAL_PM5 = 5000;  

    useEffect(() => {
        const newAlerts = [];
        if (maintenanceState.totalRunningHours - maintenanceState.lastServicePM1 >= INTERVAL_PM1) {
            newAlerts.push({ type: 'PM1', severity: 'warning', message: 'PM1 Inspection Overdue: Routine Check Required' });
        }
        if (maintenanceState.totalRunningHours - maintenanceState.lastServicePM2 >= INTERVAL_PM2) {
            newAlerts.push({ type: 'PM2', severity: 'error', message: 'PM2 Service Critical: Oil & Filters Required' });
        }
        setAlerts(newAlerts);
    }, [maintenanceState]);

    const performService = (type) => {
        const key = `lastService${type}`;
        setMaintenanceState(prev => ({
            ...prev,
            [key]: prev.totalRunningHours
        }));
    };

    const ServiceCard = ({ type, label, interval, lastService }) => {
        const hoursSince = maintenanceState.totalRunningHours - lastService;
        const hoursRemaining = interval - hoursSince;
        const percent = Math.min(100, (hoursSince / interval) * 100);
        const isDue = hoursRemaining <= 0;
        const isClose = hoursRemaining <= (interval * 0.1);

        return (
            <Paper sx={{ 
                p: 0.8, 
                bgcolor: 'rgba(30, 41, 59, 0.4)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '8px',
                height: '100%'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25, alignItems: 'center' }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>{label}</Typography>
                        <Typography variant="subtitle2" sx={{ color: '#475569', fontSize: '0.65rem' }}>{type}</Typography>
                    </Box>
                    {isDue ?
                        <Chip size="small" label="DUE" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ef444420', color: '#ef4444', fontWeight: 800 }} /> :
                        <Chip size="small" label="OK" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#22c55e10', color: '#22c55e', fontWeight: 800 }} />
                    }
                </Box>

                <Box sx={{ mb: 0.25 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontFamily: 'monospace', fontSize: '1rem', lineHeight: 1.2 }}>
                        {Math.max(0, hoursRemaining).toFixed(0)} <span style={{ fontSize: '0.5em', color: '#475569' }}>HRS</span>
                    </Typography>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                        mb: 1, height: 4, borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        '& .MuiLinearProgress-bar': { 
                            bgcolor: isDue ? '#ef4444' : isClose ? '#f59e0b' : '#3b82f6',
                            borderRadius: 2
                        }
                    }}
                />

                <Button
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    startIcon={<Wrench size={12} />}
                    onClick={() => performService(type)}
                    sx={{
                        py: 0.2,
                        fontSize: '0.7rem',
                        color: '#64748b',
                        borderColor: 'rgba(255,255,255,0.1)',
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { borderColor: 'white', color: 'white' }
                    }}
                >
                    Log Service
                </Button>
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 1, color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                    <Typography variant="body1" sx={{ fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Clock size={16} color="#fbbf24" />
                        Maintenance Lifecycle
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'monospace', color: '#fbbf24', fontSize: '1.1rem' }}>
                        {maintenanceState.totalRunningHours.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.6rem' }}>ENGINE HOURS</Typography>
                </Box>
            </Box>

            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <ServiceCard type="PM1" label="Inspection" interval={INTERVAL_PM1} lastService={maintenanceState.lastServicePM1} />
                </Grid>
                <Grid item xs={12}>
                    <ServiceCard type="PM2" label="Oil/Filters" interval={INTERVAL_PM2} lastService={maintenanceState.lastServicePM2} />
                </Grid>
                <Grid item xs={12}>
                    <ServiceCard type="PM3" label="Comprehensive" interval={INTERVAL_PM3} lastService={maintenanceState.lastServicePM3} />
                </Grid>
                <Grid item xs={12}>
                    <ServiceCard type="PM4" label="Top End" interval={INTERVAL_PM4} lastService={maintenanceState.lastServicePM4} />
                </Grid>
                <Grid item xs={12}>
                    <ServiceCard type="PM5" label="Overhaul" interval={INTERVAL_PM5} lastService={maintenanceState.lastServicePM5} />
                </Grid>
            </Grid>

            {alerts.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Grid container spacing={1}>
                        {alerts.map((alert, idx) => (
                            <Grid item xs={12} key={idx}>
                                <Alert severity={alert.severity} variant="outlined" sx={{ borderRadius: '8px', color: 'white', py: 0 }}>
                                    {alert.message}
                                </Alert>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default MaintenancePanel;
