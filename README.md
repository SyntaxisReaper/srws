# HydroNode — Smart Remote Water Supply & Motor Control System

An end-to-end IoT and mobile automation platform designed to monitor overhead water tanks, control pumping motors remotely, prevent overflows via automated cut-offs, detect dry-run motor faults, and send instant push notifications.

---

## 🚀 Key Features

* **Multi-Probe Contact Water Monitoring**: 3-probe conductive level detection (`Top: GPIO 5`, `Mid: GPIO 18`, `Low: GPIO 19`) using internal pull-ups for condensation-immune reliability.
* **Intelligent Debounced Auto Cut-Off**: Prevents tank overflows with a 1-second continuous debounce to eliminate false trips from water splashing or surface ripples.
* **Remote Water-Supply Valve Control**: Dedicated solenoid actuator channel on **GPIO 27** for opening and closing the municipal water inlet line remotely.
* **LR7843 MOSFET Pump Actuator**: Silent, solid-state switching for the 12V R385 diaphragm pump driven directly by 3.3V ESP32 logic.
* **INA226 Digital Current & Dry-Run Protection**: High-precision I²C current sensing detects dry-run conditions (< 0.2A after 3s startup inrush grace) and disengages power immediately.
* **Dual Wi-Fi & Mobile Hotspot Failover**: Automatic fallback to your smartphone's hotspot if venue Wi-Fi becomes unavailable.
* **Interactive Demo & Simulation Mode**: Built-in simulator allows testing the mobile interface and water flow without physical hardware.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Mobile App** | React Native (Expo SDK) | Android installable app (APK) & live control |
| **Firmware** | Arduino C++ (ESP32) | Sensor polling, relay control & safety cutoffs |
| **Realtime Cloud** | Firebase Realtime Database | Low-latency state synchronization |
| **Backend & Alerts** | Firebase Cloud Functions + FCM | Push notifications for alerts |

---

## 📂 Project Structure

```
├── firmware/
│   └── water_controller.ino     # ESP32 sketch (Sensors, Relay, Safety Cutoff)
├── functions/
│   ├── package.json             # Cloud Functions dependencies
│   └── index.js                 # Database change triggers & FCM notifications
├── mobile/                      # React Native Expo Mobile App (Android APK ready)
│   ├── App.js                   # Main application entry & dashboard
│   ├── app.json                 # Android package (com.starx.srws) & permissions
│   └── src/
│       ├── components/          # Water gauge, motor toggle, status, scheduler
│       ├── hooks/               # Telemetry and state hooks
│       └── services/            # Firebase RTDB connector & simulation store
└── README.md                    # Project documentation
```

---

## 📱 Mobile App Setup & Running

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npx expo start
   ```
   * Scan the QR code using the **Expo Go** app on Android to preview immediately.
   * Press `w` to open the web preview.

4. Build Installable Android APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```

---

## ⚡ ESP32 Hardware Pin Mapping

| Component | ESP32 GPIO | Direction / Mode | Description |
| :--- | :--- | :--- | :--- |
| **Contact Sensor Top Probe** | GPIO 5 | `INPUT_PULLUP` | Submerged = LOW (Tank Full ≥ 90%, Auto Pump OFF) |
| **Contact Sensor Mid Probe** | GPIO 18 | `INPUT_PULLUP` | Submerged = LOW (Tank at Medium ~60%) |
| **Contact Sensor Low Probe** | GPIO 19 | `INPUT_PULLUP` | Submerged = LOW (Low Water alert if dry / HIGH) |
| **LR7843 MOSFET #1 (Pump)** | GPIO 26 | `OUTPUT` | 3.3V Logic gate control for 12V R385 DC pump |
| **LR7843 MOSFET #2 (Valve)** | GPIO 27 | `OUTPUT` | Remote Water-Supply Solenoid Valve actuator |
| **INA226 SDA** | GPIO 21 | `I2C` | High-side current (< 0.2A dry-run fault) & bus voltage |
| **INA226 SCL** | GPIO 22 | `I2C` | I2C clock (shared with optional I2C LCD) |
| **YF-S201 Flow Sensor** | GPIO 23 | `INPUT_PULLUP` | Interrupt pulse counter (~2.25 mL/pulse) |
| **Active Buzzer** | GPIO 4 | `OUTPUT` | Audible alarm for tank full, low water, dry-run |
| **Power Supply** | Common GND / Vin | Power | 12V 5A adapter + Buck Converter (12V → 5V/3.3V) |

---

## 🛡️ License

This project is licensed under the MIT License.
