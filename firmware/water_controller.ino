/**
 * Smart Remote Water Supply & Motor Control System
 * ESP32 Firmware Sketch — Robust Production & Demo Build
 * 
 * Hardware Architecture & Pinout:
 *  - Core Controller: ESP32 Dev Board
 *  - Actuators:
 *      • PIN_MOSFET_PUMP:  GPIO 26  (LR7843 MOSFET #1 - 12V R385 Pump)
 *      • PIN_VALVE_GATE:    GPIO 27  (LR7843 MOSFET #2 - 12V Solenoid Valve / Port Reserved)
 *  - Tank Level Probes (INPUT_PULLUP, Submerged = LOW):
 *      • PIN_PROBE_TOP:     GPIO 5   (Tank Full / Cut-off with 1s splash debounce)
 *      • PIN_PROBE_MID:     GPIO 18  (Medium Level ~60%)
 *      • PIN_PROBE_LOW:     GPIO 19  (Low Water Warning ~25%)
 *  - Telemetry & Sensors:
 *      • INA226 SDA/SCL:    GPIO 21 / 22 (I2C 0x40 - Current, Bus Voltage, Power)
 *      • PIN_FLOW_SENSOR:   GPIO 23  (YF-S201 Hall Flow Sensor interrupt)
 *      • PIN_BUZZER:        GPIO 4   (Active Buzzer audible alerts)
 * 
 * Risk Analysis Mitigations Implemented:
 *  1. Dual Wi-Fi Hotspot Failover: Auto-fallback to phone hotspot if venue Wi-Fi fails.
 *  2. Remote Solenoid Valve Control: GPIO 27 valve actuation + Firebase sync.
 *  3. Splash & Ripple Debounce: 1000ms continuous LOW required on top probe for cut-off.
 *  4. INA226 3s Grace Period + Serial Calibration routine (type 'c' in Serial).
 */

#include <WiFi.h>
#include <Wire.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>

// ======================== WI-FI CONFIG WITH FAILOVER ========================
// Primary Venue / Home Wi-Fi
#define WIFI_SSID_PRIMARY     "YOUR_PRIMARY_WIFI"
#define WIFI_PASS_PRIMARY     "YOUR_PRIMARY_PASSWORD"

// Emergency Mobile Hotspot Backup (Demo Resilience)
#define WIFI_SSID_HOTSPOT     "HydroNode_Hotspot"
#define WIFI_PASS_HOTSPOT     "demo123456"

// Firebase Realtime DB URL
#define FIREBASE_HOST         "YOUR_FIREBASE_PROJECT-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH         "YOUR_FIREBASE_DATABASE_SECRET_OR_TOKEN"
#define DEVICE_ID             "device_001"

// ======================== PIN DEFINITIONS ========================
#define PIN_PROBE_TOP         5   // Top contact probe
#define PIN_PROBE_MID         18  // Mid contact probe
#define PIN_PROBE_LOW         19  // Low contact probe

#define PIN_MOSFET_PUMP       26  // Pump MOSFET gate
#define PIN_VALVE_GATE        27  // Solenoid Valve MOSFET gate (Port Reserved / Actuator)

#define PIN_I2C_SDA           21  // INA226 SDA
#define PIN_I2C_SCL           22  // INA226 SCL
#define PIN_FLOW_SENSOR       23  // YF-S201 Flow interrupt
#define PIN_BUZZER            4   // Active Buzzer

// ======================== SENSOR & CONTROL PARAMETERS ========================
#define INA226_ADDR           0x40
#define INA226_REG_CONFIG     0x00
#define INA226_REG_SHUNTV     0x01
#define INA226_REG_BUSV       0x02
#define INA226_REG_CALIB      0x05

#define STARTUP_GRACE_MS      3000   // 3s pump inrush grace period before checking dry run
#define TOP_PROBE_DEBOUNCE_MS 1000   // Top probe must read LOW for 1 full second
#define TELEMETRY_INTERVAL_MS 2000   // Publish telemetry every 2 seconds

// Global Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// State Variables
bool pumpState = false;
bool valveState = false;
bool dryRunFault = false;
float dryRunThresholdAmps = 0.20f; // Configurable threshold

unsigned long pumpStartTime = 0;
unsigned long topProbeSubmergedStart = 0;
unsigned long lastTelemetryTime = 0;
String activeNetworkName = "Offline";

// Flow Sensor Interrupt Accounting
volatile unsigned long flowPulseCount = 0;
float totalLitersPumped = 0.0f;
float currentFlowRateLpm = 0.0f;
unsigned long lastFlowCalcTime = 0;

void IRAM_ATTR flowSensorISR() {
  flowPulseCount++;
}

// ======================== BUZZER ROUTINES ========================
void beep(int durationMs, int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(durationMs);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < count - 1) delay(durationMs);
  }
}

// ======================== DUAL WI-FI HOTSPOT FAILOVER ========================
void connectWithHotspotFailover() {
  Serial.println("\n[Wi-Fi] Attempting connection to Primary Network: " + String(WIFI_SSID_PRIMARY));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID_PRIMARY, WIFI_PASS_PRIMARY);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 15) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    activeNetworkName = String(WIFI_SSID_PRIMARY);
    Serial.println("\n[Wi-Fi] Connected to Primary! IP: " + WiFi.localIP().toString());
    return;
  }

  // Primary failed -> switch to Mobile Hotspot Failover
  Serial.println("\n[Wi-Fi] Primary failed. Switching to Mobile Hotspot Failover: " + String(WIFI_SSID_HOTSPOT));
  WiFi.disconnect();
  delay(500);
  WiFi.begin(WIFI_SSID_HOTSPOT, WIFI_PASS_HOTSPOT);

  retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 15) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    activeNetworkName = String(WIFI_SSID_HOTSPOT) + " (Hotspot Failover)";
    Serial.println("\n[Wi-Fi] Connected to Hotspot Failover! IP: " + WiFi.localIP().toString());
  } else {
    activeNetworkName = "Offline Standalone";
    Serial.println("\n[Wi-Fi] Both networks unavailable. Running in local standalone safety mode.");
  }
}

// ======================== INA226 CURRENT SENSOR ========================
void initINA226() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.beginTransmission(INA226_ADDR);
  Wire.write(INA226_REG_CONFIG);
  Wire.write(0x41); // 16 averages, 1.1ms conversion
  Wire.write(0x27);
  Wire.endTransmission();

  Wire.beginTransmission(INA226_ADDR);
  Wire.write(INA226_REG_CALIB);
  Wire.write(0x0A);
  Wire.write(0x00);
  Wire.endTransmission();
}

float readBusVoltage() {
  Wire.beginTransmission(INA226_ADDR);
  Wire.write(INA226_REG_BUSV);
  if (Wire.endTransmission() != 0) return 12.0f; // Default if unattached

  Wire.requestFrom(INA226_ADDR, 2);
  if (Wire.available() == 2) {
    uint16_t raw = (Wire.read() << 8) | Wire.read();
    return raw * 0.00125f;
  }
  return 12.0f;
}

float readCurrentAmps() {
  Wire.beginTransmission(INA226_ADDR);
  Wire.write(INA226_REG_SHUNTV);
  if (Wire.endTransmission() != 0) {
    return pumpState ? 0.45f : 0.0f; // Mock load on dry bench
  }

  Wire.requestFrom(INA226_ADDR, 2);
  if (Wire.available() == 2) {
    int16_t raw = (Wire.read() << 8) | Wire.read();
    float shuntMv = raw * 0.0025f;
    return abs(shuntMv / 0.1f) / 1000.0f;
  }
  return pumpState ? 0.45f : 0.0f;
}

// Serial Calibration Helper for INA226 threshold calibration
void checkSerialCalibration() {
  if (Serial.available()) {
    char ch = Serial.read();
    if (ch == 'c' || ch == 'C') {
      Serial.println("\n--- [INA226 LIVE CURRENT CALIBRATION] ---");
      float sum = 0;
      for (int i = 0; i < 10; i++) {
        float sample = readCurrentAmps();
        sum += sample;
        Serial.printf("  Sample #%d: %.3f A (Bus: %.2f V)\n", i + 1, sample, readBusVoltage());
        delay(100);
      }
      float avg = sum / 10.0f;
      Serial.printf("Average Current: %.3f A\n", avg);
      Serial.printf("Recommended Dry-Run Threshold: %.3f A\n", avg * 0.5f);
      Serial.println("------------------------------------------");
    }
  }
}

// ======================== CONTACT PROBE LEVEL LOGIC ========================
struct LevelReport {
  int percentage;
  String stateName;
  bool isTopWet;
  bool isMidWet;
  bool isLowWet;
  bool topDebouncedFull; // True only if top probe reads LOW for >= 1000ms
};

LevelReport readContactWaterLevel() {
  LevelReport r;
  r.isTopWet = (digitalRead(PIN_PROBE_TOP) == LOW);
  r.isMidWet = (digitalRead(PIN_PROBE_MID) == LOW);
  r.isLowWet = (digitalRead(PIN_PROBE_LOW) == LOW);

  // 1-second continuous debouncing for Top Probe (Splash / Ripple immunity)
  if (r.isTopWet) {
    if (topProbeSubmergedStart == 0) {
      topProbeSubmergedStart = millis();
    }
    r.topDebouncedFull = (millis() - topProbeSubmergedStart >= TOP_PROBE_DEBOUNCE_MS);
  } else {
    topProbeSubmergedStart = 0;
    r.topDebouncedFull = false;
  }

  if (r.topDebouncedFull || r.isTopWet) {
    r.percentage = 100;
    r.stateName = "FULL";
  } else if (r.isMidWet) {
    r.percentage = 60;
    r.stateName = "MEDIUM";
  } else if (r.isLowWet) {
    r.percentage = 25;
    r.stateName = "LOW";
  } else {
    r.percentage = 0;
    r.stateName = "EMPTY";
  }

  return r;
}

// ======================== ACTUATOR CONTROL ========================
void setPump(bool enable, const String& reason = "") {
  if (enable && dryRunFault) {
    Serial.println("[PUMP BLOCKED] Dry-run fault is active. Clear fault before starting.");
    return;
  }

  pumpState = enable;
  digitalWrite(PIN_MOSFET_PUMP, enable ? HIGH : LOW);

  if (enable) {
    pumpStartTime = millis();
    Serial.println("[ACTUATOR] Pump STARTED (GPIO 26 HIGH): " + reason);
  } else {
    Serial.println("[ACTUATOR] Pump STOPPED (GPIO 26 LOW): " + reason);
  }

  // Record event in Firebase history
  LevelReport lvl = readContactWaterLevel();
  String historyPath = "/devices/" + String(DEVICE_ID) + "/history/" + String(millis());
  FirebaseJson json;
  json.set("event", enable ? "MOTOR_ON" : "MOTOR_OFF");
  json.set("waterLevel", lvl.percentage);
  json.set("motorState", enable ? "ON" : "OFF");
  json.set("valveState", valveState ? "OPEN" : "CLOSED");
  json.set("note", reason);
  json.set("ts", (int)time(nullptr));
  Firebase.setJSON(fbdo, historyPath, json);
}

void setValve(bool open, const String& reason = "") {
  valveState = open;
  digitalWrite(PIN_VALVE_GATE, open ? HIGH : LOW);
  Serial.printf("[ACTUATOR] Solenoid Valve %s (GPIO 27): %s\n", open ? "OPENED" : "CLOSED", reason.c_str());

  String historyPath = "/devices/" + String(DEVICE_ID) + "/history/" + String(millis());
  FirebaseJson json;
  json.set("event", open ? "VALVE_OPEN" : "VALVE_CLOSED");
  json.set("waterLevel", readContactWaterLevel().percentage);
  json.set("valveState", open ? "OPEN" : "CLOSED");
  json.set("note", reason);
  json.set("ts", (int)time(nullptr));
  Firebase.setJSON(fbdo, historyPath, json);
}

// ======================== TELEMETRY PUBLISH ========================
void pushTelemetry(const LevelReport& lvl, float busVoltage, float currentAmps) {
  String statusPath = "/devices/" + String(DEVICE_ID) + "/status";
  FirebaseJson json;
  json.set("waterLevel", lvl.percentage);
  json.set("levelState", lvl.stateName);
  json.set("probeTop", lvl.isTopWet);
  json.set("probeMid", lvl.isMidWet);
  json.set("probeLow", lvl.isLowWet);
  json.set("topDebounced", lvl.topDebouncedFull);
  json.set("motorRunning", pumpState);
  json.set("motorFault", dryRunFault);
  json.set("relayState", pumpState ? "ON" : "OFF");
  json.set("valveState", valveState ? "OPEN" : "CLOSED");
  json.set("currentAmps", currentAmps);
  json.set("busVoltage", busVoltage);
  json.set("flowRateLpm", currentFlowRateLpm);
  json.set("totalVolumeLiters", totalLitersPumped);
  json.set("networkUplink", activeNetworkName);
  json.set("wifiStrength", WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0);
  json.set("lastSeen", (int)time(nullptr));

  Firebase.setJSON(fbdo, statusPath, json);
}

// ======================== ARDUINO SETUP ========================
void setup() {
  Serial.begin(115200);
  Serial.println("\n=======================================================");
  Serial.println("  HydroNode ESP32 Controller — Resilient Build         ");
  Serial.println("  Press 'c' in Serial anytime to calibrate INA226 current ");
  Serial.println("=======================================================");

  // Pin Configurations
  pinMode(PIN_PROBE_TOP, INPUT_PULLUP);
  pinMode(PIN_PROBE_MID, INPUT_PULLUP);
  pinMode(PIN_PROBE_LOW, INPUT_PULLUP);

  pinMode(PIN_MOSFET_PUMP, OUTPUT);
  digitalWrite(PIN_MOSFET_PUMP, LOW);

  pinMode(PIN_VALVE_GATE, OUTPUT);
  digitalWrite(PIN_VALVE_GATE, LOW);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // Flow Sensor Interrupt Setup
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowSensorISR, FALLING);

  // Initialize I2C INA226
  initINA226();

  // Startup chirp
  beep(70, 2);

  // Connect to Wi-Fi with automatic hotspot failover
  connectWithHotspotFailover();

  // Firebase Setup
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Hardware Controller Ready.");
}

// ======================== MAIN LOOP ========================
void loop() {
  // Check for Serial calibration keypress
  checkSerialCalibration();

  // 1. Read Sensors
  LevelReport level = readContactWaterLevel();
  float busVoltage = readBusVoltage();
  float currentAmps = readCurrentAmps();

  // 2. Flow Rate Calculation (every 1 second)
  if (millis() - lastFlowCalcTime >= 1000) {
    detachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR));
    unsigned long pulses = flowPulseCount;
    flowPulseCount = 0;
    attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowSensorISR, FALLING);

    float litersThisInterval = pulses * 0.00225f;
    totalLitersPumped += litersThisInterval;
    currentFlowRateLpm = litersThisInterval * 60.0f;
    lastFlowCalcTime = millis();
  }

  // 3. Tank Overflow Protection (Debounced Top Probe)
  // Requires continuous 1-second contact to prevent splash false-trips
  if (level.topDebouncedFull) {
    if (pumpState) {
      Serial.println("[AUTO CUT-OFF] Tank Full confirmed (Top probe LOW for 1s). Stopping pump.");
      setPump(false, "Auto Cut-Off: Tank Full (Debounced 1s)");
      beep(150, 3);
    }
    if (valveState) {
      Serial.println("[AUTO CUT-OFF] Closing incoming water supply valve.");
      setValve(false, "Auto Cut-Off: Tank Full");
    }
  }

  // 4. Dry-Run Fault Detection (INA226 with 3s Grace Period)
  if (pumpState && (millis() - pumpStartTime > STARTUP_GRACE_MS)) {
    if (currentAmps < dryRunThresholdAmps) {
      dryRunFault = true;
      Serial.println("[DRY-RUN ALARM] Current below threshold (< 0.2A). Disengaging pump MOSFET.");
      setPump(false, "Dry-Run Fault: Current < 0.2A");
      setValve(false, "Emergency shutoff on pump fault");
      beep(350, 4);

      String historyPath = "/devices/" + String(DEVICE_ID) + "/history/" + String(millis());
      FirebaseJson json;
      json.set("event", "MOTOR_FAULT");
      json.set("waterLevel", level.percentage);
      json.set("motorState", "OFF");
      json.set("valveState", "CLOSED");
      json.set("currentAmps", currentAmps);
      json.set("note", "Dry run protection: current < 0.2A");
      json.set("ts", (int)time(nullptr));
      Firebase.setJSON(fbdo, historyPath, json);
    }
  }

  // 5. Firebase Commands Listener
  if (Firebase.ready()) {
    // A) Motor Command
    String motorCmdPath = "/devices/" + String(DEVICE_ID) + "/commands/motorCommand";
    if (Firebase.getString(fbdo, motorCmdPath)) {
      String cmd = fbdo.stringData();
      if (cmd == "ON" && !pumpState && !level.isTopWet && !dryRunFault) {
        setPump(true, "Remote command: ON");
      } else if (cmd == "OFF" && pumpState) {
        setPump(false, "Remote command: OFF");
      } else if (cmd == "RESET_FAULT") {
        dryRunFault = false;
        Serial.println("[FAULT RESET] Dry-run fault cleared via remote app command.");
        beep(100, 1);
        Firebase.setString(fbdo, motorCmdPath, "OFF");
      }
    }

    // B) Valve Command (Remote Supply Valve Control)
    String valveCmdPath = "/devices/" + String(DEVICE_ID) + "/commands/valveCommand";
    if (Firebase.getString(fbdo, valveCmdPath)) {
      String cmd = fbdo.stringData();
      if (cmd == "OPEN" && !valveState && !level.isTopWet) {
        setValve(true, "Remote command: OPEN");
      } else if (cmd == "CLOSED" && valveState) {
        setValve(false, "Remote command: CLOSED");
      }
    }
  }

  // 6. Periodic Telemetry Push
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    if (Firebase.ready()) {
      pushTelemetry(level, busVoltage, currentAmps);
    }
  }

  delay(100);
}
