import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";

// Safely import ExpoSpeechRecognitionModule
let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = null;
try {
  const SpeechRec = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = SpeechRec.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = SpeechRec.useSpeechRecognitionEvent;
} catch (e) {
  // Graceful fallback if native module linking differs
}

export default function VoiceControlModal({
  visible = false,
  waterLevel = 60,
  motorRunning = false,
  valveOpen = false,
  capacityLiters = 20,
  onToggleMotor = () => {},
  onToggleValve = () => {},
  onClose = () => {},
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseMessage, setResponseMessage] = useState("Say a command or tap an example below");
  const [matchedAction, setMatchedAction] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const liters = Math.round((waterLevel / 100) * capacityLiters);

  // Pulse animation when listening
  useEffect(() => {
    let animation;
    if (isListening) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation && animation.stop();
  }, [isListening]);

  // Hook into native speech recognition events if available
  if (useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent("start", () => {
      setIsListening(true);
      setResponseMessage("Listening to your voice...");
    });

    useSpeechRecognitionEvent("end", () => {
      setIsListening(false);
    });

    useSpeechRecognitionEvent("result", (event) => {
      const recognized = event.results?.[0]?.transcript || "";
      if (recognized) {
        setTranscript(recognized);
        executeVoiceCommand(recognized);
      }
    });

    useSpeechRecognitionEvent("error", (event) => {
      setIsListening(false);
      setResponseMessage("Could not hear clearly. Please tap to try again or choose a shortcut.");
    });
  }

  // Speak aloud through speaker
  const speakResponse = (text) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.95,
      });
    } catch (err) {
      // Speech fallback
    }
  };

  // Natural Language Command Parser
  const executeVoiceCommand = (rawText) => {
    const text = (rawText || "").toLowerCase().trim();
    setTranscript(`"${rawText}"`);

    // 1. PUMP ON / START
    if (
      text.includes("start pump") ||
      text.includes("turn on pump") ||
      text.includes("turn on the pump") ||
      text.includes("pump on") ||
      text.includes("fill water") ||
      text.includes("refill tank") ||
      text.includes("start motor") ||
      text.includes("motor on") ||
      text.includes("start") ||
      text.includes("chalu")
    ) {
      if (waterLevel >= 90) {
        const spoken = "Tank is already full at 90 percent. Pump cannot be started to prevent overflow.";
        setResponseMessage("⚠️ Tank is already full (90%). Pump locked.");
        setMatchedAction("PUMP_LOCKED");
        speakResponse(spoken);
      } else {
        onToggleMotor("ON");
        const spoken = `Starting the water pump now. Tank is currently at ${waterLevel} percent.`;
        setResponseMessage("✓ Action: Water Pump Started");
        setMatchedAction("PUMP_ON");
        speakResponse(spoken);
      }
      return;
    }

    // 2. PUMP OFF / STOP
    if (
      text.includes("stop pump") ||
      text.includes("turn off pump") ||
      text.includes("turn off the pump") ||
      text.includes("pump off") ||
      text.includes("stop motor") ||
      text.includes("motor off") ||
      text.includes("stop") ||
      text.includes("band") ||
      text.includes("cut off")
    ) {
      onToggleMotor("OFF");
      const spoken = "Water pump stopped. Overflow safety guard is standing by.";
      setResponseMessage("✓ Action: Water Pump Stopped");
      setMatchedAction("PUMP_OFF");
      speakResponse(spoken);
      return;
    }

    // 3. OPEN WATER VALVE
    if (
      text.includes("open valve") ||
      text.includes("open water valve") ||
      text.includes("turn on valve") ||
      text.includes("valve on") ||
      text.includes("city water open") ||
      text.includes("supply on")
    ) {
      onToggleValve("OPEN");
      const spoken = "Water supply valve opened. Municipal city water is now flowing in.";
      setResponseMessage("✓ Action: Water Supply Valve Opened");
      setMatchedAction("VALVE_OPEN");
      speakResponse(spoken);
      return;
    }

    // 4. CLOSE WATER VALVE
    if (
      text.includes("close valve") ||
      text.includes("close water valve") ||
      text.includes("turn off valve") ||
      text.includes("valve off") ||
      text.includes("shut valve") ||
      text.includes("city water close") ||
      text.includes("supply off")
    ) {
      onToggleValve("CLOSED");
      const spoken = "Water supply valve closed. Municipal city line is shut.";
      setResponseMessage("✓ Action: Water Supply Valve Closed");
      setMatchedAction("VALVE_CLOSED");
      speakResponse(spoken);
      return;
    }

    // 5. WATER LEVEL & TANK STATUS
    if (
      text.includes("level") ||
      text.includes("water") ||
      text.includes("tank") ||
      text.includes("status") ||
      text.includes("how much")
    ) {
      const spoken = `Your water tank is at ${waterLevel} percent, with approximately ${liters} liters available.`;
      setResponseMessage(`✓ Tank Status: ${waterLevel}% (${liters} Liters available)`);
      setMatchedAction("STATUS_QUERY");
      speakResponse(spoken);
      return;
    }

    // Unrecognized command
    const spoken = "Command not recognized. You can say: Start Pump, Stop Pump, Open Valve, or Check Water Level.";
    setResponseMessage("❓ Didn't catch that. Say 'Start Pump', 'Stop Pump', or 'Water Level'.");
    setMatchedAction("UNKNOWN");
    speakResponse(spoken);
  };

  const handleStartListening = async () => {
    if (isListening) {
      if (ExpoSpeechRecognitionModule) {
        try {
          await ExpoSpeechRecognitionModule.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    if (ExpoSpeechRecognitionModule) {
      try {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (result.granted) {
          setIsListening(true);
          setResponseMessage("Listening... Say a command now");
          await ExpoSpeechRecognitionModule.start({
            lang: "en-US",
            interimResults: true,
          });
          return;
        }
      } catch (err) {
        // Fallback to manual simulation
      }
    }

    // Fallback if device SpeechRecognizer is unavailable
    setIsListening(true);
    setResponseMessage("Simulating voice listening for 3 seconds...");
    setTimeout(() => {
      setIsListening(false);
      executeVoiceCommand("start pump");
    }, 2800);
  };

  const handleShortcutPress = (command) => {
    executeVoiceCommand(command);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>🎙️</Text>
                <Text style={styles.title}>Voice Assistant</Text>
              </View>
              <Text style={styles.subtitle}>Speak hands-free to control your water pump</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Live Microphone Visualization */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  isListening && styles.pulseRingActive,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <TouchableOpacity
                style={[styles.micButton, isListening && styles.micButtonListening]}
                onPress={handleStartListening}
                activeOpacity={0.85}
              >
                <Text style={styles.micIconText}>{isListening ? "🛑" : "🎙️"}</Text>
              </TouchableOpacity>
              <Text style={styles.micStatusText}>
                {isListening ? "LISTENING... SPEAK NOW" : "TAP MICROPHONE TO SPEAK"}
              </Text>
            </View>

            {/* Transcript & Assistant Response Box */}
            <View style={styles.responseCard}>
              {transcript !== "" && (
                <Text style={styles.transcriptLabel}>You said: <Text style={styles.transcriptText}>{transcript}</Text></Text>
              )}
              <Text
                style={[
                  styles.responseMessage,
                  matchedAction?.startsWith("PUMP") || matchedAction?.startsWith("VALVE")
                    ? styles.responseSuccess
                    : matchedAction === "UNKNOWN"
                    ? styles.responseWarning
                    : null,
                ]}
              >
                {responseMessage}
              </Text>
            </View>

            {/* Quick 1-Tap Voice Shortcut Chips */}
            <Text style={styles.shortcutsHeader}>Or Tap Any Spoken Command:</Text>
            <View style={styles.shortcutsGrid}>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleShortcutPress("start pump")}
                activeOpacity={0.75}
              >
                <Text style={styles.shortcutIcon}>▶️</Text>
                <Text style={styles.shortcutText}>"Start Pump"</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleShortcutPress("stop pump")}
                activeOpacity={0.75}
              >
                <Text style={styles.shortcutIcon}>⏹️</Text>
                <Text style={styles.shortcutText}>"Stop Pump"</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleShortcutPress("open water valve")}
                activeOpacity={0.75}
              >
                <Text style={styles.shortcutIcon}>🚰</Text>
                <Text style={styles.shortcutText}>"Open Valve"</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleShortcutPress("check water level")}
                activeOpacity={0.75}
              >
                <Text style={styles.shortcutIcon}>💧</Text>
                <Text style={styles.shortcutText}>"Check Level"</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Close Action Button - SOLID BLACK with WHITE TEXT */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: "88%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 10,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  title: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "800",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  micSection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F1F5F9",
  },
  pulseRingActive: {
    backgroundColor: "#E2E8F0",
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  micButtonListening: {
    backgroundColor: "#0F172A",
    borderWidth: 3,
    borderColor: "#38BDF8",
  },
  micIconText: {
    fontSize: 32,
  },
  micStatusText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 14,
  },
  responseCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  transcriptLabel: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  transcriptText: {
    color: "#0F172A",
    fontWeight: "800",
    fontStyle: "italic",
  },
  responseMessage: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
  responseSuccess: {
    color: "#16A34A",
    fontWeight: "900",
  },
  responseWarning: {
    color: "#D97706",
  },
  shortcutsHeader: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
    marginBottom: 10,
    marginTop: 4,
  },
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  shortcutChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: "48%",
    marginBottom: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shortcutIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  shortcutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  doneBtn: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
