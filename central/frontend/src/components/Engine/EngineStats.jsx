import React from 'react';
import { Box, Typography } from '@mui/material';
import { Activity, Gauge, Thermometer } from 'lucide-react';

const StatItem = ({ label, value, unit, color, icon: Icon }) => (
    <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        px: 3,
        py: 2,
        '&:not(:last-child)::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: '15%',
            height: '70%',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)'
        }
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ 
                p: 0.8, 
                borderRadius: '8px', 
                bgcolor: `${color}15`, 
                border: `1px solid ${color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={16} color={color} />
            </Box>
            <Typography variant="caption" sx={{ 
                color: '#94a3b8', 
                fontWeight: 700, 
                letterSpacing: 1.2, 
                textTransform: 'uppercase', 
                fontSize: '0.7rem' 
            }}>
                {label}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h3" sx={{ 
                fontWeight: 900, 
                color: 'white', 
                textShadow: `0 0 30px ${color}60`,
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: -1
            }}>
                {Number(value || 0).toLocaleString()}
            </Typography>
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.9rem' }}>
                {unit}
            </Typography>
        </Box>
        <Box sx={{ 
            width: '60px', 
            height: '3px', 
            mt: 2, 
            borderRadius: '4px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 15px ${color}`,
            opacity: 0.8
        }} />
    </Box>
);

const EngineStats = ({ data }) => {
    return (
        <Box sx={{ 
            width: '100%',
            p: 1, 
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-around',
            minHeight: '160px'
        }}>
            <StatItem 
                label="ENGINE RPM" 
                value={data.rpm || 0} 
                unit="RPM" 
                color="#ec4899" 
                icon={Activity} 
            />
            <StatItem 
                label="OIL PRESSURE" 
                value={data.oil_pressure || 0} 
                unit="kPa" 
                color="#f43f5e" 
                icon={Gauge} 
            />
            <StatItem 
                label="COOLANT TEMP" 
                value={data.coolant_temp || 0} 
                unit="°C" 
                color="#34d399" 
                icon={Thermometer} 
            />
            <StatItem 
                label="EXHAUST TEMP" 
                value={data.exhaust_temp || 0} 
                unit="°C" 
                color="#f97316" 
                icon={Thermometer} 
            />
        </Box>
    );
};

export default EngineStats;
