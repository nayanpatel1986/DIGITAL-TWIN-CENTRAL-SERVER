import React from 'react';
import { Box, Typography } from '@mui/material';
import { Activity, Gauge, Thermometer, TrendingUp } from 'lucide-react';

const StatHUDItem = ({ label, value, unit, color, icon: Icon, trend = '+0.2%' }) => (
    <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        px: 4,
        py: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.02)',
        },
        '&:not(:last-child)::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: '20%',
            height: '60%',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)'
        }
    }}>
        {/* Animated Scanline Overlay */}
        <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, height: '2px', 
            bgcolor: `${color}20`, 
            boxShadow: `0 0 10px ${color}40`,
            animation: 'hudScanline 4s linear infinite',
            '@keyframes hudScanline': {
                '0%': { top: '0%' },
                '100%': { top: '100%' }
            },
            pointerEvents: 'none',
            zIndex: 1
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ 
                p: 1, 
                borderRadius: '10px', 
                bgcolor: 'rgba(15, 23, 42, 0.6)', 
                border: `1px solid ${color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 15px ${color}20`
            }}>
                <Icon size={18} color={color} />
            </Box>
            <Box>
                <Typography variant="caption" sx={{ 
                    color: '#64748b', 
                    fontWeight: 800, 
                    letterSpacing: 1.5, 
                    textTransform: 'uppercase', 
                    fontSize: '0.65rem',
                    display: 'block'
                }}>
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp size={10} color="#22c55e" />
                    <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 700, fontSize: '0.6rem' }}>{trend}</Typography>
                </Box>
            </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, position: 'relative' }}>
            <Typography variant="h2" sx={{ 
                fontWeight: 900, 
                color: 'white', 
                textShadow: `0 0 40px ${color}80`,
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: -2,
                fontSize: '3.5rem'
            }}>
                {Number(value || 0).toLocaleString()}
            </Typography>
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 900, letterSpacing: 1 }}>
                {unit}
            </Typography>
        </Box>

        {/* Technical Footer Pulse */}
        <Box sx={{ 
            width: '80%', 
            height: '4px', 
            mt: 3, 
            display: 'flex', 
            gap: '2px',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ 
                    flex: 1, 
                    height: '2px', 
                    bgcolor: color, 
                    opacity: 0.2 + (i * 0.1),
                    animation: 'pulseGlow 2s infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes pulseGlow': {
                        '0%, 100%': { opacity: 0.2, boxShadow: 'none' },
                        '50%': { opacity: 1, boxShadow: `0 0 10px ${color}` }
                    }
                }} />
            ))}
        </Box>
    </Box>
);

const AdvancedEngineStats = ({ data }) => {
    return (
        <Box sx={{ 
            width: '100%',
            p: 2, 
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-around',
            minHeight: '220px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
            {/* HUD Corner Accents */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.2)', borderLeft: '2px solid rgba(255,255,255,0.2)' }} />
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.2)', borderRight: '2px solid rgba(255,255,255,0.2)' }} />
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.2)', borderLeft: '2px solid rgba(255,255,255,0.2)' }} />
            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.2)', borderRight: '2px solid rgba(255,255,255,0.2)' }} />

            <StatHUDItem 
                label="ENGINE RPM" 
                value={data.rpm || 0} 
                unit="RPM" 
                color="#ec4899" 
                icon={Activity} 
                trend="+1.2%"
            />
            <StatHUDItem 
                label="OIL PRESSURE" 
                value={data.oil_pressure || 0} 
                unit="kPa" 
                color="#f43f5e" 
                icon={Gauge} 
                trend="STABLE"
            />
            <StatHUDItem 
                label="COOLANT TEMP" 
                value={data.coolant_temp || 0} 
                unit="°C" 
                color="#34d399" 
                icon={Thermometer} 
                trend="-0.4%"
            />
            <StatHUDItem 
                label="EXHAUST TEMP" 
                value={data.exhaust_temp || 0} 
                unit="°C" 
                color="#f97316" 
                icon={Thermometer} 
                trend="+2.1%"
            />
        </Box>
    );
};

export default AdvancedEngineStats;
