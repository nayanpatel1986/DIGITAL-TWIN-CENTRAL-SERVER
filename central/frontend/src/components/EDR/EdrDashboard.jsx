import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, MenuItem, Select, FormControl, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Popover } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRig } from '../../context/RigContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Clock, Edit2, Check, RefreshCw, Plus, Minus, Download, FileSpreadsheet, FileText, List } from 'lucide-react';

const DEFAULT_EDR_LAYOUT = [
    { id: 'track_0', type: 'track', trackIndex: 0 },
    { id: 'track_1', type: 'track', trackIndex: 1 },
    { id: 'track_2', type: 'track', trackIndex: 2 }
];

const AVAILABLE_METRICS = {
    drawworks: ['hook_load', 'block_position'],
    engine: ['rpm', 'oil_pressure', 'oil_temp', 'coolant_temp', 'exhaust_temp', 'battery_voltage', 'fuel_level', 'torque'],
    mudpump: ['spm', 'pressure', 'flow_in', 'flow_out', 'total_spm', 'spm_1', 'spm_2', 'flow_rate'],
    well_control: ['tubing_pressure', 'casing_pressure', 'bop_pressure', 'choke_pressure', 'choke_position', 'accumulator_pressure', 'manifold_pressure', 'annular_pressure'],
    drilling: ['wob', 'rop', 'bit_depth', 'hole_depth'],
    fluid: ['trip_tank', 'tank_1', 'tank_2', 'gain_loss'],
    system: ['rig_air_pressure'],
    allison: ['output_rpm', 'input_rpm', 'actual_gear', 'target_gear', 'oil_temp', 'oil_pressure']
};

const METRIC_UNITS = {
    'drawworks.hook_load': 'ton',
    'drawworks.block_position': 'm',
    'engine.rpm': 'rpm',
    'engine.oil_pressure': 'psi',
    'engine.oil_temp': '°C',
    'engine.coolant_temp': '°C',
    'engine.exhaust_temp': '°C',
    'engine.fuel_level': '%',
    'engine.battery_voltage': 'V',
    'engine.torque': 'Nm',
    'mudpump.spm': 'spm',
    'mudpump.pressure': 'psi',
    'mudpump.flow_in': 'gpm',
    'mudpump.flow_out': '%',
    'mudpump.total_spm': 'stks',
    'mudpump.spm_1': 'spm',
    'mudpump.spm_2': 'spm',
    'mudpump.flow_rate': 'gpm',
    'well_control.tubing_pressure': 'psi',
    'well_control.casing_pressure': 'psi',
    'well_control.bop_pressure': 'psi',
    'well_control.choke_pressure': 'psi',
    'well_control.accumulator_pressure': 'psi',
    'well_control.manifold_pressure': 'psi',
    'well_control.annular_pressure': 'psi',
    'drilling.wob': 'ton',
    'drilling.rop': 'm/hr',
    'drilling.bit_depth': 'm',
    'drilling.hole_depth': 'm',
    'fluid.trip_tank': 'm³',
    'fluid.tank_1': 'm³',
    'fluid.tank_2': 'm³',
    'fluid.gain_loss': 'm³',
    'system.rig_air_pressure': 'psi',
    'allison.output_rpm': 'rpm',
    'allison.input_rpm': 'rpm',
    'allison.oil_temp': '°C',
    'allison.oil_pressure': 'psi'
};

const ALL_METRICS = Object.entries(AVAILABLE_METRICS).flatMap(([category, fields]) =>
    fields.map(field => {
        const metric = `${category}.${field}`;
        return {
            value: metric,
            label: `${category.toUpperCase()} - ${field.replace(/_/g, ' ')}`,
            shortLabel: field.replace(/_/g, ' '),
            unit: METRIC_UNITS[metric] || ''
        };
    })
);

// Dynamic Panel Track Side Styles (Index 0 = Panel 1, Index 1 = Panel 2, Index 2 = Panel 3)
const TRACK_SIDE_STYLES = [
    // Panel 1 (Blue and Pink)
    {
        left: {
            color: '#1d4ed8', // Dark Blue
            deepColor: '#1e3a8a',
            badgeBg: 'rgba(29, 78, 216, 0.05)',
            badgeBorder: 'rgba(29, 78, 216, 0.2)'
        },
        right: {
            color: '#ec4899', // Light Pink
            deepColor: '#9d174d',
            badgeBg: 'rgba(236, 72, 153, 0.05)',
            badgeBorder: 'rgba(236, 72, 153, 0.2)'
        }
    },
    // Panel 2 (Teal and Orange)
    {
        left: {
            color: '#0d9488', // Dark Teal
            deepColor: '#115e59',
            badgeBg: 'rgba(13, 148, 136, 0.05)',
            badgeBorder: 'rgba(13, 148, 136, 0.2)'
        },
        right: {
            color: '#ea580c', // Light Orange
            deepColor: '#9a3412',
            badgeBg: 'rgba(234, 88, 12, 0.05)',
            badgeBorder: 'rgba(234, 88, 12, 0.2)'
        }
    },
    // Panel 3 (Indigo and Red/Rose)
    {
        left: {
            color: '#6366f1', // Dark Indigo
            deepColor: '#312e81',
            badgeBg: 'rgba(99, 102, 241, 0.05)',
            badgeBorder: 'rgba(99, 102, 241, 0.2)'
        },
        right: {
            color: '#e11d48', // Light Red/Rose
            deepColor: '#9f1239',
            badgeBg: 'rgba(225, 29, 72, 0.05)',
            badgeBorder: 'rgba(225, 29, 72, 0.2)'
        }
    }
];

const METRIC_LABELS = {
    'drawworks.hook_load': 'HOOK LOAD',
    'drilling.wob': 'WOB',
    'engine.torque': 'TORQUE',
    'engine.rpm': 'RPM',
    'mudpump.pressure': 'STANDPIPE P',
    'fluid.gain_loss': 'GAIN / LOSS',
    'mudpump.spm_1': 'PUMP 1 SPM',
    'mudpump.spm_2': 'PUMP 2 SPM'
};

const getMetricLabel = (metric) => {
    return METRIC_LABELS[metric] || metric.split('.').pop().replace(/_/g, ' ').toUpperCase();
};

const getMetricStyle = (trackIndex, side, metric) => {
    const trackStyle = TRACK_SIDE_STYLES[trackIndex] || TRACK_SIDE_STYLES[0];
    const style = trackStyle[side] || trackStyle.left;
    return {
        ...style,
        label: getMetricLabel(metric)
    };
};

const getMetricUnitLabel = (metric) => {
    if (metric === 'engine.torque') return 'KNM';
    if (metric === 'fluid.gain_loss') return 'BBL';
    return (METRIC_UNITS[metric] || '').toUpperCase();
};

const METRIC_MAX_OPTIONS = {
    'drawworks.hook_load': [100, 150, 200, 250, 300, 500],
    'drawworks.block_position': [10, 20, 30, 40, 50, 100],
    'engine.rpm': [1000, 1500, 2000, 2500, 3000],
    'engine.oil_pressure': [50, 100, 120, 150, 200, 500],
    'engine.oil_temp': [50, 100, 120, 150, 200],
    'engine.coolant_temp': [50, 100, 120, 150, 200],
    'engine.exhaust_temp': [200, 400, 600, 800, 1000],
    'engine.torque': [500, 1000, 1500, 2000, 2500, 3000, 5000],
    'mudpump.spm': [50, 100, 120, 150, 200],
    'mudpump.pressure': [1000, 2000, 3000, 4000, 5000, 6000],
    'mudpump.flow_in': [100, 200, 400, 500, 800, 1000],
    'mudpump.flow_out': [50, 100, 150, 200],
    'mudpump.total_spm': [100, 200, 500, 1000],
    'mudpump.spm_1': [50, 100, 120, 150, 200],
    'mudpump.spm_2': [50, 100, 120, 150, 200],
    'mudpump.flow_rate': [100, 200, 400, 500, 800, 1000],
    'well_control.tubing_pressure': [1000, 2000, 3000, 4000, 5000],
    'well_control.casing_pressure': [1000, 2000, 3000, 4000, 5000],
    'well_control.bop_pressure': [1000, 2000, 3000, 4000, 5000],
    'well_control.choke_pressure': [1000, 2000, 3000, 4000, 5000],
    'well_control.accumulator_pressure': [1000, 2000, 3000, 4000, 5000],
    'well_control.manifold_pressure': [1000, 2000, 3000, 4000, 5000],
    'well_control.annular_pressure': [1000, 2000, 3000, 4000, 5000],
    'drilling.wob': [10, 20, 30, 40, 50, 100],
    'drilling.rop': [10, 20, 30, 50, 100],
    'drilling.bit_depth': [100, 500, 1000, 2000, 3000, 5000],
    'drilling.hole_depth': [100, 500, 1000, 2000, 3000, 5000],
    'fluid.trip_tank': [10, 20, 50, 100, 200],
    'fluid.tank_1': [100, 200, 500, 1000],
    'fluid.tank_2': [100, 200, 500, 1000],
    'fluid.gain_loss': [5, 10, 15, 20, 30, 50],
    'system.rig_air_pressure': [50, 100, 150, 200],
    'allison.output_rpm': [1000, 1500, 2000, 2500, 3000],
    'allison.input_rpm': [1000, 1500, 2000, 2500, 3000],
    'allison.oil_temp': [50, 100, 120, 150, 200],
    'allison.oil_pressure': [50, 100, 150, 200, 300, 500]
};

const getMetricMaxOptions = (metric) => {
    return METRIC_MAX_OPTIONS[metric] || [10, 20, 50, 100, 200, 500, 1000, 2000, 3000, 5000];
};

const getMetricMinOptions = (metric) => {
    if (metric === 'fluid.gain_loss') return [-10, -6, -5, -2, 0];
    return [0];
};

const CustomTooltip = ({ active, payload, label, track, trackIndex }) => {
    if (active && payload && payload.length) {
        const dateObj = new Date(label);
        const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        
        // Find depth if available in payload
        const depthVal = payload[0]?.payload['drilling.hole_depth'] ?? 0;
        const depthStr = `${depthVal.toFixed(1)}m`;

        return (
            <Box sx={{ 
                bgcolor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid #334155', 
                borderRadius: '8px', 
                p: '10px 14px', 
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                fontFamily: '"Outfit", sans-serif',
                minWidth: '140px',
                zIndex: 100
            }}>
                {/* Header row: Date Time Depth */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, borderBottom: '1px solid #334155', pb: '4px', mb: '6px' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'bold' }}>{dateStr}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'bold' }}>{timeStr}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 'bold' }}>{depthStr}</Typography>
                </Box>
                {/* Payload items */}
                {payload.map((item, idx) => {
                    const side = (track?.left?.metric === item.dataKey) ? 'left' : 'right';
                    const style = getMetricStyle(trackIndex, side, item.dataKey);
                    return (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', my: '2px' }}>
                            <Typography sx={{ fontSize: '0.65rem', color: style.color, fontWeight: '900', textTransform: 'uppercase' }}>
                                {style.label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#ffffff', fontWeight: '900' }}>
                                {Number(item.value).toFixed(2)}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    }
    return null;
};

const DEFAULT_TRACKS = [
    {
        left: { metric: 'drawworks.hook_load', min: 90, max: 150 },
        right: { metric: 'drilling.wob', min: 9, max: 21 }
    },
    {
        left: { metric: 'engine.torque', min: 12, max: 20 },
        right: { metric: 'engine.rpm', min: 110, max: 130 }
    },
    {
        left: { metric: 'mudpump.pressure', min: 2000, max: 3000 },
        right: { metric: 'fluid.gain_loss', min: -6, max: 6 }
    }
];

export default function EdrDashboard() {
    const { apiBaseUrl, globalRigData, socket } = useRig();
    const { user } = useAuth();
    const isViewer = user?.role === 'viewer';
    const [editMode, setEditMode] = useState(false);
    const [layout, setLayout] = useState(DEFAULT_EDR_LAYOUT);
    
    const [data, setData] = useState([]);
    const [tracks, setTracks] = useState(DEFAULT_TRACKS);
    const [timeRange, setTimeRange] = useState('-30m'); // Default matching 30M preset
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [isCustom, setIsCustom] = useState(false);
    const [showCustomDate, setShowCustomDate] = useState(false);

    // Export Dialog State
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportPreset, setExportPreset] = useState('-1h');
    const [exportCustom, setExportCustom] = useState({ start: '', end: '' });
    const [exportIsCustom, setExportIsCustom] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState('xlsx'); // 'xlsx' | 'csv'

    const doExport = async () => {
        setIsExporting(true);
        const rangeLabel = exportIsCustom ? 'Custom' : exportPreset.replace('-', '');
        const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

        try {
            // Fetch data for xlsx / csv
            let url = `${apiBaseUrl}/api/history`;
            if (exportIsCustom && exportCustom.start && exportCustom.end) {
                url += `?start=${new Date(exportCustom.start).toISOString()}&stop=${new Date(exportCustom.end).toISOString()}`;
            } else {
                url += `?range=${exportPreset}`;
            }

            const res = await axios.get(url);
            const rows = res.data;
            if (!rows || rows.length === 0) { 
                alert('No data found for the selected time range.'); 
                setIsExporting(false); 
                return; 
            }

            // Collect all available metrics keys across the rows
            const allKeys = new Set();
            rows.forEach(row => Object.keys(row).forEach(k => { 
                if (k !== 'name' && k !== 'timestamp') allKeys.add(k); 
            }));
            const metricKeys = Array.from(allKeys).sort();

            const exportData = rows.map(row => {
                const fmt = { Timestamp: new Date(row.timestamp).toLocaleString() };
                metricKeys.forEach(k => { fmt[k] = row[k] ?? ''; });
                return fmt;
            });

            if (exportFormat === 'csv') {
                // CSV export
                const header = ['Timestamp', ...metricKeys].join(',');
                const csvRows = exportData.map(row =>
                    ['Timestamp', ...metricKeys].map(k => {
                        const v = String(row[k] ?? '');
                        return v.includes(',') ? `"${v}"` : v;
                    }).join(',')
                );
                const csvBlob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
                saveAs(csvBlob, `ROMII_EDR_Data_${rangeLabel}_${stamp}.csv`);
            } else {
                // Excel export
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'EDR Data');
                worksheet['!cols'] = [{ wch: 25 }, ...metricKeys.map(() => ({ wch: 18 }))];
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                saveAs(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }),
                    `ROMII_EDR_Data_${rangeLabel}_${stamp}.xlsx`);
            }
            setExportDialogOpen(false);
        } catch (err) {
            console.error('Export failed', err);
            alert('Export failed: ' + (err.message || err));
        }
        setIsExporting(false);
    };

    useEffect(() => {
        // Load layout
        fetch(`${apiBaseUrl}/api/dashboard/layout?page=edr`)
            .then(res => res.json())
            .then(config => {
                let finalLayout = DEFAULT_EDR_LAYOUT;
                let finalTracks = DEFAULT_TRACKS;

                if (config.layout && config.layout.length === 3) {
                    finalLayout = config.layout;
                }
                if (config.tracks && config.tracks.length === 3) {
                    finalTracks = config.tracks;
                }

                // Force layout configuration to 3 tracks if it contains more than 3
                if (config.layout && config.layout.length > 3) {
                    finalLayout = config.layout.slice(0, 3);
                }
                if (config.tracks && config.tracks.length > 3) {
                    finalTracks = config.tracks.slice(0, 3);
                }

                setLayout(finalLayout);
                setTracks(finalTracks);

                // Auto-save the sliced layout back to the database if it was larger
                if (config.layout && config.layout.length > 3) {
                    saveEdrConfig(finalLayout, finalTracks);
                }
            })
            .catch(err => console.error("Failed to load edr layout", err));

        if (socket) {
            socket.on('dashboard_layout_update', (config) => {
                const edr = config.pages?.edr;
                if (edr?.layout) {
                    const l = edr.layout.length > 3 ? edr.layout.slice(0, 3) : edr.layout;
                    setLayout(l);
                }
                if (edr?.tracks) {
                    const t = edr.tracks.length > 3 ? edr.tracks.slice(0, 3) : edr.tracks;
                    setTracks(t);
                }
            });
        }
        return () => socket?.off('dashboard_layout_update');
    }, [apiBaseUrl, socket]);

    const saveEdrConfig = (newLayout, newTracks) => {
        if (newLayout) setLayout(newLayout);
        if (newTracks) setTracks(newTracks);

        fetch(`${apiBaseUrl}/api/dashboard/layout?page=edr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                layout: newLayout || layout, 
                tracks: newTracks || tracks 
            })
        }).catch(err => console.error("Failed to save edr layout", err));
    };

    // How many ms worth of data to keep for each range
    const getRangeMs = (range) => {
        if (range === '-1m') return 60 * 1000;
        if (range === '-5m') return 5 * 60 * 1000;
        if (range === '-10m') return 10 * 60 * 1000;
        if (range === '-15m') return 15 * 60 * 1000;
        if (range === '-30m') return 30 * 60 * 1000;
        if (range === '-1h') return 60 * 60 * 1000;
        if (range === '-6h') return 6 * 60 * 60 * 1000;
        if (range === '-12h') return 12 * 60 * 60 * 1000;
        if (range === '-24h') return 24 * 60 * 60 * 1000;
        return 30 * 60 * 1000;
    };

    // Fetch history from API
    const fetchHistory = async () => {
        try {
            let url = `${apiBaseUrl}/api/history`;
            if (customRange.start && customRange.end) {
                url += `?start=${new Date(customRange.start).toISOString()}&stop=${new Date(customRange.end).toISOString()}`;
            } else {
                url += `?range=${timeRange}`;
            }

            const res = await axios.get(url);
            if (res.data && res.data.length > 0) {
                setData(res.data);
            } else {
                if (isCustom || (customRange.start && customRange.end)) {
                    setData([]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
            if (isCustom || (customRange.start && customRange.end)) {
                setData([]);
            }
        }
    };

    useEffect(() => {
        if (!isCustom) fetchHistory();
    }, [tracks, timeRange, isCustom]);

    useEffect(() => {
        if (isCustom || !globalRigData) return;

        const newData = globalRigData;
        setData(prev => {
            const now = new Date();
            const newPoint = {
                name: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                timestamp: now.getTime()
            };

            Object.keys(newData).forEach(measurement => {
                if (typeof newData[measurement] === 'object' && newData[measurement] !== null) {
                    Object.keys(newData[measurement]).forEach(field => {
                        newPoint[`${measurement}.${field}`] = newData[measurement][field];
                    });
                }
            });

            // Ensure all track metrics have at least a 0 value if missing
            tracks.forEach(track => {
                if (newPoint[track.left.metric] === undefined) newPoint[track.left.metric] = 0;
                if (newPoint[track.right.metric] === undefined) newPoint[track.right.metric] = 0;
            });

            const updated = [...prev, newPoint];
            const sorted = updated.sort((a, b) => a.timestamp - b.timestamp);

            // Trim data older than selected range
            const cutoff = now.getTime() - getRangeMs(timeRange);
            const trimmed = sorted.filter(pt => (pt.timestamp || 0) >= cutoff);

            return trimmed;
        });
    }, [globalRigData, tracks, timeRange, isCustom]);

    const applyCustomRange = () => {
        if (customRange.start && customRange.end) {
            setIsCustom(true);
            fetchHistory();
        }
    };

    const handlePresetClick = (val) => {
        setIsCustom(false);
        setTimeRange(val);
        setCustomRange({ start: '', end: '' });
    };

    const TIME_STEPS = ['-1m', '-5m', '-10m', '-15m', '-30m', '-1h', '-6h', '-12h', '-24h'];

    const handleMinusClick = () => {
        setIsCustom(false);
        const currentIndex = TIME_STEPS.indexOf(timeRange);
        if (currentIndex > 0) {
            setTimeRange(TIME_STEPS[currentIndex - 1]);
        } else if (currentIndex === -1) {
            setTimeRange('-15m');
        }
    };

    const handlePlusClick = () => {
        setIsCustom(false);
        const currentIndex = TIME_STEPS.indexOf(timeRange);
        if (currentIndex < TIME_STEPS.length - 1 && currentIndex !== -1) {
            setTimeRange(TIME_STEPS[currentIndex + 1]);
        } else if (currentIndex === -1) {
            setTimeRange('-1h');
        }
    };

    const handleTrackMetricChange = (trackIndex, side, newMetric) => {
        const newTracks = JSON.parse(JSON.stringify(tracks));
        newTracks[trackIndex][side].metric = newMetric;
        newTracks[trackIndex][side].min = 0;
        saveEdrConfig(null, newTracks);
    };

    const handleTrackScaleChange = (trackIndex, side, field, value) => {
        const newTracks = JSON.parse(JSON.stringify(tracks));
        newTracks[trackIndex][side][field] = Number(value);
        newTracks[trackIndex][side].min = 0;
        saveEdrConfig(null, newTracks);
    };

    // Helper to get latest value
    const getLatestValue = (metric) => {
        if (data.length === 0) return '0.00';
        return Number(data[data.length - 1][metric] || 0).toFixed(2);
    };

    const formatTime = (unixTime) => {
        if (!unixTime) return '';
        const d = new Date(unixTime);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <Box sx={{ 
            height: 'calc(100vh - 100px)', 
            display: 'flex', 
            flexDirection: 'column', 
            p: 2, 
            bgcolor: '#080c16',
            fontFamily: '"Outfit", "Inter", sans-serif'
        }}>
            {/* HIGH-TECH HEADER BAR - OPTIMIZED COMPACT SIZE */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 1.5, 
                p: '6px 12px', 
                bgcolor: '#0f1626', 
                borderRadius: '12px', 
                border: '1px solid #1e2942',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>

                {/* Right Presets & Time Controls */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        background: '#151d30', 
                        border: '1px solid #232e48', 
                        p: '4px', 
                        borderRadius: '10px' 
                    }}>
                        {[
                            { label: '1M', val: '-1m' },
                            { label: '5M', val: '-5m' },
                            { label: '15M', val: '-15m' },
                            { label: '30M', val: '-30m' },
                            { label: '1H', val: '-1h' },
                            { label: '6H', val: '-6h' },
                            { label: '12H', val: '-12h' },
                            { label: '24H', val: '-24h' }
                        ].map((opt) => {
                            const isSelected = !isCustom && timeRange === opt.val;
                            return (
                                <Button
                                    key={opt.val}
                                    onClick={() => handlePresetClick(opt.val)}
                                    size="small"
                                    sx={{
                                        background: isSelected ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'transparent',
                                        color: isSelected ? '#ffffff' : '#637597',
                                        boxShadow: isSelected ? '0 0 12px rgba(79, 70, 229, 0.3)' : 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        px: 2,
                                        py: '4px',
                                        borderRadius: '7px',
                                        border: 'none',
                                        textTransform: 'none',
                                        minWidth: '55px',
                                        '&:hover': {
                                            background: isSelected ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.02)',
                                        }
                                    }}
                                >
                                    {opt.label}
                                </Button>
                            );
                        })}

                        {/* Custom Button inside presets */}
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Button
                                onClick={() => setShowCustomDate(!showCustomDate)}
                                size="small"
                                sx={{
                                    background: isCustom ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'transparent',
                                    color: isCustom ? '#ffffff' : '#637597',
                                    boxShadow: isCustom ? '0 0 12px rgba(79, 70, 229, 0.3)' : 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    px: 2,
                                    py: '4px',
                                    borderRadius: '7px',
                                    textTransform: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    '&:hover': {
                                        background: isCustom ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.02)',
                                    }
                                }}
                            >
                                <Clock size={12} />
                                CUSTOM
                            </Button>

                            {showCustomDate && (
                                <Paper sx={{ 
                                    position: 'absolute', 
                                    top: '120%', 
                                    right: 0, 
                                    p: 2.5, 
                                    bgcolor: '#0f172a', 
                                    border: '1px solid #334155', 
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                    borderRadius: '12px',
                                    zIndex: 50, 
                                    width: 'max-content' 
                                }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                        <input
                                            type="datetime-local"
                                            style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', padding: '6px', colorScheme: 'dark', fontSize: '0.8rem', outline: 'none' }}
                                            onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                        />
                                        <span style={{ color: '#64748b', fontWeight: 'bold' }}>to</span>
                                        <input
                                            type="datetime-local"
                                            style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', padding: '6px', colorScheme: 'dark', fontSize: '0.8rem', outline: 'none' }}
                                            onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                        />
                                        <Button variant="contained" size="small" onClick={() => { applyCustomRange(); setShowCustomDate(false); }} sx={{ background: '#3b82f6', fontWeight: 'bold' }}>GO</Button>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                    </Box>

                    {/* Reload Button */}
                    <Button
                        onClick={fetchHistory}
                        sx={{
                            minWidth: '38px',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#151d30',
                            border: '1px solid #232e48',
                            color: '#637597',
                            p: 0,
                            '&:hover': { background: '#1c2842', color: '#ffffff' }
                        }}
                    >
                        <RefreshCw size={14} />
                    </Button>

                    {/* Plus / Minus Zoom Container */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: '#151d30', 
                        border: '1px solid #232e48', 
                        borderRadius: '9999px',
                        px: 1,
                        height: '38px'
                    }}>
                        <Button onClick={handlePlusClick} sx={{ minWidth: 28, p: 0, color: '#637597', '&:hover': { color: '#ffffff' } }}>
                            <Plus size={14} />
                        </Button>
                        <Box sx={{ width: '1px', height: '14px', bgcolor: '#232e48', mx: 0.5 }} />
                        <Button onClick={handleMinusClick} sx={{ minWidth: 28, p: 0, color: '#637597', '&:hover': { color: '#ffffff' } }}>
                            <Minus size={14} />
                        </Button>
                    </Box>

                    {/* Export Excel / CSV Button */}
                    <Button
                        variant="outlined"
                        startIcon={<Download size={14} />}
                        onClick={() => {
                            setExportPreset('-1h');
                            setExportIsCustom(false);
                            setExportCustom({ start: '', end: '' });
                            setExportDialogOpen(true);
                        }}
                        sx={{ 
                            color: '#fbbf24', 
                            borderColor: '#fbbf24',
                            fontWeight: '800',
                            fontSize: '0.75rem',
                            height: '38px',
                            px: 2,
                            borderRadius: '8px',
                            '&:hover': { bgcolor: 'rgba(251, 191, 36, 0.1)', borderColor: '#fbbf24' }
                        }}
                    >
                        EXPORT
                    </Button>
                </Box>


            </Box>

            {/* THE FOUR PANELS ROW */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: 2, 
                flexGrow: 1, 
                minHeight: 0,
                width: '100%',
                overflow: 'hidden'
            }}>
                {/* DEPTH LOG PANEL */}
                <Paper 
                    sx={{ 
                        width: '180px', 
                        minWidth: '150px',
                        display: 'flex', 
                        flexDirection: 'column', 
                        bgcolor: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ 
                        p: '6px 12px', 
                        borderBottom: '1px solid #f1f5f9',
                        minHeight: '38px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>
                            DEPTH LOG
                        </Typography>
                    </Box>

                    {/* Hole / Bit info */}
                    <Box sx={{ p: '8px 12px', borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>HOLE</Typography>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: '900', color: '#0f172a' }}>
                                {(data[data.length - 1]?.['drilling.hole_depth'] ?? 0).toFixed(1)} m
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>BIT</Typography>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: '900', color: '#0f172a' }}>
                                {(data[data.length - 1]?.['drilling.bit_depth'] ?? 0).toFixed(1)} m
                            </Typography>
                        </Box>
                    </Box>

                    {/* Table column headers */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: '12px', py: '6px', borderBottom: '1px solid #cbd5e1', bgcolor: '#f1f5f9' }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: '900', color: '#64748b' }}>TIME/MD</Typography>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: '900', color: '#64748b', pr: 1 }}>BD</Typography>
                    </Box>

                    {/* Log list */}
                    <Box sx={{ 
                        flexGrow: 1, 
                        overflowY: 'auto', 
                        p: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}>
                        {[...data].reverse().slice(0, 45).map((pt, idx) => {
                            const dateObj = new Date(pt.timestamp);
                            const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                            const hd = pt['drilling.hole_depth'] ?? 0;
                            const bd = pt['drilling.bit_depth'] ?? 0;
                            return (
                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 'bold' }}>{timeStr}</Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: '#334155', fontWeight: 'bold' }}>{hd.toFixed(1)}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontWeight: 'bold' }}>{bd.toFixed(1)}</Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>

                {layout.map((item, index) => {
                    const track = tracks[item.trackIndex];
                    if (!track) return null;

                    const leftStyle = getMetricStyle(index, 'left', track.left.metric);
                    const rightStyle = getMetricStyle(index, 'right', track.right.metric);

                    const leftMaxOptions = [...getMetricMaxOptions(track.left.metric)];
                    if (!leftMaxOptions.includes(Number(track.left.max))) {
                        leftMaxOptions.push(Number(track.left.max));
                        leftMaxOptions.sort((a, b) => a - b);
                    }

                    const rightMaxOptions = [...getMetricMaxOptions(track.right.metric)];
                    if (!rightMaxOptions.includes(Number(track.right.max))) {
                        rightMaxOptions.push(Number(track.right.max));
                        rightMaxOptions.sort((a, b) => a - b);
                    }

                    // Dynamic background gradient from Left Metric color hue to Right Metric color hue
                    const containerBackground = `linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 1)), linear-gradient(to right, ${leftStyle.badgeBg} 0%, ${rightStyle.badgeBg} 100%)`;

                    return (
                        <Paper 
                            key={item.id} 
                            sx={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                bgcolor: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
                                position: 'relative'
                            }}
                        >
                            {/* Panel Header */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                p: '6px 8px', 
                                borderBottom: '1px solid #f1f5f9',
                                minHeight: '38px',
                                gap: 0.5
                            }}>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    PANEL {index + 1}
                                </Typography>
                                {/* Badges */}
                                <Box sx={{ display: 'flex', gap: 0.5, minWidth: 0, justifyContent: 'end' }}>
                                    <Box sx={{
                                        px: 0.8,
                                        py: 0.25,
                                        borderRadius: '9999px',
                                        background: leftStyle.badgeBg,
                                        border: `1px solid ${leftStyle.badgeBorder}`,
                                        color: leftStyle.color,
                                        fontSize: '0.55rem',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                        whiteSpace: 'nowrap',
                                        flexShrink: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>●</span> {leftStyle.label} ({track.left.max})
                                    </Box>
                                    <Box sx={{
                                        px: 0.8,
                                        py: 0.25,
                                        borderRadius: '9999px',
                                        background: rightStyle.badgeBg,
                                        border: `1px solid ${rightStyle.badgeBorder}`,
                                        color: rightStyle.color,
                                        fontSize: '0.55rem',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                        whiteSpace: 'nowrap',
                                        flexShrink: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>●</span> {rightStyle.label} ({track.right.max})
                                    </Box>
                                </Box>
                            </Box>

                            {/* Scale Editing Overlay (Edit Mode) */}
                            {editMode && (
                                <Box sx={{ 
                                    position: 'absolute', 
                                    top: 40, 
                                    left: '50%', 
                                    transform: 'translateX(-50%)', 
                                    zIndex: 20,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1.5, 
                                    bgcolor: 'rgba(15, 23, 42, 0.95)', 
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid #1e293b',
                                    borderRadius: '8px',
                                    px: 2,
                                    py: 1,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: '900', color: leftStyle.color }}>LEFT LIMITS:</Typography>
                                        <input 
                                            type="number" 
                                            value={track.left.min} 
                                            onChange={(e) => handleTrackScaleChange(item.trackIndex, 'left', 'min', e.target.value)}
                                            style={{ width: 45, background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '3px', fontSize: '0.75rem', textAlign: 'center', outline: 'none' }}
                                        />
                                        <span style={{ color: '#475569', fontSize: '0.75rem' }}>to</span>
                                        <input 
                                            type="number" 
                                            value={track.left.max} 
                                            onChange={(e) => handleTrackScaleChange(item.trackIndex, 'left', 'max', e.target.value)}
                                            style={{ width: 45, background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '3px', fontSize: '0.75rem', textAlign: 'center', outline: 'none' }}
                                        />
                                    </Box>
                                    <Box sx={{ width: '1px', height: 18, bgcolor: '#334155' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: '900', color: rightStyle.color }}>RIGHT LIMITS:</Typography>
                                        <input 
                                            type="number" 
                                            value={track.right.min} 
                                            onChange={(e) => handleTrackScaleChange(item.trackIndex, 'right', 'min', e.target.value)}
                                            style={{ width: 45, background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '3px', fontSize: '0.75rem', textAlign: 'center', outline: 'none' }}
                                        />
                                        <span style={{ color: '#475569', fontSize: '0.75rem' }}>to</span>
                                        <input 
                                            type="number" 
                                            value={track.right.max} 
                                            onChange={(e) => handleTrackScaleChange(item.trackIndex, 'right', 'max', e.target.value)}
                                            style={{ width: 45, background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', padding: '3px', fontSize: '0.75rem', textAlign: 'center', outline: 'none' }}
                                        />
                                    </Box>
                                </Box>
                            )}

                            {/* Chart Area */}
                            <Box sx={{ 
                                flexGrow: 1, 
                                minHeight: 0, 
                                position: 'relative',
                                background: containerBackground,
                                display: 'flex',
                                alignItems: 'stretch'
                            }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data}
                                        layout="vertical"
                                        margin={{ top: 8, right: 5, left: -42, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={true} />

                                        {/* Left ticks: Time on Y-Axis */}
                                        <YAxis
                                            dataKey="timestamp"
                                            type="number"
                                            scale="time"
                                            domain={isCustom && customRange.start && customRange.end ? [new Date(customRange.start).getTime(), new Date(customRange.end).getTime()] : ['dataMin', 'dataMax']}
                                            reversed={true}
                                            tickFormatter={formatTime}
                                            stroke="#64748b"
                                            width={45}
                                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                                            tickLine={{ stroke: '#cbd5e1' }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                        />

                                        {/* Top and Bottom X-Axes */}
                                        <XAxis 
                                            hide={true}
                                            type="number" 
                                            xAxisId="left" 
                                            orientation="top" 
                                            domain={[0, track.left.max]} 
                                        />
                                        <XAxis 
                                            hide={true}
                                            type="number" 
                                            xAxisId="right" 
                                            orientation="bottom" 
                                            domain={[0, track.right.max]} 
                                        />

                                        <Tooltip content={<CustomTooltip track={track} trackIndex={index} />} />

                                        <Line type="monotone" dataKey={track.left.metric} xAxisId="left" stroke={leftStyle.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                                        <Line type="monotone" dataKey={track.right.metric} xAxisId="right" stroke={rightStyle.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Card Footer Parameters Readout */}
                            <Box sx={{ 
                                display: 'flex', 
                                borderTop: '1px solid #f1f5f9',
                                bgcolor: '#ffffff',
                                p: '6px 8px',
                                gap: 0.5
                            }}>
                                {/* Left Parameter readout */}
                                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                    {/* Header selects row: min, menu-icon, parameter, max */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: '100%', overflow: 'hidden' }}>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>0</Typography>
                                        <List size={10} style={{ color: '#64748b', flexShrink: 0 }} />
                                        <select
                                            value={track.left.metric}
                                            onChange={(e) => handleTrackMetricChange(index, 'left', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: leftStyle.color,
                                                fontWeight: '900',
                                                fontSize: '0.6rem',
                                                textTransform: 'uppercase',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                padding: '0 6px 0 0',
                                                margin: 0,
                                                width: 'auto',
                                                maxWidth: '70px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                appearance: 'none',
                                                flexShrink: 1,
                                            }}
                                        >
                                            {ALL_METRICS.map(m => (
                                                <option key={m.value} value={m.value} style={{ background: '#0f1626', color: '#ffffff' }}>
                                                    {m.shortLabel.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{ color: leftStyle.color, fontSize: '0.45rem', marginLeft: '-4px', pointerEvents: 'none', flexShrink: 0 }}>▼</span>
                                        
                                        <select
                                            value={track.left.max}
                                            onChange={(e) => handleTrackScaleChange(index, 'left', 'max', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#64748b',
                                                fontWeight: '900',
                                                fontSize: '0.6rem',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                padding: '0 6px 0 0',
                                                margin: 0,
                                                width: 'auto',
                                                maxWidth: '30px',
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                appearance: 'none',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {leftMaxOptions.map(v => (
                                                <option key={v} value={v} style={{ background: '#0f1626', color: '#ffffff' }}>
                                                    {v}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{ color: '#64748b', fontSize: '0.45rem', marginLeft: '-4px', pointerEvents: 'none', flexShrink: 0 }}>▼</span>
                                    </Box>
                                    
                                    {/* Value row */}
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.25, mt: 0.25, width: '100%', overflow: 'hidden' }}>
                                        <Typography sx={{ 
                                            fontWeight: '900', 
                                            color: leftStyle.deepColor, 
                                            fontSize: '1.25rem', 
                                            lineHeight: 1,
                                            fontFamily: '"Outfit", sans-serif',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {getLatestValue(track.left.metric)}
                                        </Typography>
                                        <Typography sx={{ 
                                            color: '#64748b', 
                                            fontSize: '0.6rem', 
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.02em',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}>
                                            {getMetricUnitLabel(track.left.metric)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Center divider */}
                                <Box sx={{ width: '1px', bgcolor: '#f1f5f9', alignSelf: 'stretch', flexShrink: 0 }} />

                                {/* Right Parameter readout */}
                                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25, pl: 1 }}>
                                    {/* Header selects row: min, menu-icon, parameter, max */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: '100%', overflow: 'hidden' }}>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>0</Typography>
                                        <List size={10} style={{ color: '#64748b', flexShrink: 0 }} />
                                        <select
                                            value={track.right.metric}
                                            onChange={(e) => handleTrackMetricChange(index, 'right', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: rightStyle.color,
                                                fontWeight: '900',
                                                fontSize: '0.6rem',
                                                textTransform: 'uppercase',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                padding: '0 6px 0 0',
                                                margin: 0,
                                                width: 'auto',
                                                maxWidth: '70px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                appearance: 'none',
                                                flexShrink: 1,
                                            }}
                                        >
                                            {ALL_METRICS.map(m => (
                                                <option key={m.value} value={m.value} style={{ background: '#0f1626', color: '#ffffff' }}>
                                                    {m.shortLabel.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{ color: rightStyle.color, fontSize: '0.45rem', marginLeft: '-4px', pointerEvents: 'none', flexShrink: 0 }}>▼</span>
                                        
                                        <select
                                            value={track.right.max}
                                            onChange={(e) => handleTrackScaleChange(index, 'right', 'max', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#64748b',
                                                fontWeight: '900',
                                                fontSize: '0.6rem',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                padding: '0 6px 0 0',
                                                margin: 0,
                                                width: 'auto',
                                                maxWidth: '30px',
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                appearance: 'none',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {rightMaxOptions.map(v => (
                                                <option key={v} value={v} style={{ background: '#0f1626', color: '#ffffff' }}>
                                                    {v}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{ color: '#64748b', fontSize: '0.45rem', marginLeft: '-4px', pointerEvents: 'none', flexShrink: 0 }}>▼</span>
                                    </Box>

                                    {/* Value row */}
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.25, mt: 0.25, width: '100%', overflow: 'hidden' }}>
                                        <Typography sx={{ 
                                            fontWeight: '900', 
                                            color: rightStyle.deepColor, 
                                            fontSize: '1.25rem', 
                                            lineHeight: 1,
                                            fontFamily: '"Outfit", sans-serif',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {getLatestValue(track.right.metric)}
                                        </Typography>
                                        <Typography sx={{ 
                                            color: '#64748b', 
                                            fontSize: '0.6rem', 
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.02em',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}>
                                            {getMetricUnitLabel(track.right.metric)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>

            {/* ── Export Dialog ── */}
            <Dialog
                open={exportDialogOpen}
                onClose={() => !isExporting && setExportDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1e293b',
                        color: 'white',
                        minWidth: 480,
                        border: '1px solid #334155',
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #334155', pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Download size={20} color="#fbbf24" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Export EDR Data</Typography>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {/* Format selector */}
                    <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                        Export Format
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                        {[
                            { id: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet size={18} />, color: '#22c55e' },
                            { id: 'csv',  label: 'CSV (.csv)',   icon: <FileText size={18} />,        color: '#38bdf8' },
                        ].map(fmt => (
                            <Button
                                key={fmt.id}
                                variant={exportFormat === fmt.id ? 'contained' : 'outlined'}
                                startIcon={fmt.icon}
                                onClick={() => setExportFormat(fmt.id)}
                                sx={{
                                    flex: 1,
                                    bgcolor: exportFormat === fmt.id ? fmt.color : 'transparent',
                                    color: exportFormat === fmt.id ? '#0f172a' : fmt.color,
                                    borderColor: fmt.color,
                                    fontWeight: exportFormat === fmt.id ? 'bold' : 'normal',
                                    '&:hover': { bgcolor: `${fmt.color}22`, borderColor: fmt.color }
                                }}
                            >
                                {fmt.label}
                            </Button>
                        ))}
                    </Box>

                    <Divider sx={{ borderColor: '#334155', mb: 3 }} />

                    {/* Time range */}
                    <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                        Quick Select
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {[
                            { label: 'Last 15 min', val: '-15m' },
                            { label: 'Last 1 hour', val: '-1h' },
                            { label: 'Last 6 hours', val: '-6h' },
                            { label: 'Last 12 hours', val: '-12h' },
                            { label: 'Last 24 hours', val: '-24h' },
                            { label: 'Last 3 days',  val: '-3d'  },
                            { label: 'Last 7 days',  val: '-7d'  },
                            { label: 'Last 30 days', val: '-30d' },
                        ].map(opt => (
                            <Button
                                key={opt.val}
                                variant={!exportIsCustom && exportPreset === opt.val ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => { setExportPreset(opt.val); setExportIsCustom(false); }}
                                sx={{
                                    bgcolor: !exportIsCustom && exportPreset === opt.val ? '#fbbf24' : 'transparent',
                                    color: !exportIsCustom && exportPreset === opt.val ? '#0f172a' : '#cbd5e1',
                                    borderColor: !exportIsCustom && exportPreset === opt.val ? '#fbbf24' : '#334155',
                                    fontWeight: !exportIsCustom && exportPreset === opt.val ? 'bold' : 'normal',
                                    '&:hover': { borderColor: '#fbbf24', color: '#fbbf24' }
                                }}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </Box>

                    <Divider sx={{ borderColor: '#334155', mb: 3 }} />

                    {/* Custom date range */}
                    <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                        Custom Date Range
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 180 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>From</Typography>
                            <input
                                type="datetime-local"
                                value={exportCustom.start}
                                onChange={e => { setExportCustom(p => ({ ...p, start: e.target.value })); setExportIsCustom(true); }}
                                style={{
                                    width: '100%', background: '#0f172a', color: 'white',
                                    border: `1px solid ${exportIsCustom ? '#fbbf24' : '#334155'}`,
                                    borderRadius: 6, padding: '8px 10px', colorScheme: 'dark', fontSize: 13
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 180 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>To</Typography>
                            <input
                                type="datetime-local"
                                value={exportCustom.end}
                                onChange={e => { setExportCustom(p => ({ ...p, end: e.target.value })); setExportIsCustom(true); }}
                                style={{
                                    width: '100%', background: '#0f172a', color: 'white',
                                    border: `1px solid ${exportIsCustom ? '#fbbf24' : '#334155'}`,
                                    borderRadius: 6, padding: '8px 10px', colorScheme: 'dark', fontSize: 13
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Summary label */}
                    <Box sx={{ mt: 3, p: 1.5, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #334155' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            📤 Will export EDR metrics for selected time-period.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #334155' }}>
                    <Button onClick={() => setExportDialogOpen(false)} disabled={isExporting} sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={doExport}
                        disabled={isExporting}
                        sx={{
                            bgcolor: '#fbbf24',
                            color: '#0f172a',
                            fontWeight: 'bold',
                            px: 3,
                            '&:hover': { bgcolor: '#f59e0b' }
                        }}
                    >
                        {isExporting ? 'Exporting...' : 'Export Now'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
