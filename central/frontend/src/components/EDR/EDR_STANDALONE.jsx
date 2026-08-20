/*
 * EDR_ONE_FILE_COPY.jsx
 * Copy this one file into another React/Vite project, then import it as your EDR page.
 * Required npm packages: @mui/material @emotion/react @emotion/styled lucide-react axios
 * Backend expected endpoints/events: GET /api/rig/history, GET /api/rig/latest, WebSocket /ws/realtime.
 * For Modbus projects, keep this UI unchanged and map your Modbus tags in backend to measurement.field names.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    ListItemText,
    ListSubheader,
    MenuItem,
    Paper,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip as MuiTooltip,
    Typography,
    useTheme
} from '@mui/material';
import {
    ChevronsDown,
    ChevronsUp,
    Clock,
    Download,
    Gauge,
    Plus,
    Radio,
    Ruler,
    Settings,
    SlidersHorizontal,
    Trash2
} from 'lucide-react';
import axios from 'axios';

const getModbusDevices = async () => {
    try {
        const res = await axios.get('/api/modbus');
        return res.data && res.data.slaves ? res.data.slaves : [];
    } catch (e) {
        console.error('EdrView: getModbusDevices local fallback failed', e);
        return [];
    }
};

const FIELD_MAP = {
    "HOOK_LOAD": { meas: "drawworks", field: "hook_load" },
    "BLOCK_POSITION": { meas: "drawworks", field: "block_position" },
    "ENGINE_RPM": { meas: "engine", field: "rpm" },
    "OIL_PRESSURE": { meas: "engine", field: "oil_pressure" },
    "OIL_TEMP": { meas: "engine", field: "oil_temp" },
    "COOLANT_TEMP": { meas: "engine", field: "coolant_temp" },
    "EXHAUST_TEMP": { meas: "engine", field: "exhaust_temp" },
    "FUEL_LEVEL": { meas: "engine", field: "fuel_level" },
    "BATTERY_VOLTAGE": { meas: "engine", field: "battery_voltage" },
    "SPM_1": { meas: "mudpump", field: "spm" },
    "SPM_2": { meas: "mudpump", field: "spm_2" },
    "TOTAL_SPM": { meas: "mudpump", field: "total_spm" },
    "PUMP_PRESSURE": { meas: "mudpump", field: "pressure" },
    "FLOW_IN": { meas: "mudpump", field: "flow_in" },
    "FLOW_OUT": { meas: "mudpump", field: "flow_out" },
    "TORQUE": { meas: "drilling", field: "torque" },
    "TUBING_PRESSURE": { meas: "wellcontrol", field: "tubing_pressure" },
    "CASING_PRESSURE": { meas: "wellcontrol", field: "casing_pressure" },
    "BOP_PRESSURE": { meas: "wellcontrol", field: "bop_pressure" },
    "ACCUMULATOR_PRESSURE": { meas: "wellcontrol", field: "accumulator_pressure" },
    "MANIEFOLD_PRESSURE": { meas: "wellcontrol", field: "manifold_pressure" },
    "MANIFOLD_PRESSURE": { meas: "wellcontrol", field: "manifold_pressure" },
    "ANNULAR_PRESSURE": { meas: "wellcontrol", field: "annular_pressure" },
    "TRIP_TANK": { meas: "fluid", field: "trip_tank" },
    "RIG_AIR_PRESSURE": { meas: "system", field: "rig_air_pressure" },
    "CROWNOMATIC": { meas: "drawworks", field: "crownomatic" },
    "FLOOROMATIC": { meas: "drawworks", field: "flooromatic" },
    "ANNULAR_OPEN": { meas: "wellcontrol", field: "annular_open" },
    "ANNULARRAM_OPEN": { meas: "wellcontrol", field: "annular_open" },
    "ANNULARRAM_CLOSE": { meas: "wellcontrol", field: "annular_close" },
    "PIPE_RAM_OPEN": { meas: "wellcontrol", field: "pipe_ram_open" },
    "PIPE_RAM_CLOSE": { meas: "wellcontrol", field: "pipe_ram_close" },
    "BLIND_RAM_OPEN": { meas: "wellcontrol", field: "blind_ram_open" },
    "BLIND_RAM_CLOSE": { meas: "wellcontrol", field: "blind_ram_close" },
    "SHEAR_RAM_OPEN": { meas: "wellcontrol", field: "shear_ram_open" },
    "TRAVELLING_UP": { meas: "drawworks", field: "travelling_up" },
    "TRAVELLING_DOWN": { meas: "drawworks", field: "travelling_down" }
};

const edrCatalog = {
  "categories": [
    {
      "id": "drilling",
      "label": "Drilling",
      "fields": [
        {
          "id": "bit_depth",
          "label": "Bit Depth",
          "unit": "m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 3000,
          "plcTag": "Bit Depth-m"
        },
        {
          "id": "delta_torque",
          "label": "Delta Torque",
          "unit": "daN.m",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5000,
          "plcTag": "Delta Torque-daN*m"
        },
        {
          "id": "hole_depth",
          "label": "Hole Depth",
          "unit": "m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 3000,
          "plcTag": "TOTAL BIT Depth-m"
        },
        {
          "id": "hook_load",
          "label": "Hook Load",
          "unit": "ton",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "drilling.hook_load"
        },
        {
          "id": "operation_mode",
          "label": "Operation",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 4,
          "plcTag": "Operation-1=DRILLING, 2=TRIP IN, 3=TRIP OUT, 4=CASING"
        },
        {
          "id": "rop",
          "label": "ROP",
          "unit": "m/h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 80,
          "plcTag": "ROP-m/h"
        },
        {
          "id": "rpm",
          "label": "Rotary RPM",
          "unit": "rpm",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 250,
          "plcTag": "Drill String Speed-RPM"
        },
        {
          "id": "torque",
          "label": "Rotary Torque",
          "unit": "daN.m",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "Drill String Torque-daN*m"
        },
        {
          "id": "wob",
          "label": "Weight on Bit",
          "unit": "ton",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "WOB -Ton"
        }
      ]
    },
    {
      "id": "drawworks",
      "label": "Drawworks",
      "fields": [
        {
          "id": "block_position",
          "label": "Block Position",
          "unit": "m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 50,
          "plcTag": "ACS Actual Block Position"
        },
        {
          "id": "hook_load",
          "label": "Hook Load",
          "unit": "ton",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "Weight on Hook -Ton"
        },
        {
          "id": "rope_wear",
          "label": "Ropes Wear/Km",
          "unit": "m/h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "Ropes Wear-ton/km"
        }
      ]
    },
    {
      "id": "mudpump",
      "label": "Mud Pump",
      "fields": [
        {
          "id": "delta_pressure",
          "label": "Delta SPP",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Delta SPP-Bar"
        },
        {
          "id": "flow_in",
          "label": "Flow In",
          "unit": "L/min",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1200,
          "plcTag": "Mud Pump Inlet Flow-Lt/min"
        },
        {
          "id": "flow_out_percentage",
          "label": "Flow Out",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "mudpump.flow_out_percentage"
        },
        {
          "id": "flow_out",
          "label": "Mud Return Flow -%",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "Mud Return Flow -%"
        },
        {
          "id": "pressure",
          "label": "Pump Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "SPP-Bar"
        },
        {
          "id": "spm",
          "label": "SPM",
          "unit": "spm",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 200,
          "plcTag": "Mud Pumps Total SPM-SPM"
        },
        {
          "id": "total_spm",
          "label": "Total SPM",
          "unit": "spm",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 400,
          "plcTag": "Mud Pumps Totals Strokes-Count"
        }
      ]
    },
    {
      "id": "fluid",
      "label": "Fluid",
      "fields": [
        {
          "id": "trip_tank_percentage",
          "label": "Active TripTank Volume Gain/Loss -%",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Active TripTank Volume Gain/Loss -%"
        },
        {
          "id": "tank_1",
          "label": "Mud Tank 1 Volume",
          "unit": "m3",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Mud Tank 1 Volume -m^3"
        },
        {
          "id": "tank_2",
          "label": "Mud Tank 2 Volume",
          "unit": "m3",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Mud Tank 2 Volume -m^3"
        },
        {
          "id": "tank_3",
          "label": "Mud Tank 3 Volume",
          "unit": "m3",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Mud Tank 3 Volume -m^3"
        },
        {
          "id": "tank_4",
          "label": "Mud Tank 4 Volume",
          "unit": "m3",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Mud Tank 4 Volume -m^3"
        },
        {
          "id": "tank_gain_loss",
          "label": "Tank Gain/Loss",
          "unit": "m3",
          "precision": 1,
          "defaultMin": -50,
          "defaultMax": 50,
          "plcTag": "Active Tank Volume Gain/Loss -m^3"
        },
        {
          "id": "total_tank_volume",
          "label": "Tank Volume",
          "unit": "m3",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "Total Active Tank Volume-m^3"
        },
        {
          "id": "trip_tank",
          "label": "Trip Tank",
          "unit": "m3",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 50,
          "plcTag": "Trip Tank Active Mud Volume -m^3"
        }
      ]
    },
    {
      "id": "wellhead",
      "label": "Wellhead / Pressures",
      "fields": [
        {
          "id": "casing_pressure",
          "label": "Casing Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 350,
          "plcTag": "Casing Pressure-Bar"
        },
        {
          "id": "tubing_pressure",
          "label": "Tubing Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 350,
          "plcTag": "Tubing Pressure-Bar"
        },
        {
          "id": "wellhead_pressure",
          "label": "Wellhead Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 350,
          "plcTag": "Wellhead Pressure-Bar"
        }
      ]
    },
    {
      "id": "safety",
      "label": "Safety",
      "fields": [
        {
          "id": "esd_active",
          "label": "Emergency Stop",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "Emergency Stop-0=NORMAL, 1=ESD ACTIVE"
        },
        {
          "id": "lockout_active",
          "label": "Equipment Lockout",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "Equipment Lockout-0=NORMAL, 1=LOCKED OUT"
        }
      ]
    },
    {
      "id": "cat_engine",
      "label": "CAT Engine",
      "fields": [
        {
          "id": "battery_voltage",
          "label": "Battery Voltage",
          "unit": "V",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 32,
          "plcTag": "CAT Engine ElectricalPotential"
        },
        {
          "id": "pedal_position",
          "label": "CAT Engine ACCELERATION PEDAL POSITION",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 50,
          "plcTag": "CAT Engine ACCELERATION PEDAL POSITION"
        },
        {
          "id": "coolant_level",
          "label": "CAT Engine CoolantLevelPercentage",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "CAT Engine CoolantLevelPercentage"
        },
        {
          "id": "fuel_temp",
          "label": "CAT Engine FuelTemperature",
          "unit": "C",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 120,
          "plcTag": "CAT Engine FuelTemperature"
        },
        {
          "id": "total_fuel",
          "label": "CAT Engine TotalFuelUsed",
          "unit": "L",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "CAT Engine TotalFuelUsed"
        },
        {
          "id": "total_hours",
          "label": "CAT Engine TotalHoursOperation",
          "unit": "h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 10000,
          "plcTag": "CAT Engine TotalHoursOperation"
        },
        {
          "id": "run_hours",
          "label": "CAT RunHours",
          "unit": "h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 10000,
          "plcTag": "CAT RunHours"
        },
        {
          "id": "source_cmd",
          "label": "CAT Sourcecmd",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 6,
          "plcTag": "CAT Sourcecmd-0=NONE, 1=LOCAL, 2=REMOTE, 3=MANUAL, 4=AUTO, 5=DCC, 6=---"
        },
        {
          "id": "status",
          "label": "CAT Status",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 7,
          "plcTag": "CAT status- -1=UNKNOWN, 0=READY, 1=IN PROGRESS, 2=STATUS DONE, 3=EMERGENCY NOT OK, 4=NOT READY, 5=FAULT, 6 = RUNNING + FAULT, 7=STOP FORCED "
        },
        {
          "id": "coolant_temp",
          "label": "Eng Coolant Temp",
          "unit": "C",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 120,
          "plcTag": "CAT Engine CoolantTemperature"
        },
        {
          "id": "load",
          "label": "Engine Load",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "CAT Engine TorquePercentage"
        },
        {
          "id": "rpm",
          "label": "Eng RPM",
          "unit": "rpm",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2000,
          "plcTag": "CAT Engine speed RPM"
        },
        {
          "id": "fuel_pressure",
          "label": "Fuel Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 20,
          "plcTag": "CAT Engine FuelDeliveryPressure"
        },
        {
          "id": "fuel_rate",
          "label": "Fuel Rate",
          "unit": "L/h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 120,
          "plcTag": "CAT Engine FuelRate"
        },
        {
          "id": "oil_pressure",
          "label": "Eng Oil Press.",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 10,
          "plcTag": "CAT Engine OilPressure"
        }
      ]
    },
    {
      "id": "acs",
      "label": "ACS",
      "fields": [
        {
          "id": "calibration_status",
          "label": "ACS Calibration Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 11,
          "plcTag": "ACS Calibration status--1=UNKNOWN, 1=SEQ IN PROGRESS, 2=NOT CALIBRATED, 3=CALIBRATED,10=MOVE UP TO CROWN, 10=MOVE UP TO CROWN, 11=MOVE DOWN TO TAG LOW "
        },
        {
          "id": "status",
          "label": "ACS Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 3,
          "plcTag": "ACS status-0=UNKNONE, 1=ON, 2=OFF, 3=DISABLE "
        },
        {
          "id": "block_position",
          "label": "Block Position",
          "unit": "m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 50,
          "plcTag": "acs.block_position"
        },
        {
          "id": "bottomsaver",
          "label": "Bottomsaver",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "ACS Bottomsaver in mm"
        },
        {
          "id": "crownsaver",
          "label": "Crownsaver",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "ACS Crownsaver in mm"
        },
        {
          "id": "floorsaver",
          "label": "Floorsaver",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "ACS floorsaver in mm"
        },
        {
          "id": "lower_tag",
          "label": "Lower Tag",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "ACS Lowertag position in mm"
        },
        {
          "id": "upper_tag",
          "label": "Upper Tag",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "ACS UPPERTAG POSITION mm"
        }
      ]
    },
    {
      "id": "hpu",
      "label": "HPU",
      "fields": [
        {
          "id": "aux_pressure",
          "label": "Aux Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 300,
          "plcTag": "HPU Auxilary line pressure in bar"
        },
        {
          "id": "discharge_pressure",
          "label": "Discharge Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 300,
          "plcTag": "HPU Discharge line pressure in bar"
        },
        {
          "id": "gate_valve",
          "label": "HPU Gate Valve",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 1,
          "plcTag": "HPU Gate valve-1=OPEN, 0=CLOSE"
        },
        {
          "id": "htd_pump1_flow",
          "label": "HTD PUMP-2 Flow Rate",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "HPU HydrPumpHTD pump1 actual flow %"
        },
        {
          "id": "htd_pump1_press",
          "label": "HTD PUMP-2 Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "HPU HydrPumpHTD pump1 Actual Press bar"
        },
        {
          "id": "htd_pump1_status",
          "label": "HTD PUMP-2 Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HPU HydrPumpHTD pump1 status-0=NOT READY, 1=READY, 2=ENABLE"
        },
        {
          "id": "htd_pump2_flow",
          "label": "HTD PUMP-4 Flow Rate",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "HPU HydrPumpHTD pump2 actual flow %"
        },
        {
          "id": "htd_pump2_press",
          "label": "HTD PUMP-4 Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "HPU HydrPumpHTD pump2 Actual Press bar"
        },
        {
          "id": "htd_pump2_status",
          "label": "HTD PUMP-4 Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HPU HydrPumpHTD pump2 status-0=NOT READY, 1=READY, 2=ENABLE"
        },
        {
          "id": "pdw_pump_flow",
          "label": "PUMP-3 PDW Flow Rate",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "HPU HydrPumpPDW actual flow %"
        },
        {
          "id": "pdw_pump_press",
          "label": "PUMP-3 PDW Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "HPU HydrPumpPDW Actual Press bar"
        },
        {
          "id": "pdw_pump_status",
          "label": "PUMP-3 PDW Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HPU HydrPumpPDW status-0=NOT READY, 1=READY, 2=ENABLE"
        },
        {
          "id": "oil_filter_1",
          "label": "HPU Oil Filter:1",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:1-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_2",
          "label": "HPU Oil Filter:2",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:2-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_3",
          "label": "HPU Oil Filter:3",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:3-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_4",
          "label": "HPU Oil Filter:4",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:4-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_5",
          "label": "HPU Oil Filter:5",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:5-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_6",
          "label": "HPU Oil Filter:6",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:6-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_7",
          "label": "HPU Oil Filter:7",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:7-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_filter_8",
          "label": "HPU Oil Filter:8",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "HPU Oil filter:8-1=OK, 0=CLOGGED"
        },
        {
          "id": "oil_level_status",
          "label": "HPU Oil Level",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 4,
          "plcTag": "HPU Oil level-0=Level OK, 1=Level Low, 2=Level Low-Low, 3=Level High, 4= Level High-High"
        },
        {
          "id": "oil_temp_status",
          "label": "HPU Oil Temp",
          "unit": "C",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 3,
          "plcTag": "HPU Oil temp-0=Temp. OK, 1=Temp. Low, 2=Temp. High, 3=Temp. High-High"
        },
        {
          "id": "op_mode",
          "label": "HPU Oprmode-0 = Unknown, 1 = Drilling 2 = RigUp",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HPU Oprmode-0 = Unknown, 1 = Drilling 2 = RigUp"
        },
        {
          "id": "pilot_pressure",
          "label": "HPU Pilot ActLSPress",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "HPU Pilot ActLSPress bar"
        },
        {
          "id": "pilot_status",
          "label": "HPU Pilot Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HPU Pilot status-0=OFF, 1=ON, 2=FAULT"
        },
        {
          "id": "run_hours",
          "label": "HPU RUN HOURS",
          "unit": "h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 10000,
          "plcTag": "HPU RUN HOURS"
        },
        {
          "id": "status",
          "label": "HPU Status-0 = OFF, 1 = ON In IDLE, 2 = ON",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HPU status-0 = OFF, 1 = ON in IDLE, 2 = ON "
        },
        {
          "id": "oil_level",
          "label": "Oil Level",
          "unit": "%",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 100,
          "plcTag": "HPU ActOil level in %"
        },
        {
          "id": "oil_temp",
          "label": "Oil Temp",
          "unit": "C",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 120,
          "plcTag": "HPU ActTemp in c"
        }
      ]
    },
    {
      "id": "htd",
      "label": "HTD",
      "fields": [
        {
          "id": "brake_status",
          "label": "HTD Brake Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "HTD Brake Status-0=Unknown, 1 = Closing, 2 = Closed, 3 = Opening, 4 = Open, 5 = Fault"
        },
        {
          "id": "rpm_command",
          "label": "HTD COMMAND",
          "unit": "rpm",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 250,
          "plcTag": "HTD rpm COMMAND"
        },
        {
          "id": "elevator_status",
          "label": "HTD Elevator Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "HTD Elevator Status-0= Uncknown, 1 = Opening, 2 = Closing, 3 = Open, 4 = Close, 5 = Fault"
        },
        {
          "id": "gear_status",
          "label": "HTD GEAR Status",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 8,
          "plcTag": "HTD GEAR status--2=UNKNOWN, -1=FAULT, 1=GEAR 1, 2=GEAR 2, 3=GEAR 3, 4=GEAR 4. 5= GEAR 1 REGENERATIVE, 6= GEAR 2 REGENERATIVE, 7=GEAR 3 REGENERATIVE, 8= GEAR 4 REGENERATIVE"
        },
        {
          "id": "ibop_status",
          "label": "HTD IBOP Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "HTD IBOP Status-0= Uncknown, 1 = Opening, 2 = Closing, 3 = Open, 4 = Close, 5 = Fault"
        },
        {
          "id": "inclination_status",
          "label": "HTD Inclination Status",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 8,
          "plcTag": "HTD Inclination status-1= Inclination IN in progress, 2=Inclination IN, 3=Inclination OUT in progress, 4=Inclinated OUT, 5=Half Way, 6=Stand Still, 7=Tilted In, 8=Tilted Out"
        },
        {
          "id": "link_rotation_status",
          "label": "HTD Link Rotation Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 7,
          "plcTag": "HTD Link rotation Status-0= Uncknown, 1 = Unlocking, 2 = Unlocked, 3 = Rot. Fwd, 4 = Rot. Bwd, 5 = Locking, 6 = Locked ,  7 = Fault"
        },
        {
          "id": "tilt_status",
          "label": "HTD Link Tilt Status-0 = None, 1 = Float ON, 2 = Vertical, 3 = Float OFF, 4 = Extend, 5 = Retract, 6 = Fault",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 6,
          "plcTag": "HTD Link Tilt status-0 = None, 1 = Float ON, 2 = Vertical, 3 = Float OFF, 4 = Extend, 5 = Retract, 6 = Fault"
        },
        {
          "id": "lube_status",
          "label": "HTD Lube Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 3,
          "plcTag": "HTD Lube Status-0=OFF, 1=CMD RUN, 2=RUNNING, 3 = FAULT"
        },
        {
          "id": "op_mode",
          "label": "HTD Opmode-0 = Unknown, 1 = Dolly 2 = Link",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HTD opmode-0 = Unknown, 1 = Dolly 2 = Link"
        },
        {
          "id": "rpm_request",
          "label": "HTD Request",
          "unit": "rpm",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 250,
          "plcTag": "HTD rpm Request"
        },
        {
          "id": "rotation_status",
          "label": "HTD Rotation Status-0 = Stand Still, 1 = Rotation FWD, 2 = Rotation BWD, 3 = Neutral",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 3,
          "plcTag": "HTD Rotation Status-0 = Stand still, 1 = Rotation FWD, 2 = Rotation BWD, 3 = Neutral"
        },
        {
          "id": "rpm",
          "label": "HTD RPM",
          "unit": "rpm",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 250,
          "plcTag": "HTD rpm"
        },
        {
          "id": "status",
          "label": "HTD Status-0 = OFF, 1 = ON In IDLE, 2 = ON",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HTD status-0 = OFF, 1 = ON in IDLE, 2 = ON "
        },
        {
          "id": "suspension_status",
          "label": "HTD Suspensions Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "HTD suspensions Status-0=none, 1= in push, 2= in pull"
        },
        {
          "id": "tilt_status_db65",
          "label": "HTD Tilt Status",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 6,
          "plcTag": "HTD Tilt status-1= Tilting IN, 2=Tilt IN, 3=Tilting OUT, 4=Tilt OUT, 5=Half Way, 6=Stand Still"
        },
        {
          "id": "torque",
          "label": "HTD Torque",
          "unit": "daN.m",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2000,
          "plcTag": "HTD TORQUE DaNm"
        },
        {
          "id": "torque_command",
          "label": "HTD Torque COMMAND",
          "unit": "daN.m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "HTD torque COMMAND"
        },
        {
          "id": "torque_request",
          "label": "HTD Torque Request",
          "unit": "daN.m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "HTD torque Request"
        },
        {
          "id": "working_hours",
          "label": "HTD WORKING HOURS",
          "unit": "h",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 10000,
          "plcTag": "HTD WORKING HOURS"
        },
        {
          "id": "working_minutes",
          "label": "HTD WORKING MINUTES",
          "unit": "min",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 10000,
          "plcTag": "HTD WORKING MINUTES"
        },
        {
          "id": "work_mode",
          "label": "HTD Workmode-0 = Unknown, 1 = Drill, 2 = Spin, 3 = Torque",
          "unit": "daN.m",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 3,
          "plcTag": "HTD workmode-0 = Unknown, 1 = Drill, 2 = Spin, 3 = Torque"
        },
        {
          "id": "inclination",
          "label": "Inclination",
          "unit": "deg",
          "precision": 1,
          "defaultMin": -90,
          "defaultMax": 90,
          "plcTag": "HTD Inclination angle in %"
        },
        {
          "id": "vertical_speed",
          "label": "Vertical Speed",
          "unit": "m/s",
          "precision": 2,
          "defaultMin": -5,
          "defaultMax": 5,
          "plcTag": "HTD vertical speed"
        }
      ]
    },
    {
      "id": "cwk",
      "label": "CWK",
      "fields": [
        {
          "id": "clamp_force",
          "label": "Clamp Force",
          "unit": "kN",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "CWK Clamp Actcloseforce"
        },
        {
          "id": "clamp_pressure",
          "label": "Clamp Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 300,
          "plcTag": "CWK Clamp close pressure"
        },
        {
          "id": "carrier_status",
          "label": "CWK Carrier",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 6,
          "plcTag": "CWK Carrier-1= STOP, 2=PARKING POSITION, 3= WORK POSITION, 4= LIFTING, 5=LOWERING, 6=FAULT"
        },
        {
          "id": "clamp_status",
          "label": "CWK Clamp",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "CWK Clamp-0=NONE, 1=OPENING, 2=CLOSING, 3=IS OPEN, 4=IS CLOSE, 5=FAULT"
        },
        {
          "id": "clamp_force_ok",
          "label": "CWK Clamp Actcloeforce Ok",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "CWK Clamp Actcloeforce ok"
        },
        {
          "id": "clamp_pressure_ok",
          "label": "CWK Clamp Close Pressure OK",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "CWK Clamp close pressure OK"
        },
        {
          "id": "indexer_dx",
          "label": "CWK Indexer DX",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 3,
          "plcTag": "CWK Indexer DX-1=UP, 2=DOWN, 3=FAULT"
        },
        {
          "id": "indexer_sx",
          "label": "CWK Indexer SX",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 3,
          "plcTag": "CWK Indexer SX-1=UP, 2=DOWN, 3=FAULT"
        },
        {
          "id": "kickers_dx",
          "label": "CWK Kickers DX",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 3,
          "plcTag": "CWK Kickers DX-1=EXTEND, 2=RETRACT, 3=FAULT"
        },
        {
          "id": "kickers_sx",
          "label": "CWK Kickers SX",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 3,
          "plcTag": "CWK Kickers SX-1=EXTEND, 2=RETRACT, 3=FAULT"
        },
        {
          "id": "skate_status",
          "label": "CWK Skate",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 5,
          "plcTag": "CWK Skate-1=IDLE, 2=PARKING POSITION, 3=FWD CMD, 4=BWD CMD, 5=FAULT"
        },
        {
          "id": "slide_status",
          "label": "CWK Slide",
          "unit": "",
          "precision": 0,
          "defaultMin": -1,
          "defaultMax": 5,
          "plcTag": "CWK Slide-1=IDLE, 2=PARKING POSITION, 3=FWD CMD, 4=BWD CMD, 5=FAULT"
        },
        {
          "id": "source_cmd",
          "label": "CWK Sourcecmd-0 = UNKNOWN, 1 = DCC, 2 = RADIOCONTROL",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "CWK sourcecmd-0 = UNKNOWN, 1 = DCC, 2 = RADIOCONTROL"
        },
        {
          "id": "status",
          "label": "CWK Status",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "CWK status-0= NOT IN PARK POSITION, 1=PARK POSITION "
        }
      ]
    },
    {
      "id": "pct",
      "label": "PCT",
      "fields": [
        {
          "id": "clamp_low_pressure",
          "label": "Clamp Lower Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 300,
          "plcTag": "PCT Clamp low close pressure"
        },
        {
          "id": "clamp_up_pressure",
          "label": "Clamp Upper Pressure",
          "unit": "bar",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 300,
          "plcTag": "PCT Clamp up close pressure"
        },
        {
          "id": "last_makeup_torque",
          "label": "Last Makeup Torque",
          "unit": "daN.m",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "PCT ClampLastMakeUpTorque-daN*m"
        },
        {
          "id": "makeup_torque",
          "label": "Makeup Torque",
          "unit": "daN.m",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "PCT Makeup Torque-daN*m"
        },
        {
          "id": "clamp_low_force",
          "label": "PCT Clamp Low ActCloseForce",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "PCT Clamp low ActCloseForce"
        },
        {
          "id": "clamp_low_force_ok",
          "label": "PCT Clamp Low ActCloseForce Ok",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "PCT Clamp low ActCloseForce ok"
        },
        {
          "id": "clamp_low_pressure_ok",
          "label": "PCT Clamp Low Close Pressure Ok",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "PCT Clamp low close pressure ok"
        },
        {
          "id": "clamp_low_open_ok",
          "label": "PCT Clamp Low Open Pressure Ok",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "PCT Clamp low open pressure ok"
        },
        {
          "id": "clamp_rotation_status",
          "label": "PCT Clamp Roatation",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "PCT Clamp Roatation-0=NONE, 1=NOT ALLIGNED, 2=ALLIGNED, 3=MAKE-UP, 4=BREAK-OUT, 5=FAULT"
        },
        {
          "id": "clamp_up_force",
          "label": "PCT Clamp Up ActCloseForce",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "PCT Clamp up ActCloseForce"
        },
        {
          "id": "clamp_up_force_ok",
          "label": "PCT Clamp Up ActCloseForce Ok",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "PCT Clamp up ActCloseForce ok"
        },
        {
          "id": "clamp_up_pressure_ok",
          "label": "PCT Clamp Up Close Pressure Ok",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "PCT Clamp up close pressure ok"
        },
        {
          "id": "clamp_up_open_ok",
          "label": "PCT Clamp Up Open Pressure Ok",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1,
          "plcTag": "PCT Clamp up open pressure ok"
        },
        {
          "id": "clamp_low_status",
          "label": "PCT Clamplow",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "PCT Clamplow-0=NONE, 1=OPENING, 2=CLOSING, 3=IS OPEN, 4=IS CLOSE, 5=FAULT"
        },
        {
          "id": "clamp_up_status",
          "label": "PCT ClampUp",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 5,
          "plcTag": "PCT ClampUp-0=NONE, 1=OPENING, 2=CLOSING, 3=IS OPEN, 4=IS CLOSE, 5=FAULT"
        },
        {
          "id": "dolly_direction",
          "label": "PCT DOLLY UP DOWN",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "PCT DOLLY UP DOWN-0=NO CMD ACTIVE, 1=MOVE UP, 2=MOVE DOWN"
        },
        {
          "id": "dolly_status",
          "label": "PCT DollyWorkPark",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 6,
          "plcTag": "PCT DollyWorkPark-0=NONE, 1=OUT PARK. POS, 2=MOVE WORK, 3=MOVE PARK, 4=IN PARK, 5=FAULT, 6=in work"
        },
        {
          "id": "op_mode",
          "label": "PCT Operation Mode-0 = UNKNOWN, 1 = NORMAL, 2 = MANUAL",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "PCT Operation mode-0 = UNKNOWN, 1 = NORMAL, 2 = MANUAL"
        },
        {
          "id": "rotation_breakout_pressure",
          "label": "PCT ROTATION ActBOutPress",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "PCT ROTATION ActBOutPress"
        },
        {
          "id": "rotation_makeup_pressure",
          "label": "PCT ROTATION ActMakeUpPress",
          "unit": "",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 500,
          "plcTag": "PCT ROTATION ActMakeUpPress"
        },
        {
          "id": "sequence",
          "label": "PCT Sequence",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 4,
          "plcTag": "PCT Sequence-0=OFF, 1=MAKE-UP, 2=BREAK-OUT, 3=RESET, 4=FAULT"
        },
        {
          "id": "spinner_floating",
          "label": "PCT SPINNER FLOATING",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 10,
          "plcTag": "PCT SPINNER FLOATING-0=OFF, 1=ON, 10=SPINNER NOT MOUNTED"
        },
        {
          "id": "spinner_gripper_status",
          "label": "PCT SPINNER GRIPPER",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 10,
          "plcTag": "PCT SPINNER GRIPPER-0=NONE, 1=OPENING, 2=CLOSING, 3=OPEN, 4=CLOSE, 5=FAULT, 10=SPINNER NOT MOUNTED"
        },
        {
          "id": "spinner_rotation_status",
          "label": "PCT Spinner Rotation",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 10,
          "plcTag": "PCT Spinner Rotation-0=NO CMD ACTIVE, 1=FULLY UP, 2=FULLY DOWN, 3=MAKE-UP, 4= BREAK-OUT. 10=SPINNER NOT MOUNTED"
        },
        {
          "id": "spinner_breakout_torque",
          "label": "PCT SpinnerActBOutTorque",
          "unit": "daN.m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "PCT SpinnerActBOutTorque-daN*m"
        },
        {
          "id": "spinner_makeup_torque",
          "label": "PCT SpinnerActMakeUpTorque",
          "unit": "daN.m",
          "precision": 1,
          "defaultMin": 0,
          "defaultMax": 20000,
          "plcTag": "PCT SpinnerActMakeUpTorque-daN*m"
        },
        {
          "id": "status",
          "label": "PCT STATUS-0 = OFF, 1 = ON In IDLE, 2 = ON",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 2,
          "plcTag": "PCT STATUS-0 = OFF, 1 = ON in IDLE, 2 = ON"
        }
      ]
    },
    {
      "id": "opcua_demo",
      "label": "OPC UA (device)",
      "fields": [
        {
          "id": "dip",
          "label": "Dip Signal",
          "unit": "",
          "precision": 1,
          "defaultMin": -100,
          "defaultMax": 100,
          "plcTag": "opcua_demo.dip"
        },
        {
          "id": "fast_counter",
          "label": "Fast Counter",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "opcua_demo.fast_counter"
        },
        {
          "id": "random_uint",
          "label": "Random Uint",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 4000000,
          "plcTag": "opcua_demo.random_uint"
        },
        {
          "id": "slow_counter",
          "label": "Slow Counter",
          "unit": "",
          "precision": 0,
          "defaultMin": 0,
          "defaultMax": 1000,
          "plcTag": "opcua_demo.slow_counter"
        },
        {
          "id": "spike",
          "label": "Spike Signal",
          "unit": "",
          "precision": 1,
          "defaultMin": -100,
          "defaultMax": 100,
          "plcTag": "opcua_demo.spike"
        }
      ]
    }
  ],
  "defaultLayout": {
    "stripCount": 3,
    "pensPerStrip": 2,
    "strips": [
      {
        "id": "strip-1",
        "title": "Engine / Hookload",
        "pens": [
          {
            "id": "s1p1",
            "metric": "cat_engine.rpm",
            "min": 0,
            "max": 2000,
            "color": "#38bdf8"
          },
          {
            "id": "s1p2",
            "metric": "drawworks.hook_load",
            "min": 0,
            "max": 500,
            "color": "#fbbf24"
          }
        ]
      },
      {
        "id": "strip-2",
        "title": "Pump",
        "pens": [
          {
            "id": "s2p1",
            "metric": "mudpump.pressure",
            "min": 0,
            "max": 500,
            "color": "#4ade80"
          },
          {
            "id": "s2p2",
            "metric": "mudpump.spm",
            "min": 0,
            "max": 200,
            "color": "#f472b6"
          }
        ]
      },
      {
        "id": "strip-3",
        "title": "Engine Health",
        "pens": [
          {
            "id": "s3p1",
            "metric": "cat_engine.coolant_temp",
            "min": 0,
            "max": 120,
            "color": "#a78bfa"
          },
          {
            "id": "s3p2",
            "metric": "cat_engine.oil_pressure",
            "min": 0,
            "max": 10,
            "color": "#fb7185"
          }
        ]
      }
    ]
  }
};

// Standalone defaults for another project.
// Backend should proxy /api and /ws, same as this Drillbit project.
// If your login token key is different, change TOKEN_KEY below.
const TOKEN_KEY = 'token';
axios.defaults.baseURL = axios.defaults.baseURL || '';
axios.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const getRealtimeWsUrl = () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams({ token, client_id: 'edr' });
    return `${protocol}//${window.location.host}/ws/realtime?${params.toString()}`;
};

/*
 * EdrView — reusable, self-contained strip-chart Electronic Drilling Recorder.
 *
 * Rendering is a hand-rolled SVG strip renderer (no recharts) so we control the
 * strip look exactly: shared vertical index axis (time OR depth), multiple pens
 * per strip each on its OWN horizontal [min,max] scale + color, light gridlines,
 * a thin current-value marker, and a FIXED-HEIGHT bottom "variables" block whose
 * content adaptively compacts so every strip's block is the same height and the
 * blocks line up on a shared baseline regardless of pen count.
 *
 * Data plumbing reuses authenticated /api history/latest plus Drillbit's
 * native /ws/realtime stream. Polling remains as a fallback.
 */

// ---------------------------------------------------------------------------
// Catalog helpers
// ---------------------------------------------------------------------------

const METRIC_OPTIONS = edrCatalog.categories.flatMap(category => (
    category.fields.map(field => ({
        id: `${category.id}.${field.id}`,
        label: field.label,
        unit: field.unit || '',
        precision: field.precision ?? 1,
        defaultMin: field.defaultMin ?? 0,
        defaultMax: field.defaultMax ?? 1,
        plcTag: field.plcTag || '',
        categoryId: category.id,
        categoryLabel: category.label
    }))
));
const METRIC_LOOKUP = new Map(METRIC_OPTIONS.map(o => [o.id, o]));
const ALL_METRIC_IDS = METRIC_OPTIONS.map(o => o.id);
const PLC_EXPORT_CHANNEL_IDS = METRIC_OPTIONS
    .filter(option => option.plcTag && option.categoryId !== 'opcua_demo')
    .map(option => option.id);

const CHANNEL_LABEL_OVERRIDES = {
    'drilling.torque': 'Rotary Torque',
    'drilling.wob': 'WOB',
    'modbus.WOB': 'WOB',
    'modbus.wob': 'WOB',
    'system.rig_air_pressure': 'Rig Air Press.',
    'modbus.RIG_AIR_PRESSURE': 'Rig Air Press.',
    'modbus.rig_air_pressure': 'Rig Air Press.',
    'modbus.TORQUE': 'Rotary Torque',
    'modbus.torque': 'Rotary Torque',
    'engine.rpm': 'Eng RPM',
    'engine.coolant_temp': 'Eng Coolant Temp',
    'engine.oil_pressure': 'Eng Oil Press.',
    'engine.fuel_level': 'Eng Fuel Level',
    'engine.oil_temp': 'Eng Oil Temp',
    'engine.battery_voltage': 'Eng Battery Vol',
    'cat_engine.rpm': 'Eng RPM',
    'cat_engine.coolant_temp': 'Eng Coolant Temp',
    'cat_engine.oil_pressure': 'Eng Oil Press.',
    'cat_engine.fuel_level': 'Eng Fuel Level',
    'cat_engine.oil_temp': 'Eng Oil Temp',
    'cat_engine.battery_voltage': 'Eng Battery Vol'
};

const CHANNEL_UNIT_OVERRIDES = {
    'engine.rpm': '',
    'engine.coolant_temp': 'C',
    'engine.oil_pressure': 'bar',
    'engine.fuel_level': '%',
    'engine.oil_temp': 'C',
    'engine.battery_voltage': 'V',
    'engine.exhaust_temp': 'C',
    'system.rig_air_pressure': 'Psi',
    'modbus.RIG_AIR_PRESSURE': 'Psi',
    'modbus.rig_air_pressure': 'Psi'
};

const CHANNEL_COLOR_OVERRIDES = {
    'drawworks.hook_load': '#38bdf8',
    'drilling.wob': '#fbbf24',
    'modbus.WOB': '#fbbf24',
    'modbus.wob': '#fbbf24',
    'mudpump.pressure': '#4ade80',
    'mudpump.spm': '#22d3ee',
    'mudpump.flow_in': '#4ade80',
    'mudpump.flow_out': '#fbbf24',
    'fluid.trip_tank': '#a78bfa',
    'drilling.torque': '#a78bfa',
    'system.rig_air_pressure': '#f472b6',
    'modbus.RIG_AIR_PRESSURE': '#f472b6',
    'engine.rpm': '#fb7185',
    'engine.oil_pressure': '#38bdf8',
    'engine.oil_temp': '#f97316'
};

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const PEN_COLORS = ['#38bdf8', '#fbbf24', '#4ade80', '#f472b6', '#a78bfa', '#fb7185', '#22d3ee', '#f97316'];
const MAX_PENS = 3;
const MAX_READOUTS = 6;
const DEPTH_INDEX_METRIC = 'drilling.hole_depth';
const DEPTH_BIN_M = 0.5;

// Always-on left-band depth readouts (full mode only).
const HOLE_DEPTH_METRIC = 'drilling.hole_depth';
const BIT_DEPTH_METRIC = 'drilling.bit_depth';

const channelLabel = (id) => CHANNEL_LABEL_OVERRIDES[id] || METRIC_LOOKUP.get(id)?.label || id.replace(/[._]/g, ' ');
const channelUnit = (id) => CHANNEL_UNIT_OVERRIDES[id] || METRIC_LOOKUP.get(id)?.unit || '';
const channelPrecision = (id) => METRIC_LOOKUP.get(id)?.precision ?? 1;
const channelCategory = (id) => METRIC_LOOKUP.get(id)?.categoryLabel || '';
const channelColor = (id, fallback = '#22d3ee') => CHANNEL_COLOR_OVERRIDES[id] || fallback;
const PLC_CONNECTED_METRIC = 'drilling.plc_connected';
const HOOK_LOAD_METRIC = 'drawworks.hook_load';

const numericOrZero = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const normalizeHookLoadValue = (value) => {
    const n = numericOrZero(value);
    return n >= 1000 ? (n / 100) : (n / 10);
};

const normalizeChannelValue = (channelId, value) => {
    const n = numericOrZero(value);
    if (channelId === HOOK_LOAD_METRIC) {
        return normalizeHookLoadValue(n);
    }
    return n;
};

const hasNonZeroSignal = (values, channelIds) => channelIds.some(id => {
    if (id === PLC_CONNECTED_METRIC) return false;
    const n = Number(values?.[id]);
    return Number.isFinite(n) && n !== 0;
});

const isDisconnectedSample = (values, channelIds) => {
    const plcConnectedValue = Number(values?.[PLC_CONNECTED_METRIC]);
    if (plcConnectedValue === 1) return false;
    if (plcConnectedValue === 0) return true;
    return !hasNonZeroSignal(values, channelIds);
};

const shouldReplaceBucketPoint = (current, next) => {
    if (!current) return true;
    if (current.disconnected && !next.disconnected) return true;
    if (!current.disconnected && next.disconnected) return false;
    return Number(next.timestamp || 0) >= Number(current.timestamp || 0);
};

const injectDisconnectedGapPoints = (points, historyChannels, explicitExpectedStepMs = null) => {
    if (!Array.isArray(points) || points.length < 2) return points;

    const deltas = [];
    for (let i = 1; i < points.length; i += 1) {
        const prevTs = Number(points[i - 1]?.timestamp);
        const nextTs = Number(points[i]?.timestamp);
        const delta = nextTs - prevTs;
        if (Number.isFinite(delta) && delta > 0) {
            deltas.push(delta);
        }
    }

    const sortedDeltas = deltas.slice().sort((a, b) => a - b);
    const medianDelta = sortedDeltas.length
        ? sortedDeltas[Math.floor(sortedDeltas.length / 2)]
        : null;
    const expectedStepMs = explicitExpectedStepMs || medianDelta || 1000;
    const gapThreshold = Math.max(expectedStepMs * 1.5, 2000);

    const zeroValues = {};
    historyChannels.forEach(id => { zeroValues[id] = 0; });
    zeroValues[PLC_CONNECTED_METRIC] = 0;

    const withGaps = [points[0]];
    for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const curr = points[i];
        const prevTs = Number(prev?.timestamp);
        const currTs = Number(curr?.timestamp);
        const gapMs = currTs - prevTs;

        if (Number.isFinite(gapMs) && gapMs > gapThreshold) {
            withGaps.push({
                timestamp: prevTs + Math.round(gapMs / 2),
                depth: Number.isFinite(Number(prev?.depth)) ? Number(prev.depth) : 0,
                values: { ...zeroValues },
                disconnected: true
            });
        }

        withGaps.push(curr);
    }

    return withGaps;
};

const fmtValue = (value, precision) => {
    return numericOrZero(value).toFixed(precision);
};

// Trim trailing zeros for compact scale text (0…500 not 0.0…500.0).
const fmtScale = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '--';
    return String(Math.round(n * 100) / 100);
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isSameCalendarDate = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear()
        && da.getMonth() === db.getMonth()
        && da.getDate() === db.getDate();
};
const fmtAxisDateTime = (value, includeSeconds = false) => {
    const d = new Date(value);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
        + `\n${hh}:${mm}${includeSeconds ? `:${ss}` : ''}`;
};
const fmtAxisTime = (value) => new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

// ---------------------------------------------------------------------------
// Time window presets
// ---------------------------------------------------------------------------

const TIME_WINDOWS = [
    { label: '1m', ms: 1 * 60 * 1000, range: '-1m' },
    { label: '5m', ms: 5 * 60 * 1000, range: '-5m' },
    { label: '15m', ms: 15 * 60 * 1000, range: '-15m' },
    { label: '30m', ms: 30 * 60 * 1000, range: '-30m' },
    { label: '1H', ms: 60 * 60 * 1000, range: '-1h' },
    { label: '2H', ms: 2 * 60 * 60 * 1000, range: '-2h' },
    { label: '4H', ms: 4 * 60 * 60 * 1000, range: '-4h' },
    { label: '6H', ms: 6 * 60 * 60 * 1000, range: '-6h' },
    { label: '12H', ms: 12 * 60 * 60 * 1000, range: '-12h' },
    { label: '24H', ms: 24 * 60 * 60 * 1000, range: '-24h' }
];
const DEPTH_SPANS = [
    { label: '25m', m: 25 },
    { label: '50m', m: 50 },
    { label: '100m', m: 100 },
    { label: '250m', m: 250 },
    { label: '500m', m: 500 }
];

// ---------------------------------------------------------------------------
// Config normalization / persistence
// ---------------------------------------------------------------------------

const normalizePen = (pen, fallbackColorIndex) => {
    const src = pen && typeof pen === 'object' ? pen : {};
    const channelId = typeof src.channelId === 'string' && src.channelId ? src.channelId : ALL_METRIC_IDS[0];
    const meta = METRIC_LOOKUP.get(channelId);
    let min = Number.isFinite(Number(src.min)) ? Number(src.min) : (meta?.defaultMin ?? 0);
    let max = Number.isFinite(Number(src.max)) ? Number(src.max) : (meta?.defaultMax ?? 1);
    if (max <= min) max = min + 1;
    return {
        channelId,
        min,
        max,
        color: COLOR_RE.test(src.color || '') ? src.color : PEN_COLORS[fallbackColorIndex % PEN_COLORS.length],
        enabled: src.enabled !== false
    };
};

const normalizeStrips = (strips) => {
    if (!Array.isArray(strips)) return [];
    return strips.map((strip, si) => ({
        title: typeof strip?.title === 'string' && strip.title ? strip.title : `Track ${si + 1}`,
        pens: (Array.isArray(strip?.pens) ? strip.pens : [])
            .slice(0, MAX_PENS)
            .map((pen, pi) => normalizePen(pen, si + pi))
    }));
};

// Keep only known channels, dedupe, cap to MAX_READOUTS.
const normalizeReadouts = (ids, availableChannels = null) => {
    if (!Array.isArray(ids)) return [];
    const allowedIds = Array.isArray(availableChannels)
        ? availableChannels.map(channel => (typeof channel === 'string' ? channel : channel?.id)).filter(Boolean)
        : null;
    const allowedSet = allowedIds?.length ? new Set(allowedIds) : null;
    const seen = new Set();
    const out = [];
    ids.forEach(id => {
        const isKnownMetric = METRIC_LOOKUP.has(id);
        const isAllowedDynamic = allowedSet?.has(id);
        if ((isKnownMetric || isAllowedDynamic) && !seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    });
    return out.slice(0, MAX_READOUTS);
};

const loadPersisted = (storageKey, defaultStrips, defaultReadouts) => {
    const fallback = {
        strips: normalizeStrips(defaultStrips),
        indexMode: 'time',
        readouts: normalizeReadouts(defaultReadouts),
        timeWinIdx: 2,
        depthSpanIdx: 2,
        customRange: null
    };
    if (!storageKey) return fallback;
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        const strips = normalizeStrips(parsed?.strips);
        const timeWinIdx = Number.isInteger(parsed?.timeWinIdx) && parsed.timeWinIdx >= 0 && parsed.timeWinIdx < TIME_WINDOWS.length
            ? parsed.timeWinIdx
            : fallback.timeWinIdx;
        const depthSpanIdx = Number.isInteger(parsed?.depthSpanIdx) && parsed.depthSpanIdx >= 0 && parsed.depthSpanIdx < DEPTH_SPANS.length
            ? parsed.depthSpanIdx
            : fallback.depthSpanIdx;
        const customStart = Number(parsed?.customRange?.start);
        const customStop = Number(parsed?.customRange?.stop);
        const customRange = Number.isFinite(customStart) && Number.isFinite(customStop) && customStop > customStart
            ? { start: customStart, stop: customStop }
            : null;
        // Only adopt a persisted readout list if the key has one saved; otherwise
        // fall back to the prop default (covers first run after this feature ships).
        const readouts = Array.isArray(parsed?.readouts)
            ? normalizeReadouts(parsed.readouts)
            : fallback.readouts;
        return {
            strips: strips.length ? strips : fallback.strips,
            indexMode: parsed?.indexMode === 'depth' ? 'depth' : 'time',
            readouts,
            timeWinIdx,
            depthSpanIdx,
            customRange
        };
    } catch (e) {
        return fallback;
    }
};

const toDatetimeLocalValue = (timestamp) => {
    const value = Number(timestamp);
    if (!Number.isFinite(value)) return '';
    const date = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ---------------------------------------------------------------------------
// Channel select (grouped by category)
// ---------------------------------------------------------------------------

function ChannelSelect({ value, onChange, channels, sx, modbusOnly = false }) {
    if (modbusOnly || (channels?.length && typeof channels[0] === 'object')) {
        const options = Array.isArray(channels) ? channels : [];
        const selectedValue = options.some(option => option.id === value) ? value : '';
        return (
            <Select
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
                size="small"
                MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
                sx={sx}
            >
                <ListSubheader sx={{ fontWeight: 800, lineHeight: '30px', fontSize: '0.72rem', letterSpacing: 0.4 }}>
                    DAQ-10
                </ListSubheader>
                {!options.length && (
                    <MenuItem value="" disabled sx={{ fontSize: '0.82rem' }}>
                        Loading DAQ-10 registers...
                    </MenuItem>
                )}
                {options.map(option => (
                    <MenuItem key={option.id} value={option.id} sx={{ fontSize: '0.82rem' }}>
                        {option.label}{option.unit ? ` (${option.unit})` : ''}
                    </MenuItem>
                ))}
            </Select>
        );
    }
    const allowed = channels && channels.length
        ? new Set(channels)
        : null;
    const groups = edrCatalog.categories
        .map(cat => ({
            cat,
            fields: cat.fields.filter(f => !allowed || allowed.has(`${cat.id}.${f.id}`))
        }))
        .filter(g => g.fields.length);
    return (
        <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            size="small"
            MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
            sx={sx}
        >
            {groups.flatMap(({ cat, fields }) => [
                <ListSubheader key={`h-${cat.id}`} sx={{ fontWeight: 800, lineHeight: '30px', fontSize: '0.72rem', letterSpacing: 0.4 }}>
                    {cat.label.toUpperCase()}
                </ListSubheader>,
                ...fields.map(f => (
                    <MenuItem key={`${cat.id}.${f.id}`} value={`${cat.id}.${f.id}`} sx={{ fontSize: '0.82rem' }}>
                        {f.label}{f.unit ? ` (${f.unit})` : ''}
                    </MenuItem>
                ))
            ])}
        </Select>
    );
}

// ---------------------------------------------------------------------------
// Readouts config (multi-select from the catalog, grouped by category)
// ---------------------------------------------------------------------------

function ReadoutsConfig({ value, onChange, channels, surface, border, text, subText, accent }) {
    const optionObjects = Array.isArray(channels) && channels.length && typeof channels[0] === 'object'
        ? channels
        : null;
    if (optionObjects) {
        const handleChange = (e) => {
            const next = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
            onChange(normalizeReadouts(next, optionObjects));
        };

        return (
            <FormControl size="small">
                <Select
                    multiple
                    displayEmpty
                    value={value}
                    onChange={handleChange}
                    MenuProps={{ PaperProps: { sx: { maxHeight: 380, bgcolor: surface, color: text } } }}
                    IconComponent={() => null}
                    renderValue={() => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: subText }}>
                            <SlidersHorizontal size={15} />
                            <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                Readouts
                            </Box>
                        </Box>
                    )}
                    sx={{
                        color: text,
                        bgcolor: surface,
                        '& .MuiSelect-select': { py: 0.45, pl: 1, pr: '10px !important' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: accent }
                    }}
                >
                    <ListSubheader sx={{ bgcolor: surface, color: subText, fontWeight: 800, fontSize: '0.66rem', lineHeight: '26px', letterSpacing: 0.4 }}>
                        PICK READOUTS ({value.length}/{MAX_READOUTS})
                    </ListSubheader>
                    <ListSubheader sx={{ bgcolor: surface, fontWeight: 800, lineHeight: '28px', fontSize: '0.7rem', letterSpacing: 0.4, color: subText }}>
                        MODBUS CONFIGURATION
                    </ListSubheader>
                    {optionObjects.map(option => {
                        const checked = value.includes(option.id);
                        const atCap = !checked && value.length >= MAX_READOUTS;
                        return (
                            <MenuItem key={option.id} value={option.id} disabled={atCap} sx={{ py: 0.25, fontSize: '0.82rem' }}>
                                <Checkbox size="small" checked={checked} sx={{ p: 0.5, mr: 0.5, color: subText, '&.Mui-checked': { color: accent } }} />
                                <ListItemText
                                    primary={`${option.label}${option.unit ? ` (${option.unit})` : ''}`}
                                    primaryTypographyProps={{ sx: { fontSize: '0.82rem' } }}
                                />
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        );
    }

    const allowed = channels && channels.length ? new Set(channels) : null;
    const groups = edrCatalog.categories
        .map(cat => ({
            cat,
            fields: cat.fields.filter(f => !allowed || allowed.has(`${cat.id}.${f.id}`))
        }))
        .filter(g => g.fields.length);

    const handleChange = (e) => {
        const next = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
        onChange(normalizeReadouts(next));
    };

    return (
        <FormControl size="small">
            <Select
                multiple
                displayEmpty
                value={value}
                onChange={handleChange}
                MenuProps={{ PaperProps: { sx: { maxHeight: 380, bgcolor: surface, color: text } } }}
                IconComponent={() => null}
                renderValue={() => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: subText }}>
                        <SlidersHorizontal size={15} />
                        <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Readouts
                        </Box>
                    </Box>
                )}
                sx={{
                    color: text,
                    bgcolor: surface,
                    '& .MuiSelect-select': { py: 0.45, pl: 1, pr: '10px !important' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: accent }
                }}
            >
                <ListSubheader sx={{ bgcolor: surface, color: subText, fontWeight: 800, fontSize: '0.66rem', lineHeight: '26px', letterSpacing: 0.4 }}>
                    PICK READOUTS ({value.length}/{MAX_READOUTS})
                </ListSubheader>
                {groups.flatMap(({ cat, fields }) => [
                    <ListSubheader key={`h-${cat.id}`} sx={{ bgcolor: surface, fontWeight: 800, lineHeight: '28px', fontSize: '0.7rem', letterSpacing: 0.4, color: subText }}>
                        {cat.label.toUpperCase()}
                    </ListSubheader>,
                    ...fields.map(f => {
                        const id = `${cat.id}.${f.id}`;
                        const checked = value.includes(id);
                        const atCap = !checked && value.length >= MAX_READOUTS;
                        return (
                            <MenuItem key={id} value={id} disabled={atCap} sx={{ py: 0.25, fontSize: '0.82rem' }}>
                                <Checkbox size="small" checked={checked} sx={{ p: 0.5, mr: 0.5, color: subText, '&.Mui-checked': { color: accent } }} />
                                <ListItemText
                                    primary={`${f.label}${f.unit ? ` (${f.unit})` : ''}`}
                                    primaryTypographyProps={{ sx: { fontSize: '0.82rem' } }}
                                />
                            </MenuItem>
                        );
                    })
                ])}
            </Select>
        </FormControl>
    );
}

// ---------------------------------------------------------------------------
// Big numeric readout tile (top row + left depth band share this look)
// ---------------------------------------------------------------------------

function ReadoutTile({ id, value, surface, border, text, subText, accent, valueColor, valueSize = '1.85rem', minWidth = 132, showCategory = true }) {
    return (
        <Paper
            elevation={0}
            sx={{
                flex: '1 1 0',
                minWidth,
                bgcolor: surface,
                border: `1px solid ${border}`,
                borderRadius: 1,
                px: 1.5,
                py: 1.15,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0.1,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, bgcolor: accent, opacity: 0.85 }} />
            <Typography sx={{ color: text, fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {channelLabel(id)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography sx={{ color: valueColor || text, fontSize: valueSize, fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtValue(value, channelPrecision(id))}
                </Typography>
                <Typography sx={{ color: subText, fontSize: '0.72rem', fontWeight: 700 }}>{channelUnit(id)}</Typography>
            </Box>
            {showCategory && (
                <Typography sx={{ color: subText, fontSize: '0.62rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {channelCategory(id)}
                </Typography>
            )}
        </Paper>
    );
}

// ---------------------------------------------------------------------------
// Vertical scroll rail (up/down) — placed on BOTH left and right edges
// ---------------------------------------------------------------------------

function ScrollRail({ onUp, onDown, onHoldUp, onHoldDown, onHoldStop, upTip, downTip, downDisabled, text, border, top, bottom }) {
    const btnSx = {
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 1,
        p: 0.35
    };
    // Press-and-hold: start a repeating scroll on pointer-down, stop on up/leave.
    // The onClick still fires for a quick tap = exactly one step.
    const holdProps = (onHold) => ({
        onPointerDown: (e) => { if (e.button === 0) onHold?.(); },
        onPointerUp: onHoldStop,
        onPointerLeave: onHoldStop,
        onPointerCancel: onHoldStop
    });
    return (
        <Box
            sx={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: `${top}px`,
                mb: `${bottom}px`
            }}
        >
            <MuiTooltip title={upTip} placement="left">
                <span><IconButton size="small" onClick={onUp} {...holdProps(onHoldUp)} sx={btnSx}><ChevronsUp size={16} /></IconButton></span>
            </MuiTooltip>
            <MuiTooltip title={downTip} placement="left">
                <span><IconButton size="small" onClick={onDown} disabled={downDisabled} {...(downDisabled ? {} : holdProps(onHoldDown))} sx={btnSx}><ChevronsDown size={16} /></IconButton></span>
            </MuiTooltip>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// SVG strip chart
// ---------------------------------------------------------------------------

function StripChart({
    strip,
    samples,
    indexMode,
    indexDomain,
    accentColor,
    gridColor,
    axisTextColor,
    surface,
    border,
    subText,
    textColor,
    sharedCursorIndex,
    onCursorIndexChange,
    onCursorLeave,
    includeCursorDate = false,
    isDisconnected = false
}) {
    const ref = useRef(null);
    const [size, setSize] = useState({ w: 240, h: 260 });
    // Hovered cursor position, in fractional [0..1] of chart height (null = no hover).
    // We keep only this lightweight state and recompute the tooltip contents on
    // render — updates are throttled via requestAnimationFrame in the move handler.
    const [cursorFrac, setCursorFrac] = useState(null);
    const rafRef = useRef(0);
    const pendingFracRef = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const ro = new ResizeObserver(entries => {
            const cr = entries[0]?.contentRect;
            if (cr) setSize({ w: Math.max(40, cr.width), h: Math.max(40, cr.height) });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Flush any scheduled rAF on unmount.
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    const enabledPens = strip.pens.filter(p => p.enabled);
    const { w, h } = size;
    const padX = 6;
    const innerW = Math.max(1, w - padX * 2);

    // Vertical gridlines (5 columns).
    const vLines = [0.25, 0.5, 0.75].map(f => padX + f * innerW);
    // Horizontal gridlines map to the shared index domain.
    const [d0, d1] = indexDomain;
    const span = d1 - d0 || 1;
    const yFor = (idx) => ((idx - d0) / span) * h;

    const hTickCount = Math.max(2, Math.min(8, Math.round(h / 48)));
    const hLines = Array.from({ length: hTickCount + 1 }, (_, i) => (i / hTickCount));

    // --- Hover crosshair / tooltip plumbing ---
    // Pointer Y -> fraction of height, scheduled on rAF so mousemove can't thrash.
    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (!rect.height) return;
        const frac = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        pendingFracRef.current = frac;
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            const nextFrac = pendingFracRef.current;
            setCursorFrac(nextFrac);
            if (nextFrac != null) onCursorIndexChange?.(d0 + nextFrac * span);
        });
    };
    const handleLeave = () => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
        pendingFracRef.current = null;
        setCursorFrac(null);
        onCursorLeave?.();
    };

    // Index value under the cursor (timestamp in time mode, depth in depth mode).
    const localCursorIndex = cursorFrac == null ? null : d0 + cursorFrac * span;
    const cursorIndex = sharedCursorIndex ?? localCursorIndex;
    const effectiveCursorFrac = cursorIndex == null ? null : Math.max(0, Math.min(1, (cursorIndex - d0) / span));

    // Nearest sample to the cursor index (linear scan — samples are sorted by
    // timestamp/depth; cheap for the ~window-sized buffers we hold).
    const nearestSample = useMemo(() => {
        if (cursorIndex == null || !samples.length) return null;
        const key = indexMode === 'depth' ? 'depth' : 'timestamp';
        let best = null;
        let bestDist = Infinity;
        for (let i = 0; i < samples.length; i += 1) {
            const iv = samples[i][key];
            if (!Number.isFinite(iv)) continue;
            const dist = Math.abs(iv - cursorIndex);
            if (dist < bestDist) { bestDist = dist; best = samples[i]; }
        }
        return best;
    }, [cursorIndex, samples, indexMode]);

    const fmtIndex = (v) => {
        if (indexMode === 'depth') return `${fmtScale(v)} m`;
        const d = new Date(v);
        if (includeCursorDate) {
            return d.toLocaleString([], {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        }
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    // Tooltip box geometry — clamp inside the strip and flip side near edges.
    const showTooltip = effectiveCursorFrac != null && enabledPens.length > 0;
    const tipRows = showTooltip
        ? enabledPens.map(pen => ({
            color: pen.color,
            name: channelLabel(pen.channelId),
            unit: channelUnit(pen.channelId),
            value: fmtValue(nearestSample?.values?.[pen.channelId], channelPrecision(pen.channelId))
        }))
        : [];

    const buildPath = (pen) => {
        const range = pen.max - pen.min || 1;
        let dStr = '';
        let started = false;
        for (let i = 0; i < samples.length; i += 1) {
            const s = samples[i];
            if (s?.disconnected) {
                started = false;
                continue;
            }
            const raw = numericOrZero(s.values?.[pen.channelId]);
            const idx = indexMode === 'depth' ? s.depth : s.timestamp;
            if (!Number.isFinite(Number(idx))) {
                continue;
            }
            const clamped = Math.max(pen.min, Math.min(pen.max, Number(raw)));
            const x = padX + ((clamped - pen.min) / range) * innerW;
            const y = yFor(idx);
            dStr += `${started ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
            started = true;
        }
        return dStr;
    };

    // Current value position for the thin marker (latest sample with a value).
    const markerFor = (pen) => {
        if (isDisconnected) {
            return null;
        }
        for (let i = samples.length - 1; i >= 0; i -= 1) {
            if (samples[i]?.disconnected) continue;
            const raw = numericOrZero(samples[i].values?.[pen.channelId]);
            if (Number.isFinite(Number(samples[i][indexMode === 'depth' ? 'depth' : 'timestamp']))) {
                const range = pen.max - pen.min || 1;
                const clamped = Math.max(pen.min, Math.min(pen.max, Number(raw)));
                return padX + ((clamped - pen.min) / range) * innerW;
            }
        }
        return null;
    };

    return (
        <Box
            ref={ref}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            sx={{ position: 'relative', width: '100%', height: '100%', zIndex: showTooltip ? 3 : 1 }}
        >
            <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                {/* horizontal index gridlines */}
                {hLines.map((f, i) => (
                    <line key={`h${i}`} x1={0} x2={w} y1={f * h} y2={f * h} stroke={gridColor} strokeWidth={0.5} />
                ))}
                {/* vertical scale gridlines */}
                {vLines.map((x, i) => (
                    <line key={`v${i}`} x1={x} x2={x} y1={0} y2={h} stroke={gridColor} strokeWidth={0.5} />
                ))}
                {/* pens */}
                {enabledPens.map((pen, i) => (
                    <path
                        key={`p${i}`}
                        d={buildPath(pen)}
                        fill="none"
                        stroke={pen.color}
                        strokeWidth={1.6}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
                {/* thin current-value markers */}
                {enabledPens.map((pen, i) => {
                    const mx = markerFor(pen);
                    if (mx == null) return null;
                    return (
                        <line
                            key={`m${i}`}
                            x1={mx}
                            x2={mx}
                            y1={0}
                            y2={h}
                            stroke={pen.color}
                            strokeWidth={0.9}
                            opacity={0.9}
                            vectorEffect="non-scaling-stroke"
                        />
                    );
                })}
                {/* hover crosshair (thin horizontal cursor line at the hovered index) */}
                {effectiveCursorFrac != null && (
                    <line
                        x1={0}
                        x2={w}
                        y1={effectiveCursorFrac * h}
                        y2={effectiveCursorFrac * h}
                        stroke={accentColor}
                        strokeWidth={1}
                        opacity={0.85}
                        pointerEvents="none"
                        vectorEffect="non-scaling-stroke"
                    />
                )}
            </svg>
            {/* hover tooltip — index value + per-pen color/name/value at nearest sample */}
            {showTooltip && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: effectiveCursorFrac > 0.5 ? 4 : 'auto',
                        right: effectiveCursorFrac > 0.5 ? 'auto' : 4,
                        // Use true top/bottom anchoring so the tooltip moves fully
                        // above the cursor in the lower chart area.
                        top: effectiveCursorFrac > 0.68
                            ? 'auto'
                            : `${Math.max(3, Math.min(88, (effectiveCursorFrac * 100) + 2))}%`,
                        bottom: effectiveCursorFrac > 0.68
                            ? `${Math.max(3, Math.min(88, ((1 - effectiveCursorFrac) * 100) + 2))}%`
                            : 'auto',
                        zIndex: 5,
                        pointerEvents: 'none',
                        bgcolor: surface,
                        border: `1px solid ${border}`,
                        borderRadius: 1,
                        boxShadow: 3,
                        px: 0.85,
                        py: 0.6,
                        maxWidth: '92%',
                        minWidth: 0
                    }}
                >
                    <Typography sx={{ color: subText, fontSize: '0.6rem', fontWeight: 800, letterSpacing: 0.3, mb: 0.35, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtIndex(cursorIndex)}
                    </Typography>
                    {tipRows.map((r, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.25 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: r.color, flex: '0 0 auto' }} />
                            <Typography component="span" sx={{ color: textColor, fontSize: '0.62rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                                {r.name}
                            </Typography>
                            <Typography component="span" sx={{ color: r.color, fontSize: '0.66rem', fontWeight: 900, ml: 'auto', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                {r.value}{r.unit ? <Box component="span" sx={{ color: subText, fontSize: '0.85em', fontWeight: 700, ml: 0.25 }}>{r.unit}</Box> : null}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
            {enabledPens.length === 0 && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                    <Typography sx={{ color: axisTextColor, fontSize: '0.7rem', opacity: 0.6 }}>No pens</Typography>
                </Box>
            )}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Fixed-height bottom "variables" block — the critical requirement.
//
// Always exactly BOTTOM_H tall. Content adapts to pen count so 1 pen is
// comfortable and 3 pens still fit the SAME height. Compaction order as the
// per-row height shrinks: (1) smaller font, (2) drop min…max scale, (3) drop
// NAME (keep unit), (4) keep only the color-coded VALUE.
// ---------------------------------------------------------------------------

function StripVariables({ strip, latest, compact, surface, border, subText }) {
    const BOTTOM_H = compact ? 64 : 96;
    const enabledPens = strip.pens.filter(p => p.enabled);
    const n = Math.max(1, enabledPens.length);
    const rowH = BOTTOM_H / Math.max(n, compact ? 2 : 1); // reserve at least 2 slots in compact

    // Compaction thresholds keyed off available per-row height.
    const fontValue = rowH >= 40 ? '1.15rem' : rowH >= 30 ? '0.98rem' : rowH >= 22 ? '0.86rem' : '0.78rem';
    const fontMeta = rowH >= 30 ? '0.62rem' : '0.58rem';
    const showScale = rowH >= 30;     // (2) drop scale first
    const showName = rowH >= 24;      // (3) then name (keep unit)

    return (
        <Box
            sx={{
                flex: `0 0 ${BOTTOM_H}px`,
                height: BOTTOM_H,
                mt: 0.5,
                bgcolor: surface,
                border: `1px solid ${border}`,
                borderRadius: 1,
                px: 0.75,
                py: 0.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-evenly',
                overflow: 'hidden'
            }}
        >
            {enabledPens.length === 0 ? (
                <Typography sx={{ color: subText, fontSize: '0.7rem', textAlign: 'center', alignSelf: 'center' }}>—</Typography>
            ) : enabledPens.map((pen, i) => {
                const unit = channelUnit(pen.channelId);
                const value = latest?.[pen.channelId];
                // Full-detail tooltip so a compacted row (unit-only / value-only) is
                // still identifiable on hover: Name (unit) · min…max · current value.
                const tipTitle = `${channelLabel(pen.channelId)}${unit ? ` (${unit})` : ''} · ${fmtScale(pen.min)}…${fmtScale(pen.max)} · ${fmtValue(value, channelPrecision(pen.channelId))}${unit ? ` ${unit}` : ''}`;
                return (
                    <MuiTooltip key={i} title={tipTitle} placement="top" arrow>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.6,
                            minWidth: 0,
                            lineHeight: 1.05,
                            cursor: 'default'
                        }}
                    >
                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: pen.color, flex: '0 0 auto' }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <Typography
                                component="div"
                                sx={{
                                    color: subText,
                                    fontSize: fontMeta,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {/* compaction (3): drop NAME, keep unit */}
                                {showName
                                    ? `${channelLabel(pen.channelId)}${unit ? ` (${unit})` : ''}`
                                    : (unit || channelLabel(pen.channelId))}
                                {/* compaction (2): drop min…max scale first */}
                                {showScale && (
                                    <Box component="span" sx={{ opacity: 0.7, ml: 0.5 }}>
                                        · {fmtScale(pen.min)}…{fmtScale(pen.max)}
                                    </Box>
                                )}
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                color: pen.color,
                                fontSize: fontValue,
                                fontWeight: 900,
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                                flex: '0 0 auto'
                            }}
                        >
                            {fmtValue(value, channelPrecision(pen.channelId))}
                            {/* compaction (4): when name+unit are dropped from the meta line, keep unit beside the value */}
                            {!showName && unit ? (
                                <Box component="span" sx={{ fontSize: '0.6em', ml: 0.3, color: subText, fontWeight: 700 }}>{unit}</Box>
                            ) : null}
                        </Typography>
                    </Box>
                    </MuiTooltip>
                );
            })}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Depth track — the leftmost EDR column.
//
// Reuses the EXACT same row metrics as a pen strip (header height, chart band,
// fixed bottom-block height) so it is header-aligned and baseline-aligned with
// every other strip. The chart band hosts the shared depth/time axis: the same
// horizontal gridlines the strips draw (same hTickCount formula keyed off the
// measured chart height) plus tick labels sitting ON those gridlines, so a
// viewer reads the index across all strips on the same rows. A thin hole-depth
// trace is drawn in depth mode where the bin data supports it. The fixed bottom
// block holds the live HOLE DEPTH + BIT DEPTH readouts on the shared baseline.
//
// Drag-to-scroll on the chart band mirrors the old standalone axis behaviour.
// ---------------------------------------------------------------------------

function DepthAxisChart({
    indexMode,
    indexDomain,
    axisTicks,
    samples,
    maxDepth,
    gridColor,
    subText,
    accent,
    onPointerDown,
    onPointerMove,
    onPointerUp
}) {
    const ref = useRef(null);
    const [size, setSize] = useState({ w: 60, h: 260 });

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const ro = new ResizeObserver(entries => {
            const cr = entries[0]?.contentRect;
            if (cr) setSize({ w: Math.max(20, cr.width), h: Math.max(40, cr.height) });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { w, h } = size;

    // SAME horizontal gridline math as StripChart so labels land on the exact
    // rows the strips draw their gridlines.
    const hTickCount = Math.max(2, Math.min(8, Math.round(h / 48)));
    const hLines = Array.from({ length: hTickCount + 1 }, (_, i) => (i / hTickCount));

    // Thin hole-depth trace (depth mode only — the index IS depth, so the trace
    // is a monotonic diagonal that visually ties depth to the gridlines).
    const [d0, d1] = indexDomain;
    const span = d1 - d0 || 1;
    const depthTracePath = useMemo(() => {
        if (indexMode !== 'depth' || !samples.length) return '';
        // In depth mode the y-position already encodes depth; draw a guide line
        // from the top of the visible window down to the current max depth so the
        // operator sees how much of the window holds real (drilled) hole.
        const yMax = Math.max(0, Math.min(1, (maxDepth - d0) / span)) * h;
        if (yMax <= 0) return '';
        const x = w * 0.5;
        return `M${x.toFixed(1)},0L${x.toFixed(1)},${yMax.toFixed(1)}`;
    }, [indexMode, samples.length, maxDepth, d0, span, h, w]);

    return (
        <Box
            ref={ref}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            sx={{ position: 'relative', width: '100%', height: '100%', cursor: 'ns-resize', userSelect: 'none', touchAction: 'none' }}
        >
            <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                {/* SAME horizontal gridlines as the strips */}
                {hLines.map((f, i) => (
                    <line key={`h${i}`} x1={0} x2={w} y1={f * h} y2={f * h} stroke={gridColor} strokeWidth={0.5} />
                ))}
                {/* thin hole-depth guide trace (depth mode) */}
                {depthTracePath && (
                    <path
                        d={depthTracePath}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        strokeLinecap="round"
                        opacity={0.85}
                        vectorEffect="non-scaling-stroke"
                    />
                )}
            </svg>
            {/* axis unit caption */}
            <Typography sx={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, color: subText, textTransform: 'uppercase', pointerEvents: 'none' }}>
                {indexMode === 'depth' ? 'm' : 'time'}
            </Typography>
            {/* tick labels pinned to the gridline fractions (axisTicks share the same domain) */}
            {axisTicks.map((t, i) => {
                const rawY = t.frac * h;
                const safeTop = indexMode === 'time' ? 24 : 14;
                const y = Math.max(safeTop, Math.min(h - 10, rawY));
                return (
                    <Box key={i} sx={{ position: 'absolute', left: 0, right: 0, top: `${y}px`, transform: 'translateY(-50%)', px: 0.25, pointerEvents: 'none' }}>
                        <Typography sx={{ fontSize: '0.62rem', color: subText, textAlign: 'center', fontVariantNumeric: 'tabular-nums', whiteSpace: t.hasDate ? 'pre-line' : 'nowrap', lineHeight: t.hasDate ? 1.15 : 1 }}>
                            {t.label}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

function DepthTrack({
    indexMode,
    indexDomain,
    axisTicks,
    samples,
    maxDepth,
    holeDepthVal,
    bitDepthVal,
    headerH,
    bottomH,
    chartBg,
    panelBg,
    border,
    gridColor,
    text,
    subText,
    accent,
    onPointerDown,
    onPointerMove,
    onPointerUp
}) {
    // HOLE / BIT depth as the bottom block, on the SAME baseline + height as the
    // strips' StripVariables block. We mirror StripVariables' geometry (fixed
    // BOTTOM_H, mt: 0.5) exactly rather than hardcoding divergent values.
    const rows = [
        { id: HOLE_DEPTH_METRIC, value: holeDepthVal, color: '#22d3ee' },
        { id: BIT_DEPTH_METRIC, value: bitDepthVal, color: '#fbbf24' }
    ];
    return (
        <Box sx={{ flex: '0 0 198px', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* header — same height/style as a strip header, titled DEPTH */}
            <Box sx={{ height: headerH, display: 'flex', alignItems: 'center', gap: 0.5, mb: '4px' }}>
                <Gauge size={14} color={subText} style={{ flex: '0 0 auto' }} />
                <Typography sx={{ flex: 1, minWidth: 0, color: text, fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Depth
                </Typography>
            </Box>
            {/* chart band — same chartTop..chartBottom band as the strips; hosts the depth axis */}
            <Box sx={{ flex: '1 1 auto', minHeight: 0, bgcolor: chartBg, border: `1px solid ${border}`, borderRadius: 1, overflow: 'hidden' }}>
                <DepthAxisChart
                    indexMode={indexMode}
                    indexDomain={indexDomain}
                    axisTicks={axisTicks}
                    samples={samples}
                    maxDepth={maxDepth}
                    gridColor={gridColor}
                    subText={subText}
                    accent={accent}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                />
            </Box>
            {/* fixed-height bottom block — mirrors StripVariables geometry for an exact baseline match */}
            <Box
                sx={{
                    flex: `0 0 ${bottomH}px`,
                    height: bottomH,
                    mt: 0.5,
                    bgcolor: panelBg,
                    border: `1px solid ${border}`,
                    borderRadius: 1,
                    px: 0.75,
                    py: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-evenly',
                    overflow: 'hidden'
                }}
            >
                {rows.map((r) => {
                    const unit = channelUnit(r.id);
                    return (
                        <Box key={r.id} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.05 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: r.color, flex: '0 0 auto' }} />
                                <Typography sx={{ color: subText, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {channelLabel(r.id)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4, pl: 1.4 }}>
                                <Typography sx={{ color: text, fontSize: '1.35rem', fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                                    {fmtValue(r.value, channelPrecision(r.id))}
                                </Typography>
                                <Typography sx={{ color: subText, fontSize: '0.66rem', fontWeight: 700 }}>{unit}</Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Per-strip config dialog
// ---------------------------------------------------------------------------

function StripConfigDialog({ open, onClose, strip, stripIndex, onSave, channels, surface, border, text, subText }) {
    const [draft, setDraft] = useState(strip);
    useEffect(() => { if (open) setDraft(JSON.parse(JSON.stringify(strip))); }, [open, strip]);

    const updatePen = (pi, patch) => {
        setDraft(prev => ({
            ...prev,
            pens: prev.pens.map((p, i) => (i === pi ? { ...p, ...patch } : p))
        }));
    };
    const onChannel = (pi, channelId) => {
        const meta = METRIC_LOOKUP.get(channelId);
        updatePen(pi, {
            channelId,
            min: meta?.defaultMin ?? 0,
            max: meta?.defaultMax ?? 1
        });
    };
    const addPen = () => {
        setDraft(prev => ({
            ...prev,
            pens: [...prev.pens, normalizePen({ channelId: (channels && channels[0]) || ALL_METRIC_IDS[0] }, prev.pens.length)]
        }));
    };
    const removePen = (pi) => {
        setDraft(prev => ({ ...prev, pens: prev.pens.filter((_, i) => i !== pi) }));
    };

    const dialogBg = '#303030';
    const rowBg = '#3a3a3a';
    const fieldBg = '#383838';
    const strongBorder = '#5f6873';
    const dialogText = '#f8fafc';
    const mutedText = '#cbd5e1';
    const fieldSx = {
        '& .MuiInputLabel-root': { color: mutedText, fontSize: 14, fontWeight: 600 },
        '& .MuiInputLabel-root.Mui-focused': { color: mutedText },
        '& .MuiInputBase-root': { color: dialogText, bgcolor: fieldBg, fontSize: 16 },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: strongBorder },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b949e' },
        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    bgcolor: `${dialogBg} !important`,
                    color: `${dialogText} !important`,
                    border: `1px solid ${strongBorder}`,
                    borderRadius: 1,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.72)',
                    maxWidth: 900
                }
            }}
            PaperProps={{
                sx: {
                    bgcolor: `${dialogBg} !important`,
                    color: `${dialogText} !important`,
                    border: `1px solid ${strongBorder}`,
                    borderRadius: 1,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.72)',
                    maxWidth: 900
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4.5, py: 3, fontWeight: 900, borderBottom: `1px solid ${strongBorder}`, fontSize: 18, color: dialogText, bgcolor: `${dialogBg} !important` }}>
                <Box>Configure “{strip.title}”</Box>
                <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => window.open('/modbus', '_blank')}
                    sx={{ 
                        color: '#38bdf8', 
                        borderColor: '#38bdf8',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' }
                    }}
                >
                    Modbus Configuration
                </Button>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: strongBorder, px: 4.5, py: 2.5, bgcolor: `${dialogBg} !important`, color: dialogText }}>
                <TextField
                    label="Track title"
                    value={draft.title}
                    onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
                    size="medium"
                    fullWidth
                    sx={{ ...fieldSx, mb: 2.5 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                    {draft.pens.map((pen, pi) => (
                        <Paper key={pi} elevation={0} sx={{ p: 1.6, bgcolor: rowBg, border: `1px solid ${strongBorder}`, borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.4 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => updatePen(pi, { enabled: !pen.enabled })}
                                    sx={{ color: pen.enabled ? pen.color : mutedText }}
                                    title={pen.enabled ? 'Pen on' : 'Pen off'}
                                >
                                    <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: pen.enabled ? pen.color : 'transparent', border: `2px solid ${pen.color}` }} />
                                </IconButton>
                                <FormControl size="small" fullWidth>
                                    <ChannelSelect
                                        value={pen.channelId}
                                        onChange={(v) => onChannel(pi, v)}
                                        channels={channels}
                                        modbusOnly
                                        sx={{
                                            color: dialogText,
                                            bgcolor: fieldBg,
                                            fontSize: 16,
                                            fontWeight: 700,
                                            '& .MuiSelect-select': { py: 1.05, px: 1.6 },
                                            '& .MuiSvgIcon-root': { color: dialogText },
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' }
                                        }}
                                    />
                                </FormControl>
                                <IconButton size="small" onClick={() => removePen(pi)} sx={{ color: mutedText, p: 1 }} title="Remove pen">
                                    <Trash2 size={24} />
                                </IconButton>
                            </Box>
                            <Grid container spacing={1.2}>
                                <Grid item xs={4}>
                                    <TextField
                                        label="Min" type="number" size="medium" fullWidth sx={fieldSx}
                                        value={pen.min}
                                        onChange={(e) => updatePen(pi, { min: Number(e.target.value) })}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField
                                        label="Max" type="number" size="medium" fullWidth sx={fieldSx}
                                        value={pen.max}
                                        onChange={(e) => updatePen(pi, { max: Number(e.target.value) })}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField
                                        label="Color" type="color" size="medium" fullWidth
                                        sx={{ ...fieldSx, '& input': { height: 34, p: '4px 8px' } }}
                                        value={COLOR_RE.test(pen.color) ? pen.color : '#38bdf8'}
                                        onChange={(e) => updatePen(pi, { color: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Box>
                <Button
                    startIcon={<Plus size={19} />}
                    onClick={addPen}
                    disabled={draft.pens.length >= MAX_PENS}
                    sx={{
                        mt: 2,
                        px: 2,
                        py: 1,
                        color: draft.pens.length >= MAX_PENS ? '#8b8b8b' : dialogText,
                        borderColor: strongBorder,
                        bgcolor: '#343434',
                        fontSize: 14,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        '&:hover': { borderColor: '#8b949e', bgcolor: '#3a3a3a' },
                        '&.Mui-disabled': { color: '#8b8b8b', borderColor: '#555', bgcolor: '#303030' }
                    }}
                    variant="outlined"
                    size="medium"
                >
                    Add Pen ({draft.pens.length}/{MAX_PENS})
                </Button>
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${strongBorder}`, px: 2.5, py: 2, gap: 1.5, bgcolor: `${dialogBg} !important` }}>
                <Button onClick={onClose} sx={{ color: mutedText, fontSize: 14, px: 2.2 }}>Cancel</Button>
                <Button
                    variant="contained"
                    sx={{ bgcolor: '#17d7ef', color: '#001014', fontSize: 15, px: 3, py: 1.2, borderRadius: 1, fontWeight: 800, '&:hover': { bgcolor: '#22e7ff' } }}
                    onClick={() => { onSave(stripIndex, normalizeStrips([draft])[0]); onClose(); }}
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const EXPORT_RANGES = [
    { key: '15m', label: 'Last 15 Min', ms: 15 * 60 * 1000 },
    { key: '1h', label: 'Last 1 Hour', ms: 60 * 60 * 1000 },
    { key: '6h', label: 'Last 6 Hours', ms: 6 * 60 * 60 * 1000 },
    { key: '12h', label: 'Last 12 Hours', ms: 12 * 60 * 60 * 1000 },
    { key: '24h', label: 'Last 24 Hours', ms: 24 * 60 * 60 * 1000 },
    { key: '3d', label: 'Last 3 Days', ms: 3 * 24 * 60 * 60 * 1000 },
    { key: '7d', label: 'Last 7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
    { key: '30d', label: 'Last 30 Days', ms: 30 * 24 * 60 * 60 * 1000 }
];

function EdrExportDialog({ open, onClose, rows, channels, latestTimestamp }) {
    const [format, setFormat] = useState('xlsx');
    const [selected, setSelected] = useState([]);
    const [rangeKey, setRangeKey] = useState('1h');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    useEffect(() => {
        if (open) setSelected(channels.slice(0, Math.min(5, channels.length)));
    }, [channels, open]);

    const exportRows = useMemo(() => {
        if (!rows.length) return [];
        const end = to ? new Date(to).getTime() : (latestTimestamp || Date.now());
        const pickedRange = EXPORT_RANGES.find(item => item.key === rangeKey);
        const start = from ? new Date(from).getTime() : end - (pickedRange?.ms || 60 * 60 * 1000);
        return rows.filter(row => Number.isFinite(row.timestamp) && row.timestamp >= start && row.timestamp <= end);
    }, [from, latestTimestamp, rangeKey, rows, to]);

    const toggleParam = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };
    const setAll = () => setSelected(channels);
    const clearAll = () => setSelected([]);

    const escapeCell = (value) => {
        if (value == null || Number.isNaN(value)) return '';
        const textValue = String(value);
        return /[",\n]/.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue;
    };

    const tableRows = () => {
        const headers = ['timestamp', 'depth', ...selected];
        return {
            headers,
            rows: exportRows.map(row => headers.map(header => {
                if (header === 'timestamp') return row.timestamp ? new Date(row.timestamp).toISOString() : '';
                if (header === 'depth') return Number.isFinite(row.depth) ? row.depth : '';
                return row.values?.[header];
            }))
        };
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const downloadPng = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1400;
        canvas.height = 820;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText('Electronic Drilling Recorder Export', 40, 58);
        ctx.strokeStyle = '#26313d';
        ctx.lineWidth = 1;
        for (let x = 80; x <= 1320; x += 155) {
            ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, 750); ctx.stroke();
        }
        for (let y = 120; y <= 740; y += 80) {
            ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1320, y); ctx.stroke();
        }
        const drawRows = exportRows.slice(-300);
        selected.slice(0, 6).forEach((id, seriesIndex) => {
            const color = PEN_COLORS[seriesIndex % PEN_COLORS.length];
            const meta = METRIC_LOOKUP.get(id);
            const min = meta?.defaultMin ?? 0;
            const max = meta?.defaultMax ?? 1;
            const range = max - min || 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            let started = false;
            drawRows.forEach((row, index) => {
                const raw = Number(row.values?.[id]);
                if (!Number.isFinite(raw)) return;
                const x = 80 + (index / Math.max(drawRows.length - 1, 1)) * 1240;
                const normalized = Math.max(0, Math.min(1, (raw - min) / range));
                const y = 740 - normalized * 620;
                if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(channelLabel(id), 90 + (seriesIndex % 3) * 390, 790 + Math.floor(seriesIndex / 3) * 24);
        });
        canvas.toBlob(blob => {
            if (blob) downloadBlob(blob, `edr-graph-${Date.now()}.png`);
        }, 'image/png');
    };

    const handleDownload = () => {
        const data = tableRows();
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        if (format === 'png') {
            downloadPng();
            onClose();
            return;
        }
        if (format === 'csv') {
            const csv = [data.headers.join(','), ...data.rows.map(row => row.map(escapeCell).join(','))].join('\n');
            downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `edr-export-${stamp}.csv`);
        } else {
            const html = `<table><thead><tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row => `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
            downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), `edr-export-${stamp}.xls`);
        }
        onClose();
    };

    const exportBg = '#050505';
    const exportPanel = '#0d0d0d';
    const exportField = '#111827';
    const exportBorder = '#2b313a';
    const exportMuted = '#a7b0bd';

    const formatButtonSx = (active, color = '#22c55e') => ({
        flex: 1,
        minHeight: 48,
        borderRadius: 1,
        fontSize: 16,
        fontWeight: 900,
        color: active ? '#00140a' : exportMuted,
        bgcolor: active ? color : 'transparent',
        px: 1.6,
        py: 0.7,
        border: `1px solid ${active ? color : exportBorder}`,
        '&:hover': { bgcolor: active ? color : 'rgba(34,211,238,0.08)', borderColor: active ? color : '#22d3ee' }
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    bgcolor: `${exportBg} !important`,
                    color: '#f8fafc',
                    borderRadius: 1,
                    border: `1px solid ${exportBorder}`,
                    boxShadow: '0 22px 70px rgba(0,0,0,0.82)',
                    maxWidth: 980
                }
            }}
            PaperProps={{ sx: { bgcolor: `${exportBg} !important`, color: '#f8fafc', borderRadius: 1, maxWidth: 980 } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.6, py: 1.6, borderBottom: `1px solid ${exportBorder}`, bgcolor: `${exportPanel} !important` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 18, fontWeight: 900 }}>
                    <Download color="#fbbf24" size={20} /> Export Data
                </Box>
                <IconButton onClick={onClose} sx={{ color: exportMuted, fontSize: 20, p: 0.4 }}>x</IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 2.6, py: 2.2, bgcolor: `${exportBg} !important` }}>
                <Typography sx={{ color: exportMuted, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2.4, mb: 1.2 }}>Export Format</Typography>
                <Box sx={{ display: 'flex', gap: 1.4, mb: 2.6 }}>
                    <Button onClick={() => setFormat('xlsx')} sx={formatButtonSx(format === 'xlsx', '#22c55e')}>Excel (.XLS)</Button>
                    <Button onClick={() => setFormat('csv')} sx={formatButtonSx(format === 'csv', '#22d3ee')}>CSV (.CSV)</Button>
                    <Button onClick={() => setFormat('png')} sx={formatButtonSx(format === 'png', '#fbbf24')}>Graph (.PNG)</Button>
                </Box>

                <Typography sx={{ color: exportMuted, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2.4, mb: 1.2 }}>Select Parameters To Export</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.2 }}>
                    <Button onClick={setAll} sx={{ color: '#e5e7eb', bgcolor: '#161b22', border: `1px solid ${exportBorder}`, fontWeight: 800, fontSize: 11, py: 0.55, px: 1.2 }}>Select All</Button>
                    <Button onClick={clearAll} sx={{ color: '#e5e7eb', bgcolor: '#161b22', border: `1px solid ${exportBorder}`, fontWeight: 800, fontSize: 11, py: 0.55, px: 1.2 }}>Deselect All</Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.55, bgcolor: exportPanel, border: `1px solid ${exportBorder}`, borderRadius: 1, p: 1, mb: 2.6 }}>
                    {channels.map(id => {
                        const active = selected.includes(id);
                        return (
                            <Button key={id} onClick={() => toggleParam(id)} sx={{ justifyContent: 'flex-start', gap: 0.8, minHeight: 36, px: 0.9, py: 0.45, color: active ? '#fbbf24' : exportMuted, border: active ? '1px solid rgba(251,191,36,0.55)' : '1px solid transparent', bgcolor: active ? 'rgba(251,191,36,0.12)' : 'transparent', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                                <Checkbox checked={active} sx={{ p: 0, mr: 0.15, color: '#7b8794', '& .MuiSvgIcon-root': { fontSize: 16 }, '&.Mui-checked': { color: '#fbbf24' } }} />
                                {channelLabel(id)}
                            </Button>
                        );
                    })}
                </Box>

                <Typography sx={{ color: exportMuted, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2.4, mb: 1.2 }}>Quick Select</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.9, mb: 2.6 }}>
                    {EXPORT_RANGES.map(item => (
                        <Button key={item.key} onClick={() => { setRangeKey(item.key); setFrom(''); setTo(''); }} sx={{ px: 1.8, py: 0.8, minWidth: 144, color: rangeKey === item.key && !from && !to ? '#000' : '#e5e7eb', bgcolor: rangeKey === item.key && !from && !to ? '#fbbf24' : 'transparent', border: `1px solid ${exportBorder}`, fontSize: 12, fontWeight: 800, '&:hover': { bgcolor: rangeKey === item.key ? '#fbbf24' : 'rgba(34,211,238,0.08)', borderColor: '#22d3ee' } }}>
                            {item.label}
                        </Button>
                    ))}
                </Box>

                <Typography sx={{ color: exportMuted, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2.4, mb: 1.2 }}>Custom Date Range</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.6, mb: 2.6 }}>
                    <TextField label="From" type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputLabel-root': { color: exportMuted, fontSize: 12 }, '& .MuiInputBase-root': { color: '#f8fafc', bgcolor: exportField, fontSize: 12 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: exportBorder }, '& input': { py: 1.1 }, '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)' } }} />
                    <TextField label="To" type="datetime-local" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputLabel-root': { color: exportMuted, fontSize: 12 }, '& .MuiInputBase-root': { color: '#f8fafc', bgcolor: exportField, fontSize: 12 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: exportBorder }, '& input': { py: 1.1 }, '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)' } }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, bgcolor: exportPanel, border: `1px solid ${exportBorder}`, borderRadius: 1, px: 2, py: 1.5, color: '#d1d5db', fontSize: 12 }}>
                    <Download size={15} color="#9ca3af" />
                    Will export <Box component="span" sx={{ color: '#fbbf24', fontWeight: 900 }}>{EXPORT_RANGES.find(item => item.key === rangeKey)?.label.toLowerCase() || 'selected range'}</Box>
                    of data for <Box component="span" sx={{ color: '#ffffff', fontWeight: 900 }}>{selected.length} selected parameters</Box>.
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2.6, py: 1.8, gap: 1.2, bgcolor: `${exportBg} !important`, borderTop: `1px solid ${exportBorder}` }}>
                <Button onClick={onClose} sx={{ color: '#cbd5e1', fontSize: 12, fontWeight: 800 }}>Cancel</Button>
                <Button onClick={handleDownload} disabled={!selected.length} sx={{ bgcolor: '#22c55e', color: '#00140a', px: 3, py: 0.9, fontSize: 13, fontWeight: 900, '&:hover': { bgcolor: '#2ee66b' }, '&.Mui-disabled': { bgcolor: '#475569', color: '#94a3b8' } }}>
                    Download {format === 'xlsx' ? '.XLS' : format === 'csv' ? '.CSV' : '.PNG'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// EdrView main
// ---------------------------------------------------------------------------

export function EdrView({
    mode = 'full',
    storageKey,
    defaultStrips = [],
    rightReadouts = [],
    channels = null,
    showToolbar = true,
    hmiStyle = false
}) {
    const theme = useTheme();
    const isCompact = mode === 'compact';
    const hmiMode = hmiStyle && !isCompact;

    // HMI tokens force the full EDR page into the black strip-chart style used
    // in the Drillbit reference screen, regardless of the app-level MUI theme.
    const isDark = hmiMode || theme.palette.mode === 'dark';
    const panelBg = hmiMode ? '#080808' : theme.palette.background.paper;
    const chartBg = hmiMode ? '#000000' : (isDark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.04)');
    const border = hmiMode ? '#242a33' : (isDark ? 'rgba(148,163,184,0.28)' : 'rgba(15,23,42,0.18)');
    const gridColor = hmiMode ? 'rgba(91,103,121,0.28)' : (isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.12)');
    const text = hmiMode ? '#ffffff' : theme.palette.text.primary;
    const subText = hmiMode ? '#a7b0bd' : (theme.palette.text.secondary || (isDark ? '#94a3b8' : '#475569'));
    const accent = hmiMode ? '#22d3ee' : theme.palette.primary.main;

    const initial = useMemo(() => loadPersisted(storageKey, defaultStrips, rightReadouts), [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const [strips, setStrips] = useState(initial.strips);
    const [indexMode, setIndexMode] = useState(hmiMode ? 'time' : initial.indexMode);
    // Configurable TOP readouts (full mode). Defaults to the rightReadouts prop.
    const [readouts, setReadouts] = useState(initial.readouts);

    const [timeWinIdx, setTimeWinIdx] = useState(isCompact ? 0 : initial.timeWinIdx);
    const [depthSpanIdx, setDepthSpanIdx] = useState(initial.depthSpanIdx);
    const [customStart, setCustomStart] = useState(initial.customRange ? toDatetimeLocalValue(initial.customRange.start) : '');
    const [customEnd, setCustomEnd] = useState(initial.customRange ? toDatetimeLocalValue(initial.customRange.stop) : '');
    const [customRange, setCustomRange] = useState(initial.customRange);
    const [customRangeOpen, setCustomRangeOpen] = useState(false);
    const [scrollOffset, setScrollOffset] = useState(0); // ms back in time, or m up in depth
    const [configStrip, setConfigStrip] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [hoverIndex, setHoverIndex] = useState(null);

    const [data, setData] = useState([]); // [{ timestamp, depth, values:{channelId:value} }]
    const [daqChannels, setDaqChannels] = useState([]);
    const dragRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        getModbusDevices()
            .then(devices => {
                if (cancelled) return;
                const next = [];
                (devices || []).forEach(slave => {
                    (slave.registers || []).forEach(reg => {
                        const map = FIELD_MAP[reg.name];
                        let meas, field;
                        if (map) {
                            meas = map.meas;
                            field = map.field;
                        } else {
                            meas = 'modbus';
                            field = reg.name;
                        }
                        const id = `${meas}.${field}`;
                        // Avoid duplicates if multiple slaves map to same id
                        if (!next.find(n => n.id === id)) {
                            next.push({
                                id: id,
                                label: CHANNEL_LABEL_OVERRIDES[id] || reg.name,
                                unit: '',
                                defaultMin: 0,
                                defaultMax: 1000
                            });
                        }
                    });
                });
                setDaqChannels(next);
            })
            .catch(err => {
                console.error('EdrView: failed to load DAQ-10 modbus registers', err);
                setDaqChannels([]);
            });
        return () => { cancelled = true; };
    }, []);

    const daqChannelIds = useMemo(() => daqChannels.map(option => option.id), [daqChannels]);
    const configureChannels = daqChannels.length ? daqChannels : channels;
    const exportChannels = daqChannelIds;

    // Persist strip config + index mode + readout selection (same storageKey).
    useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                strips,
                indexMode,
                readouts,
                timeWinIdx,
                depthSpanIdx,
                customRange
            }));
        } catch (e) { /* best effort */ }
    }, [storageKey, strips, indexMode, readouts, timeWinIdx, depthSpanIdx, customRange]);

    // Set of channels we need to fetch (all pens + readouts + depth band).
    const neededChannels = useMemo(() => {
        const set = new Set([HOLE_DEPTH_METRIC, BIT_DEPTH_METRIC]);
        strips.forEach(s => s.pens.forEach(p => set.add(p.channelId)));
        if (!isCompact) readouts.forEach(id => set.add(id));
        return Array.from(set);
    }, [strips, readouts, isCompact]);
    const historyChannels = useMemo(() => (
        Array.from(new Set([...neededChannels, ...exportChannels, PLC_CONNECTED_METRIC]))
    ), [neededChannels, exportChannels]);

    const customRangeMs = customRange ? Math.max(60 * 1000, customRange.stop - customRange.start) : null;
    const timeWindowMs = customRangeMs ?? TIME_WINDOWS[timeWinIdx]?.ms ?? TIME_WINDOWS[0].ms;
    const timeRange = TIME_WINDOWS[timeWinIdx]?.range ?? '-15m';
    const customRangeReady = customStart && customEnd && new Date(customEnd).getTime() > new Date(customStart).getTime();
    const historyQueryKey = useMemo(() => JSON.stringify({
        mode: indexMode,
        timeRange,
        depthSpanIdx,
        customRange,
        channels: historyChannels
    }), [customRange, depthSpanIdx, historyChannels, indexMode, timeRange]);

    const makeZeroPoint = useCallback((timestamp) => {
        const values = {};
        historyChannels.forEach(id => { values[id] = 0; });
        // Mark synthetic zero points as PLC-disconnected so they don't draw lines
        values[PLC_CONNECTED_METRIC] = 0;
        return { timestamp, depth: 0, values, disconnected: true };
    }, [historyChannels]);

    const makeZeroSeries = useCallback(() => {
        const end = customRange ? customRange.stop : Date.now();
        const start = customRange ? customRange.start : end - timeWindowMs;
        // A few anchors are enough for perfectly continuous horizontal zero lines.
        const mid = start + ((end - start) / 2);
        return [start, mid, end]
            .filter(ts => Number.isFinite(ts))
            .map(ts => makeZeroPoint(ts));
    }, [customRange, makeZeroPoint, timeWindowMs]);

    const normalizeHistoryRow = useCallback((row) => {
        const values = {};
        historyChannels.forEach(id => { values[id] = normalizeChannelValue(id, row?.[id]); });
        const rawTime = row?.timestamp ?? row?.time ?? row?._time;
        const timestamp = Number.isFinite(Number(rawTime)) ? Number(rawTime) : new Date(rawTime).getTime();
        const rawDepth = row?.[DEPTH_INDEX_METRIC] ?? row?.['drilling.bit_depth'] ?? row?.Depth ?? row?.BitDepth;
        return {
            timestamp,
            depth: numericOrZero(rawDepth),
            values,
            disconnected: isDisconnectedSample(values, historyChannels)
        };
    }, [historyChannels]);

    const mergePoints = useCallback((existing, incoming) => {
        const bySecond = new Map();
        [...existing, ...incoming].forEach(p => {
            if (!Number.isFinite(p?.timestamp)) return;
            const values = {};
            historyChannels.forEach(id => { values[id] = normalizeChannelValue(id, p.values?.[id]); });
            const normalized = {
                timestamp: p.timestamp,
                depth: numericOrZero(p.depth),
                values,
                disconnected: isDisconnectedSample(values, historyChannels)
            };
            const key = Math.floor(p.timestamp / 1000);
            if (shouldReplaceBucketPoint(bySecond.get(key), normalized)) {
                bySecond.set(key, normalized);
            }
        });
        const sortedPoints = Array.from(bySecond.values()).sort((a, b) => a.timestamp - b.timestamp);
        const pointsWithGaps = injectDisconnectedGapPoints(sortedPoints, historyChannels);
        if (customRange) {
            return pointsWithGaps.filter(p => p.timestamp >= customRange.start && p.timestamp <= customRange.stop);
        }
        const cutoff = Date.now() - (TIME_WINDOWS[TIME_WINDOWS.length - 1].ms * 1.5);
        return pointsWithGaps.filter(p => p.timestamp >= cutoff);
    }, [customRange, historyChannels]);

    // ---- History seed (time mode) ----
    const historyReq = useRef(0);
    const historyAbortRef = useRef(null);
    const historyCacheRef = useRef(new Map());
    const historyReadyRef = useRef(false);
    const pendingLatestRef = useRef(null);
    const fetchHistory = useCallback(async () => {
        const reqId = ++historyReq.current;
        if (historyAbortRef.current) historyAbortRef.current.abort();
        const controller = new AbortController();
        historyAbortRef.current = controller;
        const cached = historyCacheRef.current.get(historyQueryKey);

        // If we have a fresh cache hit (< 5s old), use it directly and skip the fetch.
        if (cached && (Date.now() - cached.ts) < 5000) {
            setData(prev => mergePoints(prev, cached.rows));
            historyReadyRef.current = true;
            return;
        }

        // If we have a stale cache hit (< 60s old), show it instantly while
        // we fetch fresh data in the background (stale-while-revalidate).
        if (cached && (Date.now() - cached.ts) < 60000) {
            setData(prev => mergePoints(prev, cached.rows));
            historyReadyRef.current = true;
            // Don't return — fall through to fetch fresh data below.
        } else {
            historyReadyRef.current = false;
        }

        try {
            let res;
            if (customRange) {
                const params = new URLSearchParams();
                params.set('start', new Date(customRange.start).toISOString());
                params.set('stop', new Date(customRange.stop).toISOString());
                res = await axios.get(`/api/rig/history-range?${params.toString()}`, { signal: controller.signal });
            } else {
                const params = new URLSearchParams();
                params.set('range', timeRange);
                params.set('metrics', historyChannels.join(','));
                res = await axios.get(`/api/rig/history?${params.toString()}`, { signal: controller.signal });
            }
            if (reqId !== historyReq.current) return;
            const rows = Array.isArray(res.data) ? res.data : [];
            const next = rows.map(normalizeHistoryRow).filter(r => Number.isFinite(r.timestamp));
            const resolved = mergePoints([], [...makeZeroSeries(), ...next]);
            historyCacheRef.current.set(historyQueryKey, { ts: Date.now(), rows: resolved });
            setData(prev => mergePoints(prev, resolved));
            historyReadyRef.current = true;
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || axios.isCancel?.(err)) return;
            if (reqId !== historyReq.current) return;
            console.error('EdrView: failed to load history', err);
            if (!cached) {
                setData(prev => (prev.length ? prev : mergePoints([], makeZeroSeries())));
            }
            historyReadyRef.current = true;
        }
    }, [customRange, historyChannels, historyQueryKey, makeZeroSeries, mergePoints, normalizeHistoryRow, timeRange]);

    // ---- Live point ingestion (shared socket) ----
    const ingest = useCallback((payload) => {
        if (!historyReadyRef.current) {
            pendingLatestRef.current = payload;
            return;
        }
        const tsRaw = payload?._meta?.ts ?? payload?._broadcast_time ?? payload?.time ?? payload?.timestamp;
        const parsedTs = Number.isFinite(Number(tsRaw)) ? Number(tsRaw) : new Date(tsRaw).getTime();
        const ts = Number.isFinite(parsedTs) ? parsedTs : Date.now();
        const values = {};
        Object.keys(payload || {}).forEach(measurement => {
            const block = payload[measurement];
            if (block && typeof block === 'object') {
                Object.keys(block).forEach(field => {
                    const id = `${measurement}.${field}`;
                    values[id] = normalizeChannelValue(id, block[field]);
                });
            } else if (!measurement.startsWith('_')) {
                values[measurement] = normalizeChannelValue(measurement, block);
            }
        });
        historyChannels.forEach(id => {
            values[id] = normalizeChannelValue(id, values[id]);
        });
        const depth = numericOrZero(values[DEPTH_INDEX_METRIC] ?? values['drilling.bit_depth'] ?? values.Depth ?? values.BitDepth);
        setData(prev => {
            const point = {
                timestamp: ts,
                depth,
                values,
                disconnected: isDisconnectedSample(values, historyChannels)
            };

            const merged = [...prev, point];
            const bySecond = new Map();
            merged.forEach(p => {
                const key = Math.floor((p.timestamp || 0) / 1000);
                if (shouldReplaceBucketPoint(bySecond.get(key), p)) {
                    bySecond.set(key, p);
                }
            });
            const sorted = Array.from(bySecond.values()).sort((a, b) => a.timestamp - b.timestamp);
            if (customRange) return sorted;
            // Cap buffer to the largest time window + headroom for scrolling.
            const cutoff = ts - (TIME_WINDOWS[TIME_WINDOWS.length - 1].ms * 1.5);
            return sorted.filter(p => (p.timestamp || 0) >= cutoff);
        });
    }, [customRange, historyChannels]);

    useEffect(() => {
        const cached = historyCacheRef.current.get(historyQueryKey);
        if (cached?.rows?.length) {
            setData(prev => mergePoints(prev, cached.rows));
            historyReadyRef.current = true;
            return;
        }
        setData(prev => (prev.length ? prev : []));
    }, [historyQueryKey]);

    useEffect(() => {
        if (!historyReadyRef.current || !pendingLatestRef.current) return;
        const queued = pendingLatestRef.current;
        pendingLatestRef.current = null;
        const frame = requestAnimationFrame(() => ingest(queued));
        return () => cancelAnimationFrame(frame);
    }, [data, historyQueryKey, ingest]);

    useEffect(() => {
        fetchHistory();
        axios.get('/api/rig/latest')
            .then(({ data: latest }) => {
                if (latest && Object.keys(latest).length) ingest(latest);
            })
            .catch(() => { /* non-fatal */ });

        let ws = null;
        let pingTimer = null;
        let reconnectTimer = null;
        let disposed = false;

        const closeSocket = () => {
            if (pingTimer) clearInterval(pingTimer);
            pingTimer = null;
            if (ws) {
                ws.onclose = null;
                ws.onerror = null;
                ws.onmessage = null;
                ws.close();
            }
            ws = null;
        };

        const connectRealtime = () => {
            const url = getRealtimeWsUrl();
            if (!url || disposed) return;
            closeSocket();
            ws = new WebSocket(url);

            ws.onopen = () => {
                ws?.send(JSON.stringify({ type: 'subscribe', channels: historyChannels }));
                pingTimer = setInterval(() => {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 25000);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message?.type && message.type !== 'realtime_data') return;
                    ingest(message);
                } catch {
                    // Ignore malformed keepalive/control frames.
                }
            };

            ws.onerror = () => {
                ws?.close();
            };

            ws.onclose = () => {
                closeSocket();
                if (!disposed) reconnectTimer = setTimeout(connectRealtime, 3000);
            };
        };

        connectRealtime();

        return () => {
            disposed = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            closeSocket();
            if (historyAbortRef.current) historyAbortRef.current.abort();
        };
    }, [fetchHistory, historyChannels, ingest]);

    useEffect(() => {
        const timer = setInterval(fetchHistory, 3000);
        return () => clearInterval(timer);
    }, [fetchHistory]);

    useEffect(() => {
        const pollLatest = () => {
            axios.get('/api/rig/latest')
                .then(({ data: latest }) => {
                    if (latest && Object.keys(latest).length) ingest(latest);
                })
                .catch(() => { /* non-fatal; history refresh/socket may still provide data */ });
        };
        pollLatest();
        const timer = setInterval(pollLatest, 1000);
        return () => clearInterval(timer);
    }, [ingest]);

    // Reset scroll when switching index modes.
    useEffect(() => { setScrollOffset(0); }, [indexMode, timeWinIdx, depthSpanIdx, customRange]);
    useEffect(() => { setHoverIndex(null); }, [indexMode, timeWinIdx, depthSpanIdx, customRange]);

    // ---- Compute index domain + samples for the SVG ----
    const sorted = data; // already time-sorted

    const maxDepth = useMemo(() => sorted.reduce((m, p) => (
        Number.isFinite(p.depth) ? Math.max(m, p.depth) : m
    ), 0), [sorted]);

    const { indexDomain, samples } = useMemo(() => {
        if (indexMode === 'depth') {
            // Bin samples into depth buckets; keep last sample per bin.
            const bins = new Map();
            sorted.forEach(p => {
                if (!Number.isFinite(p.depth)) return;
                const key = Math.round(p.depth / DEPTH_BIN_M);
                bins.set(key, { depth: key * DEPTH_BIN_M, timestamp: p.timestamp, values: p.values, disconnected: !!p.disconnected });
            });
            const binned = Array.from(bins.values()).sort((a, b) => a.depth - b.depth);
            const span = DEPTH_SPANS[depthSpanIdx]?.m ?? 100;
            // Bottom of window = deepest minus scroll; depth increases downward.
            const bottom = Math.max(span, maxDepth - scrollOffset);
            const top = bottom - span;
            return {
                indexDomain: [top, bottom],
                samples: binned.filter(p => p.depth >= top && p.depth <= bottom)
            };
        }
        // Time mode: newest at the BOTTOM.
        const now = customRange ? customRange.stop : (sorted.length ? sorted[sorted.length - 1].timestamp : Date.now());
        const bottom = now - scrollOffset;
        const top = bottom - timeWindowMs;
        return {
            indexDomain: [top, bottom],
            samples: sorted.filter(p => p.timestamp >= top && p.timestamp <= bottom)
        };
    }, [customRange, indexMode, sorted, depthSpanIdx, maxDepth, scrollOffset, timeWindowMs]);

    const latestConnectedSample = useMemo(() => {
        for (let i = samples.length - 1; i >= 0; i -= 1) {
            if (!samples[i]?.disconnected) return samples[i];
        }
        return null;
    }, [samples]);

    const latestValues = useMemo(() => (latestConnectedSample?.values || {}), [latestConnectedSample]);

    // ---- Index axis ticks ----
    const axisTicks = useMemo(() => {
        const [a, b] = indexDomain;
        const count = 6;
        const isScrolledHistory = indexMode === 'time' && scrollOffset > 1000;
        const crossesDate = indexMode === 'time' && !isSameCalendarDate(a, b);
        const longRange = indexMode === 'time' && Math.abs(b - a) >= 24 * 60 * 60 * 1000;
        const showDate = indexMode === 'time' && (Boolean(customRange) || isScrolledHistory || crossesDate || longRange);
        return Array.from({ length: count + 1 }, (_, i) => {
            const frac = i / count;
            const v = a + frac * (b - a);
            const label = indexMode === 'depth'
                ? `${Math.round(v)}`
                : showDate
                    ? fmtAxisDateTime(v, !longRange && !crossesDate)
                    : fmtAxisTime(v);
            return { frac, label, hasDate: showDate };
        });
    }, [customRange, indexDomain, indexMode, scrollOffset]);

    // ---- Scroll handlers ----
    // One "page" of the visible window; a single rail click moves a half-window.
    const windowLen = indexMode === 'depth'
        ? (DEPTH_SPANS[depthSpanIdx]?.m ?? 100)
        : timeWindowMs;
    const scrollStep = windowLen * 0.5;            // single rail click = half window
    // Smaller increments for continuous (wheel / press-and-hold) scrolling so the
    // motion is smooth rather than jumpy.
    const wheelStep = windowLen * 0.12;            // per wheel notch
    const holdStep = windowLen * 0.06;             // per rAF tick while a button is held

    // Clamp helper: offset can never go below 0 — that is the live edge, so we
    // never scroll into the future. (Scrolling back is bounded by the buffer.)
    const clampOffset = useCallback((next) => Math.max(0, next), []);

    const scrollByAmount = useCallback((delta) => {
        // delta > 0 = back into history (older/shallower); < 0 = toward live.
        setScrollOffset(o => clampOffset(o + delta));
    }, [clampOffset]);

    const scrollBack = useCallback(() => scrollByAmount(scrollStep), [scrollByAmount, scrollStep]);   // older / shallower
    const scrollFwd = useCallback(() => scrollByAmount(-scrollStep), [scrollByAmount, scrollStep]);    // newer / deeper

    // --- Mouse-wheel continuous scroll (non-passive so we can preventDefault) ---
    const stripAreaRef = useRef(null);
    const wheelStepRef = useRef(wheelStep);
    wheelStepRef.current = wheelStep;
    useEffect(() => {
        const el = stripAreaRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            // Block the page from scrolling while the pointer is over the strips.
            e.preventDefault();
            // wheel up (deltaY < 0) => back into history; wheel down => toward live.
            const dir = e.deltaY < 0 ? 1 : -1;
            setScrollOffset(o => clampOffset(o + dir * wheelStepRef.current));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [clampOffset]);

    // --- Press-and-hold continuous scroll on the rail buttons ---
    // While held, repeat a small step each animation frame; a plain click still
    // performs exactly one half-window step (handled by the rail's onClick).
    const holdRafRef = useRef(0);
    const heldMovedRef = useRef(false); // did the hold actually scroll continuously?
    const holdStepRef = useRef(holdStep);
    holdStepRef.current = holdStep;
    const startHold = useCallback((dir) => {
        if (holdRafRef.current) return;
        heldMovedRef.current = false;
        let frames = 0;
        const tick = () => {
            frames += 1;
            // brief grace period so a quick click is handled solely by onClick
            if (frames > 12) {
                heldMovedRef.current = true;
                setScrollOffset(o => clampOffset(o + dir * holdStepRef.current));
            }
            holdRafRef.current = requestAnimationFrame(tick);
        };
        holdRafRef.current = requestAnimationFrame(tick);
    }, [clampOffset]);
    const stopHold = useCallback(() => {
        if (holdRafRef.current) { cancelAnimationFrame(holdRafRef.current); holdRafRef.current = 0; }
    }, []);
    useEffect(() => () => { if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current); }, []);

    // Rail click = one step, BUT swallow the click that ends a press-and-hold so
    // releasing after a continuous scroll doesn't tack on an extra half-window jump.
    const clickBack = useCallback(() => {
        if (heldMovedRef.current) { heldMovedRef.current = false; return; }
        scrollBack();
    }, [scrollBack]);
    const clickFwd = useCallback(() => {
        if (heldMovedRef.current) { heldMovedRef.current = false; return; }
        scrollFwd();
    }, [scrollFwd]);

    // Drag on the axis to scroll.
    const onAxisPointerDown = (e) => {
        dragRef.current = { y: e.clientY, offset: scrollOffset };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onAxisPointerMove = (e) => {
        if (!dragRef.current) return;
        const dy = e.clientY - dragRef.current.y;
        const el = e.currentTarget;
        const pxH = el.clientHeight || 1;
        const [a, b] = indexDomain;
        const perPx = (b - a) / pxH;
        // dragging DOWN reveals older data (increase offset)
        const next = dragRef.current.offset + dy * perPx;
        setScrollOffset(Math.max(0, next));
    };
    const onAxisPointerUp = () => { dragRef.current = null; };

    const updateStrip = useCallback((index, nextStrip) => {
        setStrips(prev => prev.map((s, i) => (i === index ? nextStrip : s)));
    }, []);

    const liveAtBottom = scrollOffset <= (indexMode === 'depth' ? 0.01 : 1000);
    const visibleTimeRangeLabel = indexMode === 'time'
        ? `${fmtAxisDateTime(indexDomain[0]).replace('\n', ' ')} - ${fmtAxisDateTime(indexDomain[1]).replace('\n', ' ')}`
        : '';
    const jumpToLive = useCallback(() => setScrollOffset(0), []);

    // ---------------- Render ----------------

    const axisWidth = isCompact ? 44 : 56;
    const bottomH = isCompact ? 64 : 96;          // fixed variables-block height
    const headerH = isCompact ? 22 : 26;          // per-strip header row height
    // Top/bottom offsets so the index axis, scroll rails and left depth band line
    // up with the chart area: top offset = strip header height, bottom = variables block.
    const railTop = headerH + 4;
    const railBottom = bottomH + 4;
    const showLeftDepth = !isCompact;
    const showTopReadouts = !isCompact && readouts.length > 0;

    const holeDepthVal = latestValues?.[HOLE_DEPTH_METRIC];
    const bitDepthVal = latestValues?.[BIT_DEPTH_METRIC];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, color: text }}>
            {/* Toolbar */}
            {showToolbar && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.4 }}>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={indexMode}
                    onChange={(_, v) => v && setIndexMode(v)}
                    sx={{
                        '& .MuiToggleButton-root': {
                            color: hmiMode ? '#dbeafe' : subText,
                            borderColor: border,
                            px: hmiMode ? 1.7 : 1.25,
                            py: hmiMode ? 0.75 : 0.4,
                            textTransform: 'none',
                            fontWeight: 900,
                            fontSize: hmiMode ? 14 : undefined,
                            bgcolor: hmiMode ? '#050505' : 'transparent'
                        },
                        '& .Mui-selected': {
                            color: `${hmiMode ? '#001014' : accent} !important`,
                            bgcolor: `${hmiMode ? accent : `${accent}22`} !important`
                        }
                    }}
                >
                    <ToggleButton value="time"><Clock size={15} style={{ marginRight: 6 }} /> Time</ToggleButton>
                    <ToggleButton value="depth"><Ruler size={15} style={{ marginRight: 6 }} /> Depth</ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {(indexMode === 'time' ? TIME_WINDOWS : DEPTH_SPANS).map((opt, i) => {
                        const active = indexMode === 'time' ? (!customRange && i === timeWinIdx) : i === depthSpanIdx;
                        return (
                            <Button
                                key={opt.label}
                                size="small"
                                onClick={() => {
                                    if (indexMode === 'time') {
                                        setCustomRange(null);
                                        setTimeWinIdx(i);
                                    } else {
                                        setDepthSpanIdx(i);
                                    }
                                }}
                                sx={{
                                    minWidth: 36, px: 0.75, textTransform: 'none', fontWeight: 800,
                                    fontSize: hmiMode ? 14 : undefined,
                                    minHeight: hmiMode ? 34 : undefined,
                                    color: active ? (hmiMode ? '#001014' : theme.palette.getContrastText(accent)) : (hmiMode ? '#dbeafe' : subText),
                                    bgcolor: active ? accent : 'transparent',
                                    border: `1px solid ${border}`,
                                    '&:hover': { bgcolor: active ? accent : `${accent}18` }
                                }}
                            >
                                {opt.label}
                            </Button>
                        );
                    })}
                </Box>

                {indexMode === 'time' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, ml: 0.5 }}>
                        <Button
                            size="small"
                            onClick={() => setCustomRangeOpen(true)}
                            sx={{
                                minHeight: hmiMode ? 34 : 32,
                                px: 1.2,
                                textTransform: 'uppercase',
                                fontWeight: 900,
                                fontSize: hmiMode ? 12 : undefined,
                                color: customRange ? '#001014' : (hmiMode ? '#dbeafe' : subText),
                                bgcolor: customRange ? accent : 'transparent',
                                border: `1px solid ${customRange ? accent : border}`,
                                '&:hover': { bgcolor: customRange ? accent : `${accent}18` },
                                '&.Mui-disabled': { color: '#64748b', borderColor: border }
                            }}
                        >
                            {customRange ? `${fmtAxisDateTime(customRange.start).replace('\n', ' - ')} to ${fmtAxisDateTime(customRange.stop).replace('\n', ' - ')}` : 'Custom'}
                        </Button>
                    </Box>
                )}

                <Box sx={{ flex: 1 }} />

                <Button
                    size="small"
                    onClick={() => setExportOpen(true)}
                    startIcon={<Download size={18} />}
                    sx={{
                        textTransform: 'uppercase',
                        fontWeight: 900,
                        fontSize: hmiMode ? 14 : undefined,
                        py: hmiMode ? 0.8 : 0.2,
                        px: hmiMode ? 1.5 : 1,
                        color: hmiMode ? '#dbeafe' : subText,
                        border: `1px solid ${border}`,
                        bgcolor: hmiMode ? '#050505' : 'transparent',
                        '&:hover': { color: accent, borderColor: accent, bgcolor: `${accent}12` }
                    }}
                >
                    Export
                </Button>

                {/* LIVE indicator + jump-to-live affordance. Scrolling lives on the side rails. */}
                {liveAtBottom ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Radio size={13} color="#22c55e" />
                        <Typography sx={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 900, letterSpacing: 0.5 }}>LIVE</Typography>
                    </Box>
                ) : (
                    <MuiTooltip title="Jump to live">
                        <Button
                            size="small"
                            onClick={jumpToLive}
                            startIcon={<Radio size={13} />}
                            sx={{
                                textTransform: 'none', fontWeight: 800, py: 0.2, px: 1,
                                color: subText, border: `1px solid ${border}`,
                                '&:hover': { color: '#22c55e', borderColor: '#22c55e' }
                            }}
                        >
                            {indexMode === 'depth'
                                ? `${Math.round(indexDomain[0])}–${Math.round(indexDomain[1])} m · live`
                                : visibleTimeRangeLabel}
                        </Button>
                    </MuiTooltip>
                )}
            </Box>
            )}

            {/* Top band (full mode): left depth tiles spacer + configurable readout row. */}
            {showTopReadouts && (
                <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.75, mb: 1 }}>
                    {showLeftDepth && (
                        /* Spacer aligning the top readout row with the strips column:
                           depth track (132) + gap + left scroll rail (~30) + gap. */
                        <Box sx={{ flex: hmiMode ? '0 0 246px' : '0 0 176px', display: 'flex', alignItems: 'center', gap: 0.6, pl: 0.5 }}>
                            <Gauge size={16} color={subText} />
                            <Typography sx={{ color: subText, fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Depth
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch', gap: 0.75, overflowX: 'auto' }}>
                        {readouts.map((id) => (
                            <ReadoutTile
                                key={id}
                                id={id}
                                value={latestValues?.[id]}
                                surface={panelBg}
                                border={border}
                                text={text}
                                subText={subText}
                                accent={channelColor(id, accent)}
                                valueColor={channelColor(id, text)}
                            />
                        ))}
                    </Box>
                    <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
                        <ReadoutsConfig
                            value={readouts}
                            onChange={setReadouts}
                            channels={configureChannels}
                            surface={panelBg}
                            border={border}
                            text={text}
                            subText={subText}
                            accent={accent}
                        />
                    </Box>
                </Box>
            )}
            {/* When no readouts selected, still expose the config control (full mode). */}
            {!isCompact && readouts.length === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <ReadoutsConfig
                        value={readouts}
                        onChange={setReadouts}
                        channels={configureChannels}
                        surface={panelBg}
                        border={border}
                        text={text}
                        subText={subText}
                        accent={accent}
                    />
                </Box>
            )}

            {/* Strip area */}
            <Box ref={stripAreaRef} sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', gap: 0.75 }}>
                {/* Leftmost DEPTH track (full mode): header + depth-axis chart band + HOLE/BIT
                    depth bottom block, all sharing the strips' row metrics so it aligns exactly.
                    The depth/time axis is folded into this track's chart band. */}
                {showLeftDepth ? (
                    <DepthTrack
                        indexMode={indexMode}
                        indexDomain={indexDomain}
                        axisTicks={axisTicks}
                        samples={samples}
                        maxDepth={maxDepth}
                        holeDepthVal={holeDepthVal}
                        bitDepthVal={bitDepthVal}
                        headerH={headerH}
                        bottomH={bottomH}
                        chartBg={chartBg}
                        panelBg={panelBg}
                        border={border}
                        gridColor={gridColor}
                        text={text}
                        subText={subText}
                        accent={accent}
                        onPointerDown={onAxisPointerDown}
                        onPointerMove={onAxisPointerMove}
                        onPointerUp={onAxisPointerUp}
                    />
                ) : (
                    /* Compact mode: keep the slim standalone index axis (no depth track). */
                    <Box
                        onPointerDown={onAxisPointerDown}
                        onPointerMove={onAxisPointerMove}
                        onPointerUp={onAxisPointerUp}
                        onPointerLeave={onAxisPointerUp}
                        sx={{
                            flex: `0 0 ${axisWidth}px`,
                            bgcolor: panelBg,
                            border: `1px solid ${border}`,
                            borderRadius: 1,
                            position: 'relative',
                            cursor: 'ns-resize',
                            userSelect: 'none',
                            touchAction: 'none',
                            mt: `${railTop}px`,
                            mb: `${railBottom}px`
                        }}
                    >
                        <Typography sx={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, color: subText, textTransform: 'uppercase' }}>
                            {indexMode === 'depth' ? 'm' : 'time'}
                        </Typography>
                        {axisTicks.map((t, i) => (
                            <Box key={i} sx={{ position: 'absolute', left: 0, right: 0, top: `${t.frac * 100}%`, transform: 'translateY(-50%)', px: 0.25 }}>
                                <Typography sx={{ fontSize: '0.55rem', color: subText, textAlign: 'center', fontVariantNumeric: 'tabular-nums', whiteSpace: t.hasDate ? 'pre-line' : 'nowrap', lineHeight: t.hasDate ? 1.15 : 1 }}>
                                    {t.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* LEFT scroll rail */}
                <ScrollRail
                    onUp={clickBack}
                    onDown={clickFwd}
                    onHoldUp={() => startHold(1)}
                    onHoldDown={() => startHold(-1)}
                    onHoldStop={stopHold}
                    upTip={indexMode === 'depth' ? 'Shallower' : 'Older'}
                    downTip={indexMode === 'depth' ? 'Deeper' : 'Newer'}
                    downDisabled={liveAtBottom}
                    text={text}
                    border={border}
                    top={railTop}
                    bottom={railBottom}
                />

                {/* Strips */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 0.75 }}>
                    {strips.map((strip, si) => (
                        <Box key={si} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {/* header */}
                            <Box sx={{ height: headerH, display: 'flex', alignItems: 'center', gap: 0.5, mb: '4px' }}>
                                <Typography sx={{ flex: 1, minWidth: 0, color: text, fontSize: isCompact ? '0.66rem' : '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {strip.title}
                                </Typography>
                                <IconButton size="small" onClick={() => setConfigStrip(si)} sx={{ color: subText, p: 0.25 }} title="Configure track">
                                    <Settings size={isCompact ? 13 : 15} />
                                </IconButton>
                            </Box>
                            {/* chart */}
                            <Box sx={{ flex: '1 1 auto', minHeight: 0, bgcolor: chartBg, border: `1px solid ${border}`, borderRadius: 1, overflow: 'visible', position: 'relative', zIndex: hoverIndex != null ? 2 : 1 }}>
                                <StripChart
                                    strip={strip}
                                    samples={samples}
                                    indexMode={indexMode}
                                    indexDomain={indexDomain}
                                    accentColor={accent}
                                    gridColor={gridColor}
                                    axisTextColor={subText}
                                    surface={panelBg}
                                    border={border}
                                    subText={subText}
                                    textColor={text}
                                    sharedCursorIndex={hoverIndex}
                                    onCursorIndexChange={setHoverIndex}
                                    onCursorLeave={() => setHoverIndex(null)}
                                    includeCursorDate={Boolean(customRange) || (indexMode === 'time' && timeWindowMs >= 24 * 60 * 60 * 1000)}
                                    isDisconnected={!latestConnectedSample}
                                />
                            </Box>
                            {/* fixed-height variables block */}
                            <StripVariables
                                strip={strip}
                                latest={latestValues}
                                compact={isCompact}
                                surface={panelBg}
                                border={border}
                                subText={subText}
                            />
                        </Box>
                    ))}
                </Box>

                {/* RIGHT scroll rail (mirror of the left) — full mode only; compact keeps a single control. */}
                {!isCompact && (
                    <ScrollRail
                        onUp={clickBack}
                        onDown={clickFwd}
                        onHoldUp={() => startHold(1)}
                        onHoldDown={() => startHold(-1)}
                        onHoldStop={stopHold}
                        upTip={indexMode === 'depth' ? 'Shallower' : 'Older'}
                        downTip={indexMode === 'depth' ? 'Deeper' : 'Newer'}
                        downDisabled={liveAtBottom}
                        text={text}
                        border={border}
                        top={railTop}
                        bottom={railBottom}
                    />
                )}
            </Box>

            {/* Per-strip config dialog */}
            {configStrip != null && (
                <StripConfigDialog
                    open={configStrip != null}
                    onClose={() => setConfigStrip(null)}
                    strip={strips[configStrip]}
                    stripIndex={configStrip}
                    onSave={updateStrip}
                    channels={configureChannels}
                    surface={panelBg}
                    border={border}
                    text={text}
                    subText={subText}
                />
            )}
            <Dialog
                open={customRangeOpen}
                onClose={() => setCustomRangeOpen(false)}
                maxWidth="sm"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: hmiMode ? '#4a5568' : panelBg,
                        color: text,
                        border: `1px solid ${border}`,
                        borderRadius: 1,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
                        maxWidth: 680
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        px: 4,
                        py: 3,
                        fontSize: 18,
                        fontWeight: 900,
                        borderBottom: `1px solid ${border}`,
                        bgcolor: hmiMode ? '#4a5568' : panelBg
                    }}
                >
                    Custom Time Range
                </DialogTitle>
                <DialogContent
                    sx={{
                        px: 4,
                        py: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.2,
                        bgcolor: hmiMode ? '#4a5568' : panelBg
                    }}
                >
                    <TextField
                        label="From"
                        type="datetime-local"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{
                            '& .MuiInputLabel-root': { color: subText, fontSize: 14, fontWeight: 700 },
                            '& .MuiInputLabel-root.Mui-focused': { color: subText },
                            '& .MuiInputBase-root': {
                                color: '#f8fafc',
                                bgcolor: hmiMode ? '#4b5569' : 'rgba(255,255,255,0.04)',
                                fontSize: 16
                            },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
                            '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)' }
                        }}
                    />
                    <TextField
                        label="To"
                        type="datetime-local"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{
                            '& .MuiInputLabel-root': { color: subText, fontSize: 14, fontWeight: 700 },
                            '& .MuiInputLabel-root.Mui-focused': { color: subText },
                            '& .MuiInputBase-root': {
                                color: '#f8fafc',
                                bgcolor: hmiMode ? '#4b5569' : 'rgba(255,255,255,0.04)',
                                fontSize: 16
                            },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
                            '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)' }
                        }}
                    />
                </DialogContent>
                <DialogActions
                    sx={{
                        px: 3,
                        py: 2.4,
                        gap: 1.5,
                        borderTop: `1px solid ${border}`,
                        bgcolor: hmiMode ? '#4a5568' : panelBg
                    }}
                >
                    <Button
                        onClick={() => setCustomRangeOpen(false)}
                        sx={{ color: subText, fontSize: 14, fontWeight: 700, px: 2.2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!customRangeReady}
                        onClick={() => {
                            setCustomRange({
                                start: new Date(customStart).getTime(),
                                stop: new Date(customEnd).getTime()
                            });
                            setCustomRangeOpen(false);
                        }}
                        sx={{
                            bgcolor: accent,
                            color: '#001014',
                            fontSize: 14,
                            px: 2.8,
                            py: 1,
                            borderRadius: 1,
                            fontWeight: 900,
                            '&:hover': { bgcolor: accent },
                            '&.Mui-disabled': { bgcolor: '#64748b', color: '#d1d5db' }
                        }}
                    >
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>
            <EdrExportDialog
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                rows={sorted}
                channels={exportChannels}
                latestTimestamp={sorted.length ? sorted[sorted.length - 1].timestamp : Date.now()}
            />
        </Box>
    );
}


// ---------------------------------------------------------------------------
// One-file standalone EDR page
// ---------------------------------------------------------------------------

const DEFAULT_STRIPS = [
    {
        title: 'Hookload / WOB',
        pens: [
            { channelId: 'drawworks.hook_load', color: '#38bdf8', min: 0, max: 100, enabled: true },
            { channelId: 'modbus.WOB', color: '#fbbf24', min: 0, max: 1, enabled: true },
            { channelId: 'drawworks.block_position', color: '#4ade80', min: 0, max: 50, enabled: true }
        ]
    },
    {
        title: 'Rotary',
        pens: [
            { channelId: 'drilling.torque', color: '#a78bfa', min: 0, max: 20000, enabled: true },
            { channelId: 'system.rig_air_pressure', color: '#f472b6', min: 0, max: 1, enabled: true },
            { channelId: 'mudpump.pressure', color: '#22d3ee', min: 0, max: 1000, enabled: true }
        ]
    },
    {
        title: 'CAT ENG',
        pens: [
            { channelId: 'engine.rpm', color: '#fb7185', min: 0, max: 1, enabled: true },
            { channelId: 'engine.oil_pressure', color: '#38bdf8', min: 0, max: 1, enabled: true },
            { channelId: 'engine.oil_temp', color: '#f97316', min: 0, max: 1, enabled: true }
        ]
    },
    {
        title: 'Mud Volumes',
        pens: [
            { channelId: 'mudpump.flow_in', color: '#4ade80', min: 0, max: 1000, enabled: true },
            { channelId: 'mudpump.flow_out', color: '#fbbf24', min: 0, max: 1000, enabled: true },
            { channelId: 'fluid.trip_tank', color: '#a78bfa', min: 0, max: 50, enabled: true }
        ]
    }
];

const TOP_READOUTS = [
    'drawworks.hook_load',
    'modbus.WOB',
    'mudpump.pressure',
    'mudpump.spm'
];

export default function EdrStandalonePage() {
    return (
        <Box sx={{
            height: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            bgcolor: '#000000',
            color: '#ffffff',
            mx: -3,
            mt: -2,
            mb: -2,
        }}>
            <Box sx={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: 3.5,
                pt: 1.4,
                pb: 0.8,
                bgcolor: '#000000'
            }}>
                <Radio size={20} color="#ffffff" />
                <Typography sx={{ color: '#ffffff', fontSize: 24, lineHeight: 1, fontWeight: 900, letterSpacing: 0 }}>
                    Electronic Drilling Recorder (EDR)
                </Typography>
                <Box sx={{
                    px: 1.1,
                    py: 0.4,
                    border: '1px solid #0891b2',
                    borderRadius: 999,
                    color: '#22d3ee',
                    fontSize: 13,
                    fontWeight: 900,
                    lineHeight: 1
                }}>
                    Strip-chart log
                </Box>
            </Box>
            <Box sx={{ flex: '1 1 auto', minHeight: 0, px: 3.5, pt: 0 }}>
                <EdrView
                    mode="full"
                    storageKey="edr-main-hmi-dark-v3"
                    defaultStrips={DEFAULT_STRIPS}
                    rightReadouts={TOP_READOUTS}
                    showToolbar
                    hmiStyle
                />
            </Box>
        </Box>
    );
}
