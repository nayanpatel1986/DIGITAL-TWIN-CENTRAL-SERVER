import React from 'react';
import { Box, Typography } from '@mui/material';
import { Anchor, Activity, Gauge, RotateCw } from 'lucide-react';

const StatItem = ({ label, value, unit, color, icon: Icon }) => (
    <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        px: 2,
        py: 1.5,
        '&:not(:last-child)::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: '20%',
            height: '60%',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)'
        }
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ 
                p: 0.6, 
                borderRadius: '6px', 
                bgcolor: `${color}10`, 
                border: `1px solid ${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={14} color={color} />
            </Box>
            <Typography variant="caption" sx={{ 
                color: '#94a3b8', 
                fontWeight: 700, 
                letterSpacing: 1, 
                textTransform: 'uppercase', 
                fontSize: '0.65rem' 
            }}>
                {label}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
            <Typography variant="h4" sx={{ 
                fontWeight: 1000, 
                color: 'white', 
                textShadow: `0 0 20px ${color}30`,
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: -1
            }}>
                {typeof value === 'number' ? value.toFixed(1) : value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem' }}>
                {unit}
            </Typography>
        </Box>
        <Box sx={{ 
            width: '30px', 
            height: '1.5px', 
            mt: 1.5, 
            borderRadius: '2px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: 0.4
        }} />
    </Box>
);

const FishingStats = ({ hoisting, pressure, overpull }) => {
    return (
        <Box sx={{ 
            width: '100%',
            p: 0.5, 
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-around',
            minHeight: '130px',
            mb: 3
        }}>
            <StatItem 
                label="Hook Load" 
                value={hoisting.hookLoad} 
                unit="tons" 
                color="#38bdf8" 
                icon={Anchor} 
            />
            <StatItem 
                label="Actual Overpull" 
                value={overpull} 
                unit="tons" 
                color="#ef4444" 
                icon={Gauge} 
            />
            <StatItem 
                label="Rotary Torque" 
                value={hoisting.torque} 
                unit="ft-lbs" 
                color="#a78bfa" 
                icon={RotateCw} 
            />
            <StatItem 
                label="Pump Pressure" 
                value={pressure.pump} 
                unit="psi" 
                color="#f472b6" 
                icon={Activity} 
            />
        </Box>
    );
};

export default FishingStats;
