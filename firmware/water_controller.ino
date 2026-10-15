#include <WiFi.h>
#include <time.h>
#include <Firebase_ESP_Client.h>

// Helper addons for token generation and RTDB helpers
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// ================ PIN CONFIGURATION ================
#define LM393_PIN       34  // Tank Full Digital Water Level Sensor
#define FC28_PIN        35  // Soil/Water Analog Moisture Sensor (0-100%)
#define BUZZER_PIN      32  // Alert Buzzer

#define MOTOR_ENA       27  // L298N / Driver Enable Pin
#define MOTOR_IN1       25  // Motor Driver IN1
#define MOTOR_IN2       26  // Motor Driver IN2

#define INA226_SDA      21  // I2C Current/Voltage Sensor SDA
#define INA226_SCL      22  // I2C Current/Voltage Sensor SCL

// ================ WI-FI CONFIGURATION ==============
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// ================ FIREBASE CONFIGURATION ============
#define API_KEY         "YOUR_FIREBASE_WEB_API_KEY"
#define DATABASE_URL    "https://YOUR_PROJECT-default-rtdb.firebaseio.com/"
#define USER_EMAIL      "YOUR_FIREBASE_USER_EMAIL"
#define USER_PASSWORD   "YOUR_FIREBASE_USER_PASSWORD"

// ================ DEVICE & DATABASE PATHS ==========
#define DEVICE_ID          "device_001"
#define PATH_COMMAND_MOTOR "/devices/" DEVICE_ID "/commands/motorCommand"
#define PATH_STATUS_PUMP   "/devices/" DEVICE_ID "/status/motorRunning"
#define PATH_STATUS_FULL   "/devices/" DEVICE_ID "/status/probeTop"
#define PATH_STATUS_LEVEL  "/devices/" DEVICE_ID "/status/waterLevel"
#define PATH_STATUS_SEEN   "/devices/" DEVICE_ID "/status/lastSeen"
#define PATH_STATUS_WIFI   "/devices/" DEVICE_ID "/status/wifiStrength"
#define PATH_STATUS_ONLINE "/devices/" DEVICE_ID "/status/isOnline"
#define PATH_STATUS_ROOT   "/devices/" DEVICE_ID "/status"
#define PATH_SCHEDULE_ENABLED  "/devices/" DEVICE_ID "/schedule/enabled"
#define PATH_SCHEDULE_ON_TIME  "/devices/" DEVICE_ID "/schedule/onTime"
#define PATH_SCHEDULE_OFF_TIME "/devices/" DEVICE_ID "/schedule/offTime"

// ================ SCHEDULE CONFIGURATION ============
struct Schedule {
  bool enabled;
  int onHour;
  int onMin;
  int offHour;
  int offMin;
};

Schedule currentSchedule = {
  true,
  6, 0,   // 06:00 AM Default
  6, 30   // 06:30 AM Default
};

unsigned long lastScheduleSync = 0;
const unsigned long SCHEDULE_SYNC_INTERVAL = 30000; // Check Firebase schedule every 30s
int lastScheduledOnMinute = -1;
int lastScheduledOffMinute = -1;

// ================ SENSOR CONFIGURATION ==============
#define FULL_LEVEL_ACTIVE_LOW true
#define ENABLE_AUTO_FILL false

// ================ FIREBASE OBJECTS ==================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool firebaseReady = false;

// ================ STATE =============================
bool pumpOn = false;
bool manualStop = true;
bool tankFull = false;

int fc28Value = 0;
int lm393Value = HIGH;
int waterLevelPercent = 0;

unsigned long lastSensor = 0;
unsigned long lastPrint = 0;
unsigned long lastFirebase = 0;
unsigned long lastWiFiAttempt = 0;

const unsigned long SENSOR_INTERVAL = 100;
const unsigned long PRINT_INTERVAL = 1000;
const unsigned long FIREBASE_INTERVAL = 1500;

// ================ PUMP CONTROL ======================
void setPump(bool on) {
  // Full-level protection always overrides a START request.
  if (on && tankFull) {
    on = false;
  }

  pumpOn = on;

  if (pumpOn) {
    digitalWrite(MOTOR_IN1, HIGH);
    digitalWrite(MOTOR_IN2, LOW);
    digitalWrite(MOTOR_ENA, HIGH);
  } else {
    digitalWrite(MOTOR_ENA, LOW);
    digitalWrite(MOTOR_IN1, LOW);
    digitalWrite(MOTOR_IN2, LOW);
  }

  Serial.print("Pump: ");
  Serial.println(pumpOn ? "ON" : "OFF");
}

// ================ SENSOR READING ====================
void updateSensors() {
  lm393Value = digitalRead(LM393_PIN);
  bool rawFull = FULL_LEVEL_ACTIVE_LOW
                 ? (lm393Value == LOW)
                 : (lm393Value == HIGH);

  // Splash debounce: require 1000ms continuous submerged contact before confirming tank-full
  static unsigned long fullDetectionStart = 0;
  const unsigned long FULL_DEBOUNCE_MS = 1000;

  if (rawFull) {
    if (fullDetectionStart == 0) {
      fullDetectionStart = millis();
    } else if (millis() - fullDetectionStart >= FULL_DEBOUNCE_MS) {
      tankFull = true;
    }
  } else {
    fullDetectionStart = 0;
    tankFull = false;
  }

  fc28Value = analogRead(FC28_PIN);

  // Map analog sensor to estimated water level percentage (0-100%)
  int rawPercent = map(fc28Value, 4095, 1200, 0, 100);
  rawPercent = constrain(rawPercent, 0, 100);

  // Exponential Moving Average (EMA) smoothing filter to eliminate ADC fluctuations
  static float smoothedLevelPercent = -1.0;
  if (smoothedLevelPercent < 0) {
    smoothedLevelPercent = rawPercent;
  } else {
    smoothedLevelPercent = (smoothedLevelPercent * 0.85f) + (rawPercent * 0.15f);
  }
  waterLevelPercent = round(smoothedLevelPercent);

  // Full-level cutoff always takes priority
  if (tankFull && pumpOn) {
    setPump(false);
    manualStop = true;
    Serial.println("ALERT: FULL LEVEL - PUMP STOPPED");
    // Clear command in Firebase so pump doesn't auto-restart when bottle is emptied!
    if (Firebase.ready()) {
      Firebase.RTDB.setString(&fbdo, PATH_COMMAND_MOTOR, "OFF");
    }
  }

  digitalWrite(BUZZER_PIN, tankFull ? HIGH : LOW);

  if (ENABLE_AUTO_FILL && !manualStop && !tankFull) {
    setPump(true);
  }
}

// ================ WI-FI & TIME ======================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ Wi-Fi connected! IP: " + WiFi.localIP().toString());

    // Synchronize system clock with NTP in IST (UTC+5:30 = 19800s offset)
    Serial.print("Synchronizing NTP time (IST UTC+5:30)...");
    configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
    time_t now = time(nullptr);
    int retries = 0;
    while (now < 1510592825 && retries < 20) {
      delay(250);
      Serial.print(".");
      now = time(nullptr);
      retries++;
    }
    Serial.println(" Time Synchronized!");
  } else {
    Serial.println("\nWi-Fi unavailable; local safety guards active.");
  }
}

// ================ FIREBASE SETUP ====================
void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.reconnectWiFi(true);
  fbdo.setResponseSize(4096);
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);

  Serial.println("Firebase authentication started...");
}

// ================ PUBLISH TELEMETRY =================
void publishStatus() {
  if (!Firebase.ready() || WiFi.status() != WL_CONNECTED) {
    return;
  }

  time_t now = time(nullptr);
  double epochMs = (double)now * 1000.0;

  // Atomic RTDB update using FirebaseJson to minimize network round-trips and loop blocking
  FirebaseJson json;
  json.set("motorRunning", pumpOn);
  json.set("probeTop", tankFull);
  json.set("waterLevel", waterLevelPercent);
  json.set("wifiStrength", WiFi.RSSI());
  json.set("isOnline", true);

  // Heartbeat timestamp so the mobile app stays permanently online
  if (now > 100000) {
    json.set("lastSeen", epochMs);
  }

  if (!Firebase.RTDB.updateNode(&fbdo, PATH_STATUS_ROOT, &json)) {
    Serial.print("Firebase write notice: ");
    Serial.println(fbdo.errorReason());
  }
}

// ================ REMOTE COMMANDS ===================
void checkFirebaseCommand() {
  if (!Firebase.ready() || WiFi.status() != WL_CONNECTED) {
    return;
  }

  // Listen to mobile app pump toggle command
  if (Firebase.RTDB.getString(&fbdo, PATH_COMMAND_MOTOR)) {
    String cmd = fbdo.stringData();
    cmd.trim();
    cmd.toUpperCase();

    if (cmd == "ON" || cmd == "START") {
      updateSensors();
      if (!tankFull && !pumpOn) {
        manualStop = false;
        setPump(true);
      } else if (tankFull) {
        // Tank is full! Refuse to start and reset command to OFF in Firebase
        Serial.println("Cannot start: Tank is full! Resetting command to OFF.");
        Firebase.RTDB.setString(&fbdo, PATH_COMMAND_MOTOR, "OFF");
      }
    } else if (cmd == "OFF" || cmd == "STOP") {
      if (pumpOn) {
        manualStop = true;
        setPump(false);
      }
    }
  }
}

// ================ SCHEDULE MANAGEMENT ================
void fetchSchedule() {
  if (!Firebase.ready() || WiFi.status() != WL_CONNECTED) {
    return;
  }

  // 1. Fetch enabled flag
  if (Firebase.RTDB.getBool(&fbdo, PATH_SCHEDULE_ENABLED)) {
    currentSchedule.enabled = fbdo.boolData();
  }

  // 2. Fetch onTime (e.g. "06:00")
  if (Firebase.RTDB.getString(&fbdo, PATH_SCHEDULE_ON_TIME)) {
    String t = fbdo.stringData();
    t.trim();
    int colon = t.indexOf(':');
    if (colon > 0) {
      currentSchedule.onHour = t.substring(0, colon).toInt();
      currentSchedule.onMin = t.substring(colon + 1).toInt();
    }
  }

  // 3. Fetch offTime (e.g. "06:30")
  if (Firebase.RTDB.getString(&fbdo, PATH_SCHEDULE_OFF_TIME)) {
    String t = fbdo.stringData();
    t.trim();
    int colon = t.indexOf(':');
    if (colon > 0) {
      currentSchedule.offHour = t.substring(0, colon).toInt();
      currentSchedule.offMin = t.substring(colon + 1).toInt();
    }
  }

  Serial.print("Schedule synced: ");
  Serial.print(currentSchedule.enabled ? "ENABLED" : "DISABLED");
  Serial.print(" | ON: ");
  Serial.print(currentSchedule.onHour < 10 ? "0" : "");
  Serial.print(currentSchedule.onHour);
  Serial.print(":");
  Serial.print(currentSchedule.onMin < 10 ? "0" : "");
  Serial.print(currentSchedule.onMin);
  Serial.print(" | OFF: ");
  Serial.print(currentSchedule.offHour < 10 ? "0" : "");
  Serial.print(currentSchedule.offHour);
  Serial.print(":");
  Serial.print(currentSchedule.offMin < 10 ? "0" : "");
  Serial.println(currentSchedule.offMin);
}

void checkSchedule() {
  if (!currentSchedule.enabled) {
    return;
  }

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return;
  }

  int curHour = timeinfo.tm_hour;
  int curMin  = timeinfo.tm_min;

  bool isOnTime  = (curHour == currentSchedule.onHour  && curMin == currentSchedule.onMin);
  bool isOffTime = (curHour == currentSchedule.offHour && curMin == currentSchedule.offMin);

  // 1. Scheduled Turn ON: Runs once at the scheduled ON minute if tank is not full
  if (isOnTime && curMin != lastScheduledOnMinute) {
    lastScheduledOnMinute = curMin;
    updateSensors();
    if (!tankFull && !pumpOn) {
      Serial.println("⏰ [SCHEDULE] Scheduled ON time reached. Starting pump...");
      manualStop = false;
      setPump(true);
      if (Firebase.ready()) {
        Firebase.RTDB.setString(&fbdo, PATH_COMMAND_MOTOR, "ON");
      }
    } else if (tankFull) {
      Serial.println("⏰ [SCHEDULE] Scheduled ON time reached, but tank is FULL. Refusing start.");
    }
  }

  // 2. Scheduled Turn OFF: Runs once at the scheduled OFF minute if pump is running
  if (isOffTime && curMin != lastScheduledOffMinute) {
    lastScheduledOffMinute = curMin;
    if (pumpOn) {
      Serial.println("⏰ [SCHEDULE] Scheduled OFF time reached. Stopping pump...");
      manualStop = true;
      setPump(false);
      if (Firebase.ready()) {
        Firebase.RTDB.setString(&fbdo, PATH_COMMAND_MOTOR, "OFF");
      }
    }
  }
}

// ================ SETUP =============================
void setup() {
  Serial.begin(115200);
  delay(1200); // Allow USB-UART bridge to settle

  Serial.println("\n==================================");
  Serial.println("   HYDRONODE HARDWARE CONTROLLER   ");
  Serial.println("==================================");

  // Sensor inputs
  pinMode(LM393_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Motor outputs
  pinMode(MOTOR_ENA, OUTPUT);
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);

  digitalWrite(MOTOR_ENA, LOW);
  digitalWrite(MOTOR_IN1, LOW);
  digitalWrite(MOTOR_IN2, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  analogReadResolution(12);

  updateSensors();
  setPump(false);

  connectWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    setupFirebase();
    firebaseReady = true;
    fetchSchedule();
  }
}

// ================ MAIN LOOP =========================
void loop() {
  // 1. Local hardware safety checks
  if (millis() - lastSensor >= SENSOR_INTERVAL) {
    lastSensor = millis();
    updateSensors();
  }

  // 2. Wi-Fi reconnection handling
  if (WiFi.status() != WL_CONNECTED && millis() - lastWiFiAttempt >= 10000) {
    lastWiFiAttempt = millis();
    WiFi.reconnect();
  }

  // 3. Local schedule evaluation (runs with local hardware RTC)
  checkSchedule();

  // 4. Firebase cloud sync
  if (WiFi.status() == WL_CONNECTED && firebaseReady && millis() - lastFirebase >= FIREBASE_INTERVAL) {
    lastFirebase = millis();
    checkFirebaseCommand();
    publishStatus();
  }

  // 5. Firebase schedule sync (periodically sync schedule changes made from mobile app)
  if (WiFi.status() == WL_CONNECTED && firebaseReady && millis() - lastScheduleSync >= SCHEDULE_SYNC_INTERVAL) {
    lastScheduleSync = millis();
    fetchSchedule();
  }

  // 6. Debug prints
  if (millis() - lastPrint >= PRINT_INTERVAL) {
    lastPrint = millis();
    Serial.print("Level: ");
    Serial.print(waterLevelPercent);
    Serial.print("% | TankFull: ");
    Serial.print(tankFull ? "YES" : "NO");
    Serial.print(" | Pump: ");
    Serial.println(pumpOn ? "ON" : "OFF");
  }
}
