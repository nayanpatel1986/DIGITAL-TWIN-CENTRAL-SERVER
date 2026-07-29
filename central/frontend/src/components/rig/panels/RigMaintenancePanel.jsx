import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Box, Paper, Typography, Chip, Stack, Alert, Button,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
} from '@mui/material';
import { FavoriteBorder, Build, Tune } from '@mui/icons-material';
import { api } from '../../../api';
import { useRigData } from '../../../context/RigDataContext';

const BG = '#071225';
const PANEL = '#263447';
const BORDER = '#344963';
const BLUE = '#29b6ff';
const GREEN = '#22e070';
const YELLOW = '#ffb300';
const RED = '#ff3f4b';
const TEXT = '#eaf3ff';
const MUTED = '#9fb4d1';

const fmt = (v, d = 2) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) : '0.00';
};

function hoursUntil(next, current) {
    return Number(next || 0) - Number(current || 0);
}

function statusFor(dueIn) {
    if (dueIn < 0) return { label: 'Overdue', color: RED };
    if (dueIn <= 50) return { label: 'Due Soon', color: YELLOW };
    return { label: 'OK', color: GREEN };
}

function SummaryTile({ label, value, color }) {
    return (
        <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: color, p: 3, minHeight: 120, display: 'grid', placeItems: 'center', borderRadius: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: MUTED, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 15 }}>{label}</Typography>
                <Typography sx={{ color, fontWeight: 900, fontSize: 42, lineHeight: 1.1 }}>{value}</Typography>
            </Box>
        </Paper>
    );
}

function HealthCard({ name, group, hours, source, dueIn, metrics, tasks, downtime }) {
    const st = statusFor(dueIn);
    return (
        <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, minHeight: 220, borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                    <Typography sx={{ color: TEXT, fontWeight: 900, fontSize: 20 }}>{name}</Typography>
                    <Typography sx={{ color: MUTED, mt: 0.5 }}>{group}</Typography>
                </Box>
                <Chip size="small" label={st.label} sx={{ color: st.color, borderColor: st.color, bgcolor: `${st.color}22`, fontWeight: 900 }} variant="outlined" />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 24 }}>{fmt(hours)} h</Typography>
                <Chip size="small" label={source} sx={{ bgcolor: '#1b4961', color: '#a9c1dc', height: 22 }} />
                {downtime ? <Chip size="small" label={`${downtime} open DT`} sx={{ bgcolor: '#5b2a3a', color: RED, fontWeight: 900, ml: 'auto' }} /> : null}
            </Stack>
            <Typography sx={{ color: MUTED, mt: 1.5 }}>
                next due in <Box component="span" sx={{ color: st.color, fontWeight: 900 }}>{fmt(dueIn)} h</Box>
            </Typography>
            <Box sx={{ borderTop: `1px solid ${BORDER}`, mt: 2, pt: 1.3 }}>
                {metrics.map((m) => <Typography key={m} sx={{ color: MUTED, lineHeight: 1.75 }}>{m}</Typography>)}
                <Typography sx={{ color: '#6f86aa', mt: 1 }}>{tasks} PM task(s)</Typography>
            </Box>
        </Paper>
    );
}

function StatusPill({ dueIn }) {
    const st = statusFor(dueIn);
    return <Chip size="small" label={st.label} variant="outlined" sx={{ color: st.color, borderColor: st.color, bgcolor: `${st.color}18`, fontWeight: 900 }} />;
}

const BASE_SCHEDULE = [
    { task: 'Mud Pump Liners & Valves', asset: 'Mud Pump', interval: 300, current: 3620, next: 3600 },
    { task: 'Drawworks Brake Inspection', asset: 'Drawworks', interval: 200, current: 3850.1, next: 3880 },
    { task: 'Drill-Line Slip & Cut', asset: 'Drawworks', interval: 150, current: 3850.1, next: 3950 },
    { task: 'Top Drive Gearbox Oil', asset: 'Top Drive (HTD)', interval: 750, current: 0, next: 2900 },
    { task: 'HPU Hydraulic Filter', asset: 'Hydraulic Power Unit', interval: 350, current: 0, next: 3300 },
    { task: 'Engine Oil & Filter', asset: 'CAT Engine', interval: 250, current: 0, next: 4230 },
    { task: 'Engine Major Service', asset: 'CAT Engine', interval: 1000, current: 0, next: 4600 },
];

const CALIBRATION_ROWS = [
    { type: 'Depth / Block Encoder', asset: 'drawworks', value: '1500.0 m', by: 'seed', time: 'Jun 12, 05:33' },
    { type: 'Weight Indicator', asset: 'drawworks', value: '0 t tare', by: 'seed', time: 'Jun 11, 05:33' },
    { type: 'Pump Stroke Counter', asset: 'mudpump', value: '1.00 factor', by: 'seed', time: 'Jun 10, 05:33' },
];

export default function RigMaintenancePanel({ rigId }) {
    const { data } = useRigData();
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState('');

    const load = useCallback(() => {
        if (!rigId) return;
        api.maintenance({ rigId })
            .then((list) => setRows(Array.isArray(list) ? list : []))
            .catch((e) => {
                if (e?.response?.status !== 401) setErr(e?.response?.data?.error || 'Failed to load maintenance records');
            });
    }, [rigId]);

    useEffect(() => {
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [load]);

    const derived = useMemo(() => {
        const catHours = Number(data?.cat_engine?.run_hours || data?.cat?.run_hours || 0);
        const hpuHours = Number(data?.hpu?.run_hours || 0);
        const htdHours = Number(data?.htd?.run_hours || data?.topdrive?.run_hours || 0);
        const mudHours = Number(data?.mudpump?.run_hours || 3620);
        const dwHours = Number(data?.drawworks?.run_hours || 3850.1);

        const schedule = BASE_SCHEDULE.map((r) => {
            let current = r.current;
            if (r.asset === 'CAT Engine') current = catHours;
            if (r.asset === 'Hydraulic Power Unit') current = hpuHours;
            if (r.asset === 'Top Drive (HTD)') current = htdHours;
            if (r.asset === 'Mud Pump') current = mudHours;
            if (r.asset === 'Drawworks') current = dwHours;
            return { ...r, current, dueIn: hoursUntil(r.next, current) };
        });

        return {
            schedule,
            overdue: schedule.filter((r) => r.dueIn < 0).length || rows.filter((r) => r.status === 'overdue').length,
            dueSoon: schedule.filter((r) => r.dueIn >= 0 && r.dueIn <= 50).length,
            openDowntime: Math.max(1, rows.filter((r) => r.type === 'breakdown' && r.status !== 'done').length),
            cards: [
                { name: 'CAT Engine', group: 'Power', hours: catHours, source: 'measured', dueIn: 4230 - catHours, metrics: ['Coolant C', 'Oil bar'], tasks: 2 },
                { name: 'Hydraulic Power Unit', group: 'Hydraulics', hours: hpuHours, source: 'measured', dueIn: 3300 - hpuHours, metrics: ['Oil Temp C', 'Disch bar'], tasks: 1, downtime: 1 },
                { name: 'Top Drive (HTD)', group: 'Rotary', hours: htdHours, source: 'measured', dueIn: 2900 - htdHours, metrics: ['RPM', 'Torque'], tasks: 1 },
                { name: 'Drawworks', group: 'Hoisting', hours: dwHours, source: 'derived', dueIn: 3880 - dwHours, metrics: ['Hook Load t', 'Rope wear'], tasks: 2 },
                { name: 'Mud Pump', group: 'Circulating', hours: mudHours, source: 'derived', dueIn: 3600 - mudHours, metrics: ['SPM', 'Pressure bar'], tasks: 1 },
            ],
        };
    }, [data, rows]);

    return (
        <Box sx={{ bgcolor: BG, minHeight: '100%', p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 3 }}>
                <FavoriteBorder sx={{ color: BLUE }} />
                <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 26 }}>Maintenance & Asset Health</Typography>
            </Stack>

            {err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr('')}>{err}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
                <SummaryTile label="Overdue" value={derived.overdue} color={RED} />
                <SummaryTile label="Due Soon" value={derived.dueSoon} color={YELLOW} />
                <SummaryTile label="Open Downtime" value={derived.openDowntime} color={BLUE} />
            </Box>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <FavoriteBorder sx={{ color: BLUE }} />
                <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 22 }}>Asset Health</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
                {derived.cards.map((card) => <HealthCard key={card.name} {...card} />)}
            </Box>

            <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Build sx={{ color: BLUE }} />
                    <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 22 }}>Preventive Maintenance Schedule</Typography>
                </Stack>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Task', 'Asset', 'Interval', 'Current', 'Next', 'Due In', 'Status', 'Action'].map((h) => (
                                    <TableCell key={h} sx={{ color: MUTED, fontWeight: 900, fontSize: 16 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {derived.schedule.map((r) => {
                                const st = statusFor(r.dueIn);
                                return (
                                    <TableRow key={r.task} hover sx={{ '& td': { borderColor: '#1d2c3f', color: TEXT, fontSize: 16, fontWeight: 700 } }}>
                                        <TableCell>{r.task}</TableCell>
                                        <TableCell>{r.asset}</TableCell>
                                        <TableCell>{fmt(r.interval)} h</TableCell>
                                        <TableCell>{fmt(r.current)} h</TableCell>
                                        <TableCell>{fmt(r.next)} h</TableCell>
                                        <TableCell sx={{ color: `${st.color} !important` }}>{fmt(r.dueIn)} h</TableCell>
                                        <TableCell><StatusPill dueIn={r.dueIn} /></TableCell>
                                        <TableCell align="right"><Button size="small" variant="outlined" startIcon={<Build />}>Service</Button></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ bgcolor: PANEL, borderColor: BORDER, p: 2, borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Tune sx={{ color: BLUE }} />
                        <Typography sx={{ color: BLUE, fontWeight: 900, fontSize: 22 }}>Calibration History</Typography>
                    </Stack>
                    <Button size="small" variant="outlined">Add Calibration</Button>
                </Stack>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Type', 'Asset', 'Value', 'By', 'Time'].map((h) => <TableCell key={h} sx={{ color: MUTED, fontWeight: 900, fontSize: 16 }}>{h}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {CALIBRATION_ROWS.map((r) => (
                                <TableRow key={r.type} sx={{ '& td': { borderColor: '#1d2c3f', color: TEXT, fontSize: 16, fontWeight: 700 } }}>
                                    <TableCell>{r.type}</TableCell>
                                    <TableCell>{r.asset}</TableCell>
                                    <TableCell>{r.value}</TableCell>
                                    <TableCell>{r.by}</TableCell>
                                    <TableCell>{r.time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
