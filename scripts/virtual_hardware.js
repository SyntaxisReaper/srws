/**
 * HydroNode - Virtual ESP32 Hardware Simulator
 * Simulates the physical microcontroller, contact probes, INA226 current sensor,
 * LR7843 pump MOSFET, and GPIO 27 solenoid valve against Firebase Realtime Database.
 */

const FIREBASE_BASE_URL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://srws-fbbca-default-rtdb.firebaseio.com";
const DEVICE_ID = process.env.DEVICE_ID || "device_001";
const DEVICE_URL = `${FIREBASE_BASE_URL}/devices/${DEVICE_ID}`;

console.log("=========================================================");
console.log("   HydroNode — Virtual ESP32 Hardware Simulator          ");
console.log(`   Target Device: ${DEVICE_ID}`);
console.log(`   Database URL:  ${FIREBASE_BASE_URL}`);
console.log("=========================================================\n");

// Internal hardware simulation state
let simState = {
  waterLevel: 45,
  motorRunning: false,
  valveOpen: false,
  motorFault: false,
  currentAmps: 0.0,
  busVoltage: 12.1,
  flowRateLpm: 0.0,
  topProbeDebounceTimer: 0,
};

async function getDeviceData() {
  try {
    const res = await fetch(`${DEVICE_URL}.json`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`[Virtual ESP32] Error fetching state: ${err.message}`);
  }
  return null;
}

async function patchStatus(statusUpdate) {
  try {
    await fetch(`${DEVICE_URL}/status.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statusUpdate),
    });
  } catch (err) {
    console.error(`[Virtual ESP32] Error updating status: ${err.message}`);
  }
}

async function patchCommand(commandUpdate) {
  try {
    await fetch(`${DEVICE_URL}/commands.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commandUpdate),
    });
  } catch (err) {
    console.error(`[Virtual ESP32] Error updating command: ${err.message}`);
  }
}

async function addHistoryEvent(event, note) {
  try {
    const eventId = `evt_${Date.now()}`;
    const payload = {
      id: eventId,
      event,
      waterLevel: Math.round(simState.waterLevel),
      motorState: simState.motorRunning ? "ON" : "OFF",
      valveState: simState.valveOpen ? "OPEN" : "CLOSED",
      note,
      ts: Date.now(),
    };
    await fetch(`${DEVICE_URL}/history/${Date.now()}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[EVENT LOGGED] 📜 ${event} — ${note}`);
  } catch (err) {
    console.error(`[Virtual ESP32] Error logging event: ${err.message}`);
  }
}

async function stepSimulation() {
  const remoteData = await getDeviceData();

  if (remoteData) {
    const commands = remoteData.commands || {};
    const remoteStatus = remoteData.status || {};

    // 1. Process Remote Motor Commands
    if (commands.motorCommand === "ON" && !simState.motorRunning && !simState.motorFault) {
      if (simState.waterLevel >= 90) {
        console.log("[SAFETY] 🚫 Motor ON rejected: Top probe is already submerged (Tank Full).");
        await patchCommand({ motorCommand: "OFF" });
      } else {
        simState.motorRunning = true;
        console.log("[ACTUATOR] ⚡ MOSFET Pump (GPIO 26): ENERGIZED (ON)");
        await addHistoryEvent("MOTOR_ON", "Pump started via remote mobile command");
      }
    } else if (commands.motorCommand === "OFF" && simState.motorRunning) {
      simState.motorRunning = false;
      console.log("[ACTUATOR] ⏹️ MOSFET Pump (GPIO 26): DISENGAGED (OFF)");
      await addHistoryEvent("MOTOR_OFF", "Pump stopped via remote mobile command");
    } else if (commands.motorCommand === "RESET_FAULT") {
      simState.motorFault = false;
      console.log("[RESET] 🔄 Dry-run fault cleared by operator.");
      await patchCommand({ motorCommand: "OFF" });
    }

    // 2. Process Remote Solenoid Valve Commands
    if (commands.valveCommand === "OPEN" && !simState.valveOpen) {
      if (simState.waterLevel >= 95) {
        console.log("[SAFETY] 🚫 Valve OPEN rejected: Tank is near overflow.");
        await patchCommand({ valveCommand: "CLOSED" });
      } else {
        simState.valveOpen = true;
        console.log("[ACTUATOR] 🌊 Solenoid Valve (GPIO 27): OPENED");
        await addHistoryEvent("VALVE_OPEN", "Municipal supply valve opened");
      }
    } else if (commands.valveCommand === "CLOSED" && simState.valveOpen) {
      simState.valveOpen = false;
      console.log("[ACTUATOR] 🔒 Solenoid Valve (GPIO 27): CLOSED");
      await addHistoryEvent("VALVE_CLOSED", "Municipal supply valve closed");
    }

    // Synchronize initial water level if remote was modified directly in console
    if (typeof remoteStatus.waterLevel === "number" && Math.abs(remoteStatus.waterLevel - simState.waterLevel) > 15 && !simState.motorRunning) {
      simState.waterLevel = remoteStatus.waterLevel;
    }
  }

  // 3. Simulate Fluid Dynamics
  if (simState.motorRunning) {
    simState.waterLevel = Math.min(100, simState.waterLevel + 1.5);
    simState.currentAmps = Number((0.48 + (Math.random() * 0.06 - 0.03)).toFixed(2));
    simState.flowRateLpm = Number((1.8 + (Math.random() * 0.2 - 0.1)).toFixed(2));
  } else if (simState.valveOpen) {
    simState.waterLevel = Math.min(100, simState.waterLevel + 0.8);
    simState.currentAmps = 0.35; // Solenoid coil holding current
    simState.flowRateLpm = 1.1;
  } else {
    // Idle state: slight domestic drain over time
    simState.waterLevel = Math.max(0, simState.waterLevel - 0.1);
    simState.currentAmps = 0.0;
    simState.flowRateLpm = 0.0;
  }

  // 4. Contact Probe States
  const isTopWet = simState.waterLevel >= 90;
  const isMidWet = simState.waterLevel >= 45;
  const isLowWet = simState.waterLevel >= 20;

  // 5. Overflow Protection (1-second debounce simulation)
  if (isTopWet && simState.motorRunning) {
    simState.topProbeDebounceTimer += 2000;
    if (simState.topProbeDebounceTimer >= 1000) {
      console.log("[AUTO CUT-OFF] 🚨 Top Probe Submerged for > 1s! Cutting pump power.");
      simState.motorRunning = false;
      simState.topProbeDebounceTimer = 0;
      await patchCommand({ motorCommand: "OFF" });
      await addHistoryEvent("TANK_FULL", "Auto Cut-Off: Tank reached capacity");
    }
  } else {
    simState.topProbeDebounceTimer = 0;
  }

  if (simState.waterLevel >= 95 && simState.valveOpen) {
    console.log("[AUTO CUT-OFF] 🚨 Valve Auto-Close: Tank reaching 95% full.");
    simState.valveOpen = false;
    await patchCommand({ valveCommand: "CLOSED" });
    await addHistoryEvent("VALVE_CLOSED", "Auto shutoff: Tank full");
  }

  // 6. Build and Send Telemetry
  const levelState = isTopWet ? "TANK FULL" : !isLowWet ? "TANK EMPTY" : !isMidWet ? "LOW WATER" : "MEDIUM";
  const now = Date.now();

  const statusPayload = {
    waterLevel: Math.round(simState.waterLevel),
    waterLevelRaw: Number(simState.waterLevel.toFixed(1)),
    levelState,
    probeTop: isTopWet,
    probeMid: isMidWet,
    probeLow: isLowWet,
    motorRunning: simState.motorRunning,
    motorFault: simState.motorFault,
    relayState: simState.motorRunning ? "ON" : "OFF",
    valveOpen: simState.valveOpen,
    valveState: simState.valveOpen ? "OPEN" : "CLOSED",
    currentAmps: simState.currentAmps,
    busVoltage: simState.busVoltage,
    flowRateLpm: simState.flowRateLpm,
    networkUplink: "Wi-Fi (Primary) • Virtual Hardware Simulator",
    wifiStrength: -58,
    lastSeen: now, // Real-time timestamp keeps mobile app 100% ONLINE
  };

  await patchStatus(statusPayload);

  const pumpStatus = simState.motorRunning ? "🟢 PUMP RUNNING" : "⚪ PUMP IDLE";
  const valveStatus = simState.valveOpen ? "💧 VALVE OPEN" : "🔒 VALVE CLOSED";
  console.log(
    `[TELEMETRY] Level: ${String(Math.round(simState.waterLevel)).padStart(3)}% (${levelState.padEnd(9)}) | ${pumpStatus} | ${valveStatus} | Load: ${simState.currentAmps.toFixed(2)}A | Heartbeat: OK`
  );
}

// Start simulation loop every 2 seconds
console.log("Virtual Hardware initialized. Pinging Firebase every 2 seconds...\n");
stepSimulation();
setInterval(stepSimulation, 2000);
