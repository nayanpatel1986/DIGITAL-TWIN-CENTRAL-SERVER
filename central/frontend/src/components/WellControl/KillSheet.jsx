import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Divider, Alert } from '@mui/material';
import { Calculator, Save } from 'lucide-react';

const KillSheet = () => {
    // Inputs
    const [inputs, setInputs] = useState({
        sidpp: 500,       // psi
        sicp: 750,        // psi
        omw: 10.0,        // ppg (Original Mud Weight)
        tvd: 10000,       // ft
        pl: 600,          // psi (Pump Pressure @ Slow Circulating Rate)
        shoeTvd: 4000,    // ft (Casing Shoe TVD)
        maxLot: 13.5      // ppg (Max Leak-off Test / Fracture Gradient)
    });

    // Outputs
    const [results, setResults] = useState({
        kmw: 0,
        icp: 0,
        fcp: 0,
        maasp: 0
    });

    // Calculation Logic
    useEffect(() => {
        const { sidpp, sicp, omw, tvd, pl, shoeTvd, maxLot } = inputs;

        // 1. Kill Mud Weight (ppg)
        // KMW = OMW + (SIDPP / (0.052 * TVD))
        const kmwVal = Number(omw) + (Number(sidpp) / (0.052 * Number(tvd)));

        // 2. Initial Circulating Pressure (psi)
        // ICP = SIDPP + PL
        const icpVal = Number(sidpp) + Number(pl);

        // 3. Final Circulating Pressure (psi)
        // FCP = PL * (KMW / OMW)
        const fcpVal = Number(pl) * (kmwVal / Number(omw));

        // 4. MAASP (psi)
        // MAASP = (Max LOT - Current MW) * 0.052 * Shoe TVD
        const maaspVal = (Number(maxLot) - Number(omw)) * 0.052 * Number(shoeTvd);

        setResults({
            kmw: isFinite(kmwVal) ? kmwVal.toFixed(2) : 0,
            icp: isFinite(icpVal) ? icpVal.toFixed(0) : 0,
            fcp: isFinite(fcpVal) ? fcpVal.toFixed(0) : 0,
            maasp: isFinite(maaspVal) ? maaspVal.toFixed(0) : 0
        });
    }, [inputs]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Box sx={{ p: 2, color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ p: 0.8, bgcolor: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <Calculator size={18} color="#fbbf24" />
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Kill Sheet Calculator</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5, fontSize: '0.65rem' }}>API RP 59 Standard Compliant</Typography>
                </Box>
            </Box>

            <Grid container spacing={1.5} sx={{ flex: 1 }}>
                {/* --- INPUT SECTION --- */}
                <Grid item xs={12} lg={6}>
                    <Typography variant="caption" sx={{ color: '#475569', mb: 2, display: 'block', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Operational Inputs
                    </Typography>

                    <Grid container spacing={2}>
                        {[
                            { label: 'SIDPP', name: 'sidpp', unit: 'PSI' },
                            { label: 'SICP', name: 'sicp', unit: 'PSI' },
                            { label: 'Original MW', name: 'omw', unit: 'PPG' },
                            { label: 'True Vertical Depth', name: 'tvd', unit: 'FT' },
                            { label: 'Pump Pressure @ SCR', name: 'pl', unit: 'PSI' },
                            { label: 'Casing Shoe TVD', name: 'shoeTvd', unit: 'FT' },
                        ].map((field) => (
                            <Grid item xs={6} key={field.name}>
                                <TextField
                                    label={`${field.label} (${field.unit})`}
                                    name={field.name}
                                    type="number"
                                    value={inputs[field.name]}
                                    onChange={handleChange}
                                    fullWidth
                                    size="small"
                                    variant="filled"
                                    sx={{ 
                                        '& .MuiFilledInput-root': { 
                                            bgcolor: 'rgba(15, 23, 42, 0.4)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            '&:before, &:after': { display: 'none' },
                                            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.6)' },
                                            '&.Mui-focused': { border: '1px solid #3b82f6', bgcolor: 'rgba(15, 23, 42, 0.8)' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#64748b', fontSize: '0.75rem', fontWeight: 600 },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                                    }}
                                />
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <TextField
                                label="Max LOT (ppg)" name="maxLot" type="number"
                                value={inputs.maxLot} onChange={handleChange}
                                fullWidth size="small" variant="filled"
                                sx={{ 
                                    '& .MuiFilledInput-root': { 
                                        bgcolor: 'rgba(15, 23, 42, 0.4)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        color: 'white',
                                        '&:before, &:after': { display: 'none' }
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* --- OUTPUT SECTION --- */}
                <Grid item xs={12} lg={6}>
                    <Typography variant="caption" sx={{ color: '#475569', mb: 2, display: 'block', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Calculated Parameters
                    </Typography>

                    <Grid container spacing={2}>
                        {/* KMW */}
                        <Grid item xs={12}>
                                <Box sx={{ 
                                    p: 1.5, 
                                    bgcolor: 'rgba(239, 68, 68, 0.05)', 
                                    borderRadius: '12px', 
                                    border: '1px solid rgba(239, 68, 68, 0.12)', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center'
                                }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800, letterSpacing: 0.5, fontSize: '0.6rem' }}>KILL MUD WEIGHT</Typography>
                                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 900, fontFamily: '"JetBrains Mono", monospace' }}>
                                        {results.kmw} <span style={{ fontSize: '0.5em', color: '#64748b' }}>PPG</span>
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.6rem' }}>INCREASE</Typography>
                                    <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 800 }}>+{(results.kmw - inputs.omw).toFixed(2)}</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* ICP & FCP */}
                        <Grid item xs={6}>
                            <Box sx={{ p: 1.2, bgcolor: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.6rem' }}>ICP</Typography>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, fontFamily: '"JetBrains Mono", monospace' }}>
                                    {results.icp} <span style={{ fontSize: '0.5em', color: '#64748b' }}>PSI</span>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ p: 1.2, bgcolor: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.6rem' }}>FCP</Typography>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, fontFamily: '"JetBrains Mono", monospace' }}>
                                    {results.fcp} <span style={{ fontSize: '0.5em', color: '#64748b' }}>PSI</span>
                                </Typography>
                            </Box>
                        </Grid>

                        {/* MAASP */}
                        <Grid item xs={12}>
                            <Box sx={{ p: 1.2, bgcolor: 'rgba(234, 179, 8, 0.05)', borderRadius: '10px', border: '1px solid rgba(234, 179, 8, 0.12)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#eab308', fontWeight: 800, fontSize: '0.6rem' }}>MAASP LIMIT</Typography>
                                    <Box sx={{ width: 6, height: 6, bgcolor: '#eab308', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                </Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, fontFamily: '"JetBrains Mono", monospace' }}>
                                    {results.maasp} <span style={{ fontSize: '0.5em', color: '#64748b' }}>PSI</span>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* --- ACTION FOOTER --- */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                    variant="text" 
                    sx={{ color: '#64748b', fontWeight: 700, borderRadius: '10px', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                    EXPORT PDF
                </Button>
                <Button 
                    variant="contained" 
                    startIcon={<Save size={18} />} 
                    sx={{ 
                        bgcolor: '#3b82f6', 
                        fontWeight: 800, 
                        borderRadius: '10px', 
                        px: 3,
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                        '&:hover': { bgcolor: '#2563eb', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)' }
                    }}
                >
                    SAVE DATA
                </Button>
            </Box>
        </Box>
    );
};

export default KillSheet;
