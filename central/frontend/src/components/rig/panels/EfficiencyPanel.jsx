import React, { useMemo } from 'react';
import {
    Box, Paper, Typography, Stack, Chip, Button,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
} from '@mui/material';
import { Speed, ShowChart, DeviceThermostat, Build, Tune, Timeline } from '@mui/icons-material';
import { useRigData } from '../../../context/RigDataContext';

const BG = '#071225';
const PANEL = '#263447';
const PANEL2 = '#101a2c';
const BORDER = '#344963';
const BLUE = '#29b6ff';
const GREEN = '#62cf6d';
const YELLOW = '#ffb300';
const ORANGE = '#ff9d13';
const TEXT = '#eaf3ff';
const MUTED = '#b5c5dd';

const dash = '--';
const fmt = (v, d = 1) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) : dash;
};

function SectionTitle({ icon, title, right }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                {icon}
                <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 22 }}>{title}</Typography>
            </Stack>
            {right}
        </Stack>
    );
}

function KpiTile({ label, value, unit, color = BLUE, border = BORDER }) {
    return (
        <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: border, p: 2, minHeight: 104, borderRadius: 1 }}>
            <Typography sx={{ color: TEXT, textTransform: 'uppercase', letterSpacing: 1.6, fontSize: 16 }}>{label}</Typography>
            <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 1.1 }}>
                <Typography sx={{ color, fontWeight: 900, fontSize: 30, lineHeight: 1 }}>{value}</Typography>
                {unit ? <Typography sx={{ color: TEXT, fontWeight: 900 }}>{unit}</Typography> : null}
            </Stack>
        </Paper>
    );
}

function SmallMetric({ label, value }) {
    return (
        <Paper variant="outlined" sx={{ bgcolor: '#172235', borderColor: '#243751', p: 2, minHeight: 86, borderRadius: 1 }}>
            <Typography sx={{ color: TEXT, textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</Typography>
            <Typography sx={{ color: TEXT, fontWeight: 900, fontSize: 24, mt: 1 }}>{value}</Typography>
        </Paper>
    );
}

function StatusChip({ label, color }) {
    return <Chip size="small" label={label} variant="outlined" sx={{ color, borderColor: color, bgcolor: `${color}18`, fontWeight: 900, fontSize: 14 }} />;
}

function TrendPlaceholder() {
    return (
        <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, minHeight: 390, borderRadius: 1 }}>
            <SectionTitle icon={<Timeline sx={{ color: BLUE }} />} title="Live Trend - System Hydraulic Power & LS Margin" />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['1m', '5m', '15m', '30m', '1H', '6H', '12H', '24H', 'Custom'].map((r) => (
                    <Button key={r} variant={r === '5m' ? 'contained' : 'outlined'} sx={{ minWidth: r === 'Custom' ? 104 : 60, fontWeight: 900 }}>{r}</Button>
                ))}
            </Stack>
            <Box sx={{ height: 270, display: 'grid', placeItems: 'center', color: MUTED, fontSize: 20 }}>
                Buffering live trend...
            </Box>
        </Paper>
    );
}

export default function EfficiencyPanel() {
    const { data } = useRigData();
    const mp = data?.mudpump || {};
    const hpu = data?.hpu || {};
    const htd = data?.htd || {};
    const eng = data?.cat_engine || data?.cat || {};
    const dr = data?.drilling || {};

    const calc = useMemo(() => {
        const pressureBar = Number(mp.pressure || 0);
        const flowLMin = Number(mp.flow_in || mp.flow || 0);
        const pumpKw = pressureBar > 0 && flowLMin > 0 ? (pressureBar * flowLMin) / 600 : 0;
        const torque = Number(htd.torque || dr.torque || 0);
        const rpm = Number(htd.rpm || dr.rpm || 0);
        const htdKw = torque && rpm ? (torque * rpm) / 9550 : 0;
        const fuel = Number(eng.fuel_rate || eng.fuel || 0);
        const systemPower = pumpKw + htdKw;
        const enginePower = Number(eng.shaft_power || 0);
        const conversion = enginePower > 0 ? (systemPower / enginePower) * 100 : null;
        return { pressureBar, flowLMin, pumpKw, htdKw, fuel, systemPower, enginePower, conversion };
    }, [mp, htd, dr, eng]);

    const circuitRows = [
        { circuit: 'Mud / circulating pump', useful: dash, hydraulic: fmt(calc.pumpKw, 1), eff: dash, status: <StatusChip label="Computed" color={GREEN} />, note: 'p x Q, Q = real flow meter (L/min)' },
        { circuit: 'Top-drive rotation (HTD)', useful: fmt(calc.htdKw, 1), hydraulic: fmt(calc.pumpKw, 1), eff: dash, status: <StatusChip label="Estimated" color={YELLOW} />, note: 'mech = T.n/9550; Q from pump % x rated l/min (rolling avg)' },
        { circuit: 'Pulldown / hoist (PDW)', useful: dash, hydraulic: fmt(Number(hpu.pdw_power || 0), 1), eff: dash, status: <StatusChip label="Estimated" color={YELLOW} />, note: 'Q from pump % x rated l/min; add load-cell+stroke for efficiency' },
        { circuit: 'Power tong / winch / cylinders', useful: dash, hydraulic: dash, eff: dash, status: <StatusChip label="Needs Instrument" color={MUTED} />, note: 'needs torque-sub / load-cell + velocity' },
    ];

    return (
        <Box sx={{ bgcolor: BG, minHeight: '100%', p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1 }}>
                <Speed sx={{ color: BLUE }} />
                <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 26 }}>Efficiency & Energy</Typography>
            </Stack>
            <Typography sx={{ color: TEXT, mb: 3, fontSize: 17 }}>
                Derived from live pressure/flow/torque/fuel - read-only. Estimated circuits use configured pump rated-flow; the heat-balance method and tong/winch need added instrumentation.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
                <KpiTile label="System Hydraulic Power" value={fmt(calc.systemPower, 1)} unit="kW" color={BLUE} border={BLUE} />
                <KpiTile label="Engine Shaft Power" value={calc.enginePower ? fmt(calc.enginePower, 1) : dash} unit="kW" color={TEXT} border="#d7e1ef" />
                <KpiTile label="Hydraulic Conversion" value={calc.conversion == null ? dash : fmt(calc.conversion, 1)} unit="%" color={GREEN} border={GREEN} />
                <KpiTile label="LS Margin" value={hpu.ls_margin != null ? fmt(hpu.ls_margin, 1) : dash} unit="bar" color={YELLOW} border={YELLOW} />
                <KpiTile label="Fuel Rate" value={calc.fuel ? fmt(calc.fuel, 1) : dash} unit="L/h" color={TEXT} border="#d7e1ef" />
            </Box>

            <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1, mb: 3 }}>
                <SectionTitle icon={<Timeline sx={{ color: BLUE }} />} title="Per-Circuit Efficiency" />
                <Typography sx={{ color: TEXT, mb: 2 }}>&quot;Estimated&quot; rows mean flow Q came from pump % x configured rated flow.</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Circuit', 'Useful Output (kW)', 'Hydraulic Power (kW)', 'Efficiency (%)', 'Status', 'Note'].map((h) => (
                                    <TableCell key={h} sx={{ color: MUTED, fontWeight: 900, fontSize: 16 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {circuitRows.map((r) => (
                                <TableRow key={r.circuit} sx={{ '& td': { borderColor: '#42546b', color: TEXT, fontSize: 16, fontWeight: 700 } }}>
                                    <TableCell>{r.circuit}</TableCell>
                                    <TableCell align="right">{r.useful}</TableCell>
                                    <TableCell align="right">{r.hydraulic}</TableCell>
                                    <TableCell align="right">{r.eff}</TableCell>
                                    <TableCell>{r.status}</TableCell>
                                    <TableCell>{r.note}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.05fr 0.75fr' }, gap: 2, mb: 3 }}>
                <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1 }}>
                    <SectionTitle icon={<ShowChart sx={{ color: BLUE }} />} title="Specific Energy (Working Day)" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                        <SmallMetric label="L / Joint" value={dash} />
                        <SmallMetric label="kWh / Joint" value={dash} />
                        <SmallMetric label="L / Metre" value={dash} />
                        <SmallMetric label="Fuel Today" value={dash} />
                        <SmallMetric label="Energy Today" value={dash} />
                        <SmallMetric label="Productive Share" value={dash} />
                    </Box>
                    <Typography sx={{ color: TEXT, mt: 2 }}>Working day 06:00-06:00; fills as joints/metres accrue.</Typography>
                </Paper>

                <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1 }}>
                    <SectionTitle icon={<DeviceThermostat sx={{ color: BLUE }} />} title="Heat Balance" right={<Chip label="Requires Instrumentation" sx={{ color: ORANGE, borderColor: ORANGE, fontWeight: 900 }} variant="outlined" />} />
                    <Paper sx={{ bgcolor: '#172235', p: 2, borderRadius: 1, mb: 2 }}>
                        <Typography sx={{ color: TEXT, textTransform: 'uppercase', letterSpacing: 1.4, mb: 1 }}>Method</Typography>
                        <Typography sx={{ color: TEXT, fontWeight: 900, fontFamily: 'monospace', fontSize: 18 }}>P_loss (kW) approx 0.027 x Q_cooler(l/min) x dT(C)</Typography>
                    </Paper>
                    <Typography sx={{ color: TEXT, mb: 2 }}>HPU oil temp (heat-load proxy): <Box component="span" sx={{ color: ORANGE, fontWeight: 900 }}>{hpu.oil_temp != null ? fmt(hpu.oil_temp, 1) : dash}</Box></Typography>
                    <Typography sx={{ color: TEXT, fontSize: 17 }}>requires cooler dT + flow instrumentation</Typography>
                </Paper>
            </Box>

            <TrendPlaceholder />

            <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1, mt: 3 }}>
                <SectionTitle icon={<Build sx={{ color: BLUE }} />} title="Instrumentation Gaps" />
                <Typography sx={{ color: TEXT, mb: 2 }}>What to add to go from estimated to exact.</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Add Instrument', 'Unlocks', 'Status'].map((h) => <TableCell key={h} sx={{ color: TEXT, fontWeight: 900, fontSize: 16 }}>{h}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[
                                ['Inline/clamp flow meters (l/min) on main delivery + return header', 'Exact circuit flow (HPU/HTD pump flows are % today) - exact circuit efficiency', 'recommended'],
                                ['Cooler dT (inlet/outlet temp) + cooler flow', 'Heat-balance system efficiency: P_loss = 0.027.Q.dT (Method 2)', 'required for heat-balance'],
                                ['Torque sub / motor dP+speed; cylinder load-cell + stroke; winch line-pull + drum rpm', 'Circuit efficiency for tong / cylinders / winch (only top-drive rotation is measurable now)', 'recommended'],
                            ].map((r) => (
                                <TableRow key={r[0]} sx={{ '& td': { borderColor: '#42546b', color: TEXT, fontSize: 16, fontWeight: 700 } }}>
                                    <TableCell>{r[0]}</TableCell>
                                    <TableCell>{r[1]}</TableCell>
                                    <TableCell><StatusChip label={r[2]} color={MUTED} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1, mt: 3 }}>
                <SectionTitle icon={<Tune sx={{ color: BLUE }} />} title="Tuning Constants" right={<Button variant="outlined" startIcon={<Tune />}>Edit Constants</Button>} />
                <Typography sx={{ color: TEXT, mb: 2 }}>These drive the estimated circuit flows (pump % x rated flow).</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                    <SmallMetric label="Engine Rated (kW)" value="800" />
                    <SmallMetric label="HTD Pump Rated (l/min)" value="420" />
                    <SmallMetric label="PDW Pump Rated (l/min)" value="200" />
                    <SmallMetric label="Line Loss (bar)" value="10.0" />
                    <SmallMetric label="Pump Vol. Eff." value="0.95" />
                    <SmallMetric label="Cooler Oil K" value="0.03" />
                </Box>
            </Paper>
        </Box>
    );
}
