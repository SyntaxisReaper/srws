/**
 * Device Service: Communicates with Firebase Realtime Database
 * and manages local simulation state for reliable testing & demonstrations.
 * Includes Remote Valve Control (GPIO 27) and Network Uplink Failover status.
 */

import { firebaseConfig, isFirebaseConfigured, DEFAULT_DEVICE_ID } from "./firebaseConfig";

// Initial mock state matching the updated hardware schema
let simulatedDeviceState = {
  status: {
    waterLevel: 60,
    levelState: "MEDIUM",
    probeTop: false,
    probeMid: true,
    probeLow: true,
    motorRunning: false,
    motorFault: false,
    relayState: "OFF",
    valveState: "CLOSED", // Expected Output #4: Remote Water-Supply Valve Control
    currentAmps: 0.0,
    busVoltage: 12.2,
    flowRateLpm: 0.0,
    totalVolumeLiters: 18.5,
    networkUplink: "Wi-Fi (Primary) • Hotspot Ready",
    cellularBackup: "Roadmap Port Ready (SIM7600)",
    wifiStrength: -62,
    lastSeen: Date.now(),
  },
  commands: {
    motorCommand: "OFF",
    valveCommand: "CLOSED",
    scheduledOn: "06:00",
    scheduledOff: "06:30",
    autoMode: true,
  },
  schedule: {
    enabled: true,
    onTime: "06:00",
    offTime: "06:30",
    days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  },
  config: {
    tankHeightCm: 30,
    fullThreshold: 90,
    lowThreshold: 25,
    tankCapacityLiters: 20,
  },
  history: [
    {
      id: "h-1",
      event: "MOTOR_OFF",
      waterLevel: 60,
      motorState: "OFF",
      valveState: "CLOSED",
      note: "Pump stopped normally",
      ts: Date.now() - 1000 * 60 * 15,
    },
    {
      id: "h-2",
      event: "VALVE_CLOSED",
      waterLevel: 60,
      motorState: "OFF",
      valveState: "CLOSED",
      note: "Supply valve closed on schedule",
      ts: Date.now() - 1000 * 60 * 20,
    },
    {
      id: "h-3",
      event: "LOW_WATER",
      waterLevel: 25,
      motorState: "OFF",
      valveState: "OPEN",
      note: "Water dropped to low probe",
      ts: Date.now() - 1000 * 60 * 35,
    },
  ],
};

const stateListeners = new Set();

export const subscribeToDeviceState = (deviceId, callback, useSimulation = false) => {
  if (useSimulation || !isFirebaseConfigured()) {
    callback(simulatedDeviceState);

    const listener = (newState) => callback(newState);
    stateListeners.add(listener);

    return () => {
      stateListeners.delete(listener);
    };
  }

  const url = `${firebaseConfig.databaseURL}/devices/${deviceId || DEFAULT_DEVICE_ID}.json`;
  let isActive = true;

  const normalizeHistory = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "object") {
      return Object.keys(raw)
        .map((k) => ({
          id: raw[k]?.id || k,
          ...raw[k],
          ts: raw[k]?.ts || Number(k) || Date.now(),
        }))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }
    return [];
  };

  const fetchLiveState = async () => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && isActive) {
          const normalized = {
            ...data,
            history: normalizeHistory(data.history),
            schedule: data.schedule || {
              enabled: data.commands?.autoMode !== false,
              onTime: data.commands?.scheduledOn || "06:00",
              offTime: data.commands?.scheduledOff || "06:30",
              days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
            },
            status: {
              ...data.status,
              waterLevel: data.status?.waterLevel ?? 0,
              valveState: data.status?.valveState || (data.status?.valveOpen ? "OPEN" : "CLOSED"),
              levelState:
                data.status?.levelState ||
                (data.status?.waterLevel >= 90
                  ? "TANK FULL"
                  : data.status?.waterLevel <= 20
                  ? "LOW WATER"
                  : "MEDIUM"),
            },
          };
          callback(normalized);
        }
      }
    } catch (err) {
      console.warn("[DeviceService] Live fetch error, falling back to simulated data:", err.message);
      if (isActive) callback(simulatedDeviceState);
    }
  };

  fetchLiveState();
  const intervalId = setInterval(fetchLiveState, 2000);

  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
};

export const sendMotorCommand = async (deviceId, command, useSimulation = false, manualOverride = false) => {
  const targetDevice = deviceId || DEFAULT_DEVICE_ID;

  if (useSimulation || !isFirebaseConfigured()) {
    if (command === "ON" && !manualOverride) {
      if (simulatedDeviceState.status.probeTop || simulatedDeviceState.status.waterLevel >= 90) {
        throw new Error("Cannot start pump: Tank is already FULL (Top probe submerged). Enable manual override to force.");
      }
      if (simulatedDeviceState.status.motorFault) {
        throw new Error("Cannot start pump: Dry-run fault is active. Clear/reset fault first.");
      }
    }

    const isRunning = command === "ON";
    simulatedDeviceState = {
      ...simulatedDeviceState,
      status: {
        ...simulatedDeviceState.status,
        motorRunning: isRunning,
        relayState: command,
        currentAmps: isRunning ? 0.48 : 0.0,
        flowRateLpm: isRunning ? 1.8 : 0.0,
        lastSeen: Date.now(),
      },
      commands: {
        ...simulatedDeviceState.commands,
        motorCommand: command,
        manualOverride: manualOverride || simulatedDeviceState.commands.manualOverride || false,
      },
      history: [
        {
          id: `h-${Date.now()}`,
          event: isRunning ? "MOTOR_ON" : "MOTOR_OFF",
          waterLevel: simulatedDeviceState.status.waterLevel,
          motorState: command,
          valveState: simulatedDeviceState.status.valveState,
          note: manualOverride ? `Manual Override Pump: ${command}` : `MOSFET Pump command: ${command}`,
          ts: Date.now(),
        },
        ...simulatedDeviceState.history.slice(0, 19),
      ],
    };

    notifySimulationListeners();
    return true;
  }

  const motorUrl = `${firebaseConfig.databaseURL}/devices/${targetDevice}/commands/motorCommand.json`;
  const response = await fetch(motorUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Failed to send motor command to Firebase: ${response.statusText}`);
  }

  if (manualOverride) {
    const overrideUrl = `${firebaseConfig.databaseURL}/devices/${targetDevice}/commands/manualOverride.json`;
    await fetch(overrideUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(true),
    }).catch(() => {});
  }

  return true;
};

// Remote Water-Supply Valve Control (Expected Output #4)
export const sendValveCommand = async (deviceId, command, useSimulation = false, manualOverride = false) => {
  const targetDevice = deviceId || DEFAULT_DEVICE_ID;

  if (useSimulation || !isFirebaseConfigured()) {
    if (command === "OPEN" && !manualOverride && simulatedDeviceState.status.waterLevel >= 90) {
      throw new Error("Cannot open valve: Tank is already full. Enable manual override to force.");
    }

    const isOpen = command === "OPEN";
    simulatedDeviceState = {
      ...simulatedDeviceState,
      status: {
        ...simulatedDeviceState.status,
        valveState: command,
        lastSeen: Date.now(),
      },
      commands: {
        ...simulatedDeviceState.commands,
        valveCommand: command,
        manualOverride: manualOverride || simulatedDeviceState.commands.manualOverride || false,
      },
      history: [
        {
          id: `h-${Date.now()}`,
          event: isOpen ? "VALVE_OPEN" : "VALVE_CLOSED",
          waterLevel: simulatedDeviceState.status.waterLevel,
          motorState: simulatedDeviceState.status.relayState,
          valveState: command,
          note: manualOverride ? `Manual Override Valve: ${command}` : `Inlet Supply Valve: ${command} (GPIO 27)`,
          ts: Date.now(),
        },
        ...simulatedDeviceState.history.slice(0, 19),
      ],
    };

    notifySimulationListeners();
    return true;
  }

  const url = `${firebaseConfig.databaseURL}/devices/${targetDevice}/commands/valveCommand.json`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Failed to send valve command to Firebase: ${response.statusText}`);
  }

  if (manualOverride) {
    const overrideUrl = `${firebaseConfig.databaseURL}/devices/${targetDevice}/commands/manualOverride.json`;
    await fetch(overrideUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(true),
    }).catch(() => {});
  }

  return true;
};

export const setManualOverride = async (deviceId, enabled, useSimulation = false) => {
  const targetDevice = deviceId || DEFAULT_DEVICE_ID;

  if (useSimulation || !isFirebaseConfigured()) {
    simulatedDeviceState = {
      ...simulatedDeviceState,
      commands: {
        ...simulatedDeviceState.commands,
        manualOverride: enabled,
      },
      history: [
        {
          id: `h-${Date.now()}`,
          event: enabled ? "MANUAL_OVERRIDE_ON" : "MANUAL_OVERRIDE_OFF",
          waterLevel: simulatedDeviceState.status.waterLevel,
          motorState: simulatedDeviceState.status.relayState,
          valveState: simulatedDeviceState.status.valveState,
          note: enabled ? "Manual Override activated by homeowner" : "Auto-Protection restored",
          ts: Date.now(),
        },
        ...simulatedDeviceState.history.slice(0, 19),
      ],
    };
    notifySimulationListeners();
    return true;
  }

  const url = `${firebaseConfig.databaseURL}/devices/${targetDevice}/commands/manualOverride.json`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enabled),
  });

  if (!response.ok) {
    throw new Error(`Failed to update manual override mode: ${response.statusText}`);
  }
  return true;
};

export const resetFault = async (deviceId, useSimulation = false) => {
  if (useSimulation || !isFirebaseConfigured()) {
    triggerSimulatedFault(false);
    return true;
  }
  return sendMotorCommand(deviceId, "RESET_FAULT", false);
};

export const triggerSimulatedFault = (faultActive = true) => {
  simulatedDeviceState = {
    ...simulatedDeviceState,
    status: {
      ...simulatedDeviceState.status,
      motorFault: faultActive,
      motorRunning: faultActive ? false : simulatedDeviceState.status.motorRunning,
      relayState: faultActive ? "OFF" : simulatedDeviceState.status.relayState,
      valveState: faultActive ? "CLOSED" : simulatedDeviceState.status.valveState,
      currentAmps: faultActive ? 0.08 : (simulatedDeviceState.status.motorRunning ? 0.48 : 0.0),
      flowRateLpm: 0.0,
      lastSeen: Date.now(),
    },
    history: faultActive
      ? [
          {
            id: `h-${Date.now()}`,
            event: "MOTOR_FAULT",
            waterLevel: simulatedDeviceState.status.waterLevel,
            motorState: "OFF",
            valveState: "CLOSED",
            note: "INA226 dry-run alert: current < 0.2A",
            ts: Date.now(),
          },
          ...simulatedDeviceState.history.slice(0, 19),
        ]
      : simulatedDeviceState.history,
  };
  notifySimulationListeners();
};

export const setContactProbeLevel = (levelPreset) => {
  let percentage = 60;
  let levelState = "MEDIUM";
  let probeTop = false;
  let probeMid = true;
  let probeLow = true;

  if (levelPreset === "FULL" || levelPreset >= 90) {
    percentage = 100;
    levelState = "FULL";
    probeTop = true;
    probeMid = true;
    probeLow = true;
  } else if (levelPreset === "MEDIUM" || (levelPreset >= 40 && levelPreset < 90)) {
    percentage = 60;
    levelState = "MEDIUM";
    probeTop = false;
    probeMid = true;
    probeLow = true;
  } else if (levelPreset === "LOW" || (levelPreset > 0 && levelPreset < 40)) {
    percentage = 25;
    levelState = "LOW";
    probeTop = false;
    probeMid = false;
    probeLow = true;
  } else {
    percentage = 0;
    levelState = "EMPTY";
    probeTop = false;
    probeMid = false;
    probeLow = false;
  }

  // Auto cut-off on top probe
  let motorRunning = simulatedDeviceState.status.motorRunning;
  let relayState = simulatedDeviceState.status.relayState;
  let valveState = simulatedDeviceState.status.valveState;

  if (probeTop) {
    if (motorRunning) {
      motorRunning = false;
      relayState = "OFF";
      simulatedDeviceState.history.unshift({
        id: `h-${Date.now()}`,
        event: "TANK_FULL",
        waterLevel: percentage,
        motorState: "OFF",
        valveState: "CLOSED",
        note: "Auto cut-off: Top contact probe submerged",
        ts: Date.now(),
      });
    }
    valveState = "CLOSED"; // Auto-close supply valve on full
  }

  simulatedDeviceState = {
    ...simulatedDeviceState,
    status: {
      ...simulatedDeviceState.status,
      waterLevel: percentage,
      levelState,
      probeTop,
      probeMid,
      probeLow,
      motorRunning,
      relayState,
      valveState,
      flowRateLpm: motorRunning ? 1.8 : 0.0,
      lastSeen: Date.now(),
    },
  };
  notifySimulationListeners();
};

export const updateScheduleConfig = async (deviceId, config, useSimulation = false) => {
  const targetDevice = deviceId || DEFAULT_DEVICE_ID;
  const normalizedSchedule = {
    enabled: config.enabled ?? (config.autoMode !== false),
    onTime: config.onTime || config.scheduledOn || "06:00",
    offTime: config.offTime || config.scheduledOff || "06:30",
    days: config.days || config.repeatDays || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  };

  if (useSimulation || !isFirebaseConfigured()) {
    simulatedDeviceState = {
      ...simulatedDeviceState,
      schedule: normalizedSchedule,
      commands: {
        ...simulatedDeviceState.commands,
        autoMode: normalizedSchedule.enabled,
        scheduledOn: normalizedSchedule.onTime,
        scheduledOff: normalizedSchedule.offTime,
      },
    };
    notifySimulationListeners();
    return true;
  }

  const scheduleUrl = `${firebaseConfig.databaseURL}/devices/${targetDevice}/schedule.json`;
  const commandsUrl = `${firebaseConfig.databaseURL}/devices/${targetDevice}/commands.json`;

  try {
    const [res1] = await Promise.all([
      fetch(scheduleUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedSchedule),
      }),
      fetch(commandsUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoMode: normalizedSchedule.enabled,
          scheduledOn: normalizedSchedule.onTime,
          scheduledOff: normalizedSchedule.offTime,
        }),
      }).catch(() => {}),
    ]);

    return res1.ok;
  } catch (err) {
    console.error("[DeviceService] Schedule update error:", err);
    return false;
  }
};

// Simulation refill loop
setInterval(() => {
  if (simulatedDeviceState.status.motorRunning && !simulatedDeviceState.status.motorFault) {
    const curLevel = simulatedDeviceState.status.waterLevel;
    if (curLevel < 25) {
      setContactProbeLevel("LOW");
    } else if (curLevel < 60) {
      setContactProbeLevel("MEDIUM");
    } else if (curLevel < 100) {
      setContactProbeLevel("FULL");
    }

    simulatedDeviceState.status.totalVolumeLiters = +(
      (simulatedDeviceState.status.totalVolumeLiters || 0) + 0.06
    ).toFixed(2);
    notifySimulationListeners();
  }
}, 4000);

const notifySimulationListeners = () => {
  stateListeners.forEach((fn) => fn({ ...simulatedDeviceState }));
};
