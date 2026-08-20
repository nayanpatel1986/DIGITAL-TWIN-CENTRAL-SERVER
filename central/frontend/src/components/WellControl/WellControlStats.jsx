import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { Activity, Gauge, Thermometer } from 'lucide-react';

const StatItem = ({ label, value, unit, color, icon: Icon }) => (
    <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        px: 2,
        py: 1,
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
            <Typography variant="h5" sx={{ 
                fontWeight: 900, 
                color: 'white', 
                textShadow: `0 0 20px ${color}40`,
                fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                letterSpacing: -0.5
            }}>
                {value.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem' }}>
                {unit}
            </Typography>
        </Box>
        <Box sx={{ 
            width: '40px', 
            height: '2px', 
            mt: 1.5, 
            borderRadius: '2px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: 0.5
        }} />
    </Box>
);

const WellControlStats = ({ data }) => {
    return (
        <Box sx={{ 
            width: '100%',
            p: 0.5, 
            background: 'transparent',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-around',
            minHeight: '120px'
        }}>
            <StatItem 
                label="Annular Pressure" 
                value={data.annular_pressure || 0} 
                unit="PSI" 
                color="#0ea5e9" 
                icon={Gauge} 
            />
            <StatItem 
                label="Manifold Pressure" 
                value={data.manifold_pressure || 0} 
                unit="PSI" 
                color="#6366f1" 
                icon={Activity} 
            />
            <StatItem 
                label="Accumulator Pressure" 
                value={data.accumulator_pressure || 0} 
                unit="PSI" 
                color="#ec4899" 
                icon={Thermometer} 
            />
        </Box>
    );
};

export default WellControlStats;
