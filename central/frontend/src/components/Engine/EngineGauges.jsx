import React from 'react';
import { Box, Grid } from '@mui/material';
import AnalogGauge from '../RomCommon/AnalogGauge';

const EngineGauges = ({ data }) => {
    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={4} justifyContent="center">
                <Grid item>
                    <AnalogGauge
                        label="Engine RPM"
                        value={data.rpm || 0}
                        min={0}
                        max={2500}
                        unit="RPM"
                        color="#ec4899"
                        size={220}
                    />
                </Grid>
                <Grid item>
                    <AnalogGauge
                        label="Oil Pressure"
                        value={data.oil_pressure || 0}
                        min={0}
                        max={700}
                        unit="kPa"
                        color="#f43f5e"
                        size={220}
                    />
                </Grid>
                <Grid item>
                    <AnalogGauge
                        label="Coolant Temp"
                        value={data.coolant_temp || 0}
                        min={0}
                        max={120}
                        unit="°C"
                        color="#34d399"
                        size={220}
                    />
                </Grid>
                <Grid item>
                    <AnalogGauge
                        label="Exhaust Temp"
                        value={data.exhaust_temp || 0}
                        min={0}
                        max={800}
                        unit="°C"
                        color="#ef4444"
                        size={220}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default EngineGauges;
