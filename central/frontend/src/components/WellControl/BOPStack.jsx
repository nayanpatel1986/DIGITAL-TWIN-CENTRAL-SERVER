import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const RamIndicator = ({ label, active }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box
            sx={{
                width: 10, height: 10, borderRadius: '50%',
                bgcolor: active ? '#ef4444' : '#1e293b',
                border: active ? '2px solid #f87171' : '2px solid #475569',
                boxShadow: active ? '0 0 8px #ef4444' : 'none',
                transition: 'all 0.3s'
            }}
        />
        <Typography variant="caption" sx={{ color: active ? 'white' : '#64748b', fontWeight: active ? 'bold' : 'normal', fontSize: '0.65rem' }}>
            {label}
        </Typography>
    </Box>
);

const BOPStack = ({ rams }) => {
    // Default safe state if props not provided
    const status = {
        annular: rams?.annular || { open: false, close: false },
        pipe: rams?.pipe || { open: false, close: false },
        blind: rams?.blind || { open: false, close: false },
        shear: rams?.shear || false
    };

    const RamPopup = ({ text, color, top }) => (
        <Box sx={{
            position: 'absolute', top: top, left: '50%', transform: 'translateX(-50%)',
            bgcolor: color === 'red' ? 'rgba(239, 68, 68, 0.98)' : 'rgba(34, 197, 94, 0.98)',
            px: 1, py: 0.5, borderRadius: '6px',
            border: `1px solid ${color === 'red' ? '#fca5a5' : '#86efac'}`,
            boxShadow: `0 4px 15px ${color === 'red' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
            zIndex: 10, textAlign: 'center', pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            animation: 'pulseGlowBOP 1.5s ease-in-out infinite alternate',
            '@keyframes pulseGlowBOP': {
                '0%': { opacity: 1, transform: 'translateX(-50%) scale(1)' },
                '100%': { opacity: 0.9, transform: 'translateX(-50%) scale(1.05)' }
            }
        }}>
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, fontSize: 10, letterSpacing: 1 }}>
                {text}
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ 
            width: '100%',
            height: '100%',
            color: 'white', 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2, 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 1
        }}>

            {/* --- BOP STACK SVG --- */}
            <Box sx={{ position: 'relative', width: 180, height: 420, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
                <svg width="100%" height="100%" viewBox="0 0 200 500" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="bop-metal" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="50%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <linearGradient id="ram-active" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#b91c1c" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    {/* Central Bore */}
                    <rect x="92" y="0" width="16" height="500" fill="#020617" opacity="0.6" />

                    {/* --- 1. ANNULAR PREVENTER (TOP) --- */}
                    <path d="M 50 20 L 150 20 L 160 80 L 150 120 L 50 120 L 40 80 Z" fill="url(#bop-metal)" stroke="#475569" strokeWidth="1.5" />
                    <rect x="65" y="45" width="70" height="50" rx="6" fill={status.annular.close ? 'url(#ram-active)' : '#0f172a'} stroke="#64748b" strokeWidth="1" />
                    <text x="100" y="75" textAnchor="middle" fill={status.annular.close ? "white" : "#94a3b8"} fontSize="9" fontWeight="800">ANNULAR</text>

                    {/* --- 2. PIPE RAMS (UPPER) --- */}
                    <g transform="translate(0, 160)">
                        <rect x="40" y="0" width="120" height="80" rx="8" fill="url(#bop-metal)" stroke="#475569" strokeWidth="1.5" />
                        <rect x="45" y="20" width={status.pipe.close ? "55" : "32"} height="40" rx="2" fill={status.pipe.close ? '#ef4444' : '#0f172a'} stroke="#475569" style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <rect x={status.pipe.close ? "100" : "123"} y="20" width={status.pipe.close ? "55" : "32"} height="40" rx="2" fill={status.pipe.close ? '#ef4444' : '#0f172a'} stroke="#475569" style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <text x="100" y="48" textAnchor="middle" fill={status.pipe.close ? "white" : "#94a3b8"} fontSize="9" fontWeight="800">PIPE RAM</text>
                    </g>
                    <rect x="70" y="140" width="60" height="20" fill="url(#bop-metal)" stroke="#475569" />

                    {/* --- 3. BLIND RAMS (MIDDLE) --- */}
                    <g transform="translate(0, 260)">
                        <rect x="40" y="0" width="120" height="80" rx="8" fill="url(#bop-metal)" stroke="#475569" strokeWidth="1.5" />
                        <rect x="45" y="20" width={status.blind.close ? "55" : "32"} height="40" rx="2" fill={status.blind.close ? '#ef4444' : '#0f172a'} stroke="#475569" style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <rect x={status.blind.close ? "100" : "123"} y="20" width={status.blind.close ? "55" : "32"} height="40" rx="2" fill={status.blind.close ? '#ef4444' : '#0f172a'} stroke="#475569" style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <text x="100" y="48" textAnchor="middle" fill={status.blind.close ? "white" : "#94a3b8"} fontSize="9" fontWeight="800">BLIND RAM</text>
                    </g>
                    <rect x="70" y="240" width="60" height="20" fill="url(#bop-metal)" stroke="#475569" />

                    {/* --- 4. SHEAR RAMS (BOTTOM) --- */}
                    <g transform="translate(0, 360)">
                        <rect x="40" y="0" width="120" height="80" rx="8" fill="url(#bop-metal)" stroke="#475569" strokeWidth="1.5" />
                        <rect x="45" y="20" width={status.shear ? "55" : "32"} height="40" rx="2" fill={status.shear ? '#ef4444' : '#0f172a'} stroke="#475569" style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <rect x={status.shear ? "100" : "123"} y="20" width={status.shear ? "55" : "32"} height="40" rx="2" fill={status.shear ? '#ef4444' : '#0f172a'} stroke="#475569" style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        <text x="100" y="48" textAnchor="middle" fill={status.shear ? "white" : "#94a3b8"} fontSize="9" fontWeight="800">SHEAR RAM</text>
                    </g>
                    <rect x="70" y="340" width="60" height="20" fill="url(#bop-metal)" stroke="#475569" />

                    {/* Wellhead Connector */}
                    <path d="M 60 460 L 140 460 L 155 500 L 45 500 Z" fill="url(#bop-metal)" stroke="#475569" strokeWidth="1.5" />
                </svg>

                {/* --- DYNAMIC POPUPS --- */}
                {status.annular.close && <RamPopup text="ANNULAR CLOSED" color="red" top="10%" />}
                {status.pipe.close && <RamPopup text="PIPE RAM CLOSED" color="red" top="36%" />}
                {status.blind.close && <RamPopup text="BLIND RAM CLOSED" color="red" top="56%" />}
                {status.shear && <RamPopup text="SHEAR RAM CLOSED" color="red" top="76%" />}
            </Box>

            {/* --- DIGITAL INDICATORS --- */}
            <Box sx={{ width: '100%', px: 1.5 }}>
                <Typography variant="overline" sx={{ color: '#475569', fontWeight: 900, letterSpacing: 1, display: 'block', mb: 1, textAlign: 'center', fontSize: '0.6rem' }}>
                    BARRIER STATUS
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <RamIndicator label="ANNULAR" active={status.annular.close} />
                    <RamIndicator label="PIPE RAMS" active={status.pipe.close} />
                    <RamIndicator label="BLIND RAMS" active={status.blind.close} />
                    <RamIndicator label="SHEAR RAMS" active={status.shear} />
                </Box>

                <Box sx={{ 
                    mt: 1.5, 
                    p: 1, 
                    bgcolor: 'rgba(15, 23, 42, 0.5)', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, mb: 0.2, fontSize: '0.6rem' }}>SYSTEM PRESSURE</Typography>
                    <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 900, fontFamily: '"JetBrains Mono", monospace' }}>
                        3,000 <span style={{ fontSize: 10, color: '#475569' }}>PSI</span>
                    </Typography>
                </Box>
            </Box>

        </Box>
    );
};

export default BOPStack;
