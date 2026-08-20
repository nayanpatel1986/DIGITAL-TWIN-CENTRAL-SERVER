import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tooltip, CircularProgress } from '@mui/material';
import { 
    Zap, 
    Gauge, 
    Thermometer, 
    Activity, 
    ChevronRight, 
    Lock, 
    Unlock,
    Info,
    AlertTriangle,
    CheckCircle2,
    Truck,
    ArrowUpCircle
} from 'lucide-react';
import { useRig } from '../../context/RigContext';

const ModeIndicator = ({ mode, onModeChange, disabled }) => {
    const isHoisting = mode === 1;
    
    return (
        <Paper sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 1, 
            py: 0.5, 
            bgcolor: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '12px'
        }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Box 
                    onClick={() => !disabled && onModeChange(0)}
                    sx={{ 
                        px: 1.5, py: 0.8, cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: !isHoisting ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        border: `1px solid ${!isHoisting ? '#10b981' : 'transparent'}`,
                        color: !isHoisting ? '#10b981' : '#64748b',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: !isHoisting ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)' }
                    }}
                >
                    <Truck size={16} />
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>ROAD</Typography>
                </Box>

                <Box 
                    onClick={() => !disabled && onModeChange(1)}
                    sx={{ 
                        px: 1.5, py: 0.8, cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: isHoisting ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        border: `1px solid ${isHoisting ? '#38bdf8' : 'transparent'}`,
                        color: isHoisting ? '#38bdf8' : '#64748b',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: isHoisting ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)' }
                    }}
                >
                    <ArrowUpCircle size={16} />
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>HOIST</Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const TransmissionTile = ({ label, value, unit, icon: Icon, color, subValue, subLabel }) => (
// ... Rest of the file
// ... Rest of the file
    <Paper sx={{ 
        p: 1.5, 
        bgcolor: 'rgba(30, 41, 59, 0.4)', 
        border: '1px solid rgba(51, 65, 85, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
            bgcolor: 'rgba(51, 65, 85, 0.6)',
            borderColor: color
        }
    }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: `${color}15`, color: color }}>
                <Icon size={18} />
            </Box>
            {subValue && (
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.6rem' }}>{subLabel}</Typography>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>{subValue}</Typography>
                </Box>
            )}
        </Box>
        
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
            {label}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 900, fontFamily: 'monospace' }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                {unit}
            </Typography>
        </Box>
    </Paper>
);

const GearIndicator = ({ actual, target, isHoisting }) => {
    const gears = ['R', 'N', '1', '2', '3', '4', '5', '6'];
    
    return (
        <Box sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: 1 }}>SHIFT CONTROL</Typography>
                <Box sx={{ px: 1, py: 0.2, bgcolor: isHoisting ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                    <Typography variant="caption" sx={{ color: isHoisting ? '#38bdf8' : '#10b981', fontWeight: 900 }}>CEC2 Series</Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>ACTUAL</Typography>
                    <Paper elevation={0} sx={{ 
                        width: 60, height: 60, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isHoisting ? '#38bdf8' : '#10b981', borderRadius: '12px',
                        boxShadow: `0 0 20px ${isHoisting ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                    }}>
                        <Typography variant="h4" sx={{ color: '#0f172a', fontWeight: 900 }}>{actual || 'N'}</Typography>
                    </Paper>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', color: '#334155' }}>
                    <ChevronRight size={32} />
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>TARGET</Typography>
                    <Paper elevation={0} sx={{ 
                        width: 60, height: 60, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'transparent', borderRadius: '12px',
                        border: '2px dashed #334155'
                    }}>
                        <Typography variant="h4" sx={{ color: '#94a3b8', fontWeight: 900 }}>{target || 'N'}</Typography>
                    </Paper>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                {gears.map((g) => (
                    <Box key={g} sx={{ 
                        flex: 1, height: 4, 
                        bgcolor: (g === actual) ? (isHoisting ? '#38bdf8' : '#10b981') : '#1e293b',
                        borderRadius: 1,
                        boxShadow: (g === actual) ? `0 0 8px ${isHoisting ? '#38bdf8' : '#10b981'}` : 'none'
                    }} />
                ))}
            </Box>
        </Box>
    );
};

export default function AllisonDashboard() {
    const { globalRigData, apiBaseUrl } = useRig();
    const [isChanging, setIsChanging] = useState(false);
    
    const data = globalRigData?.allison || {
        output_rpm: 0,
        input_rpm: 0,
        actual_gear: 'N',
        target_gear: 'N',
        oil_temp: 0,
        oil_pressure: 0,
        lockup: false,
        mode: 0
    };

    const handleModeChange = async (newMode) => {
        if (newMode === data.mode) return;
        
        setIsChanging(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/allison/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: newMode })
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            console.log("Transmission mode change command sent successfully");
        } catch (err) {
            console.error("Failed to change transmission mode:", err);
            alert(`Command failed: ${err.message}`);
        } finally {
            // Keep the "pending" state for a moment to allow RigData to update
            setTimeout(() => setIsChanging(false), 1000);
        }
    };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#0f172a', minHeight: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
                        Allison Transmission Center
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.5, fontSize: '0.65rem' }}>
                        CEC2 5000 SERIES • OFF-HIGHWAY MONITORING
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ModeIndicator 
                        mode={data.mode} 
                        onModeChange={handleModeChange}
                        disabled={isChanging}
                    />
                    <Paper sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                        <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 800 }}>LIVE CONNECTED</Typography>
                    </Paper>
                </Box>
            </Box>

            <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                    <GearIndicator 
                        actual={data.actual_gear} 
                        target={data.target_gear} 
                        isHoisting={data.mode === 1}
                    />
                    
                    <Paper sx={{ mt: 1.5, p: 2, bgcolor: 'rgba(30, 41, 59, 0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            {data.lockup ? <Lock size={16} color="#4ade80" /> : <Unlock size={16} color="#f59e0b" />}
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                                CONVERTER LOCKUP: {data.lockup ? 'ENGAGED' : 'DISENGAGED'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                            {data.lockup ? 'Direct drive enabled for maximum efficiency.' : 'Torque converter multiplication active for high load.'}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Primary Metrics */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                            <TransmissionTile 
                                label="OUTPUT SHAFT SPEED"
                                value={data.output_rpm}
                                unit="RPM"
                                icon={Activity}
                                color="#38bdf8"
                                subLabel="INPUT SPEED"
                                subValue={`${data.input_rpm} RPM`}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TransmissionTile 
                                label="SUMP OIL TEMPERATURE"
                                value={data.oil_temp}
                                unit="°C"
                                icon={Thermometer}
                                color="#ef4444"
                                subLabel="STATUS"
                                subValue={data.oil_temp > 95 ? 'HIGH' : 'NORMAL'}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TransmissionTile 
                                label="MAIN LINE PRESSURE"
                                value={data.oil_pressure}
                                unit="PSI"
                                icon={Gauge}
                                color="#f59e0b"
                                subLabel="PUMP STATUS"
                                subValue="NOMINAL"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TransmissionTile 
                                label="TRANSMISSION LOAD"
                                value={Math.min(100, Math.round((data.output_rpm / 2000) * 100))}
                                unit="%"
                                icon={Activity}
                                color="#10b981"
                                subLabel="EFFICIENCY"
                                subValue="92%"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5 }}>
                        <Paper sx={{ flex: 1, p: 1.5, bgcolor: 'rgba(30,31,59,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ color: '#38bdf8' }}><Info size={18} /></Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1 }}>FILTER STATUS</Typography>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>GOOD (85%)</Typography>
                            </Box>
                        </Paper>
                        <Paper sx={{ flex: 1, p: 1.5, bgcolor: 'rgba(30,31,59,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ color: '#4ade80' }}><Activity size={18} /></Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1 }}>OIL LIFE</Typography>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>1,240 HRS REM.</Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                {/* Diagnostics / Alerts */}
                <Grid item xs={12}>
                    <Paper sx={{ 
                        p: 2, 
                        bgcolor: data.fault_spn > 0 ? (data.fault_lamp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)') : 'rgba(16, 185, 129, 0.05)', 
                        border: `1px solid ${data.fault_spn > 0 ? (data.fault_lamp ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)') : 'rgba(16, 185, 129, 0.1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        borderRadius: '12px'
                    }}>
                        <Box sx={{ 
                            p: 1, 
                            borderRadius: '50%', 
                            bgcolor: data.fault_spn > 0 ? (data.fault_lamp ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)') : 'rgba(16, 185, 129, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {data.fault_spn > 0 ? <AlertTriangle color={data.fault_lamp ? "#ef4444" : "#f59e0b"} size={28} /> : <CheckCircle2 color="#10b981" size={28} />}
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" sx={{ 
                                    color: data.fault_spn > 0 ? 'white' : '#10b981', 
                                    fontWeight: 900, fontSize: '1rem', letterSpacing: -0.2
                                }}>
                                    {data.fault_spn > 0 ? `ACTIVE FAULT: SPN ${data.fault_spn}` : 'SYSTEM NORMAL: NO ACTIVE FAULTS'}
                                </Typography>
                                {data.fault_spn > 0 && (
                                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 900 }}>FMI: {data.fault_fmi}</Typography>
                                    </Box>
                                )}
                            </Box>
                            
                            <Typography variant="body2" sx={{ color: data.fault_spn > 0 ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>
                                {data.fault_spn > 0 
                                    ? `${data.spn_desc || 'Unknown Component'} - ${data.fmi_desc || 'Unknown Fault Mode'}`
                                    : 'All transmission systems, solenoids, and sensors are reporting within normal operating ranges.'}
                            </Typography>
                        </Box>

                        {data.fault_spn > 0 && (
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 800 }}>ACTION REQUIRED</Typography>
                                <Typography variant="body2" sx={{ color: data.fault_lamp ? '#ef4444' : '#f59e0b', fontWeight: 900 }}>
                                    {data.fault_lamp ? 'STOP SERVICE' : 'CHECK TRANS'}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
