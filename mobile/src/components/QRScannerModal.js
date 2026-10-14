import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { claimDevice } from "../services/deviceService";

export default function QRScannerModal({
  visible = false,
  currentDeviceId = "device_001",
  useSimulation = false,
  onClose = () => {},
  onDevicePaired = () => {},
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusState, setStatusState] = useState(null); // { type: 'success' | 'error', message: string }
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setScanned(false);
      setStatusState(null);
      setIsSubmitting(false);
      setManualInput("");
    }
  }, [visible]);

  const handleProcessDeviceId = async (rawCode) => {
    if (scanned || isSubmitting) return;
    setScanned(true);
    setIsSubmitting(true);
    setStatusState(null);

    let deviceId = (rawCode || "").trim();

    // Check if raw data is a JSON payload: {"deviceId":"device_001"}
    if (deviceId.startsWith("{") && deviceId.endsWith("}")) {
      try {
        const parsed = JSON.parse(deviceId);
        if (parsed.deviceId) {
          deviceId = parsed.deviceId;
        }
      } catch (e) {
        // Fall back to plain string
      }
    }

    if (!deviceId) {
      setStatusState({
        type: "error",
        message: "Invalid QR code format. Please scan a valid HydroNode QR code.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await claimDevice(deviceId, "homeowner_primary", "HydroNode Tank", useSimulation);
      setStatusState({
        type: "success",
        message: `Successfully linked ${deviceId} to your account!`,
      });

      setTimeout(() => {
        onDevicePaired(deviceId);
        onClose();
      }, 1600);
    } catch (err) {
      setStatusState({
        type: "error",
        message: err.message || "Failed to pair unit. Please check network connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    if (!scanned && data) {
      handleProcessDeviceId(data);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setStatusState({
        type: "error",
        message: "Please enter a valid Device ID (e.g. device_001)",
      });
      return;
    }
    handleProcessDeviceId(manualInput.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Pair HydroNode Unit</Text>
            <Text style={styles.headerSub}>Scan QR Code on Enclosure</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleModeBtn}
            onPress={() => setManualMode(!manualMode)}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleModeText}>{manualMode ? "📷 CAMERA" : "⌨️ MANUAL"}</Text>
          </TouchableOpacity>
        </View>

        {/* Status Notification Banner */}
        {statusState && (
          <View
            style={[
              styles.statusBanner,
              statusState.type === "success" ? styles.statusSuccess : styles.statusError,
            ]}
          >
            <Text style={styles.statusIcon}>
              {statusState.type === "success" ? "✓" : "⚠️"}
            </Text>
            <Text style={styles.statusText}>{statusState.message}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Verifying unit ownership with Firebase...</Text>
          </View>
        )}

        {manualMode ? (
          /* Manual ID Entry View */
          <View style={styles.manualContainer}>
            <View style={styles.manualCard}>
              <Text style={styles.manualTitle}>Enter Unit Identifier</Text>
              <Text style={styles.manualDesc}>
                Type the Device ID printed underneath the QR code on your HydroNode enclosure.
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="e.g. device_001"
                placeholderTextColor="#94A3B8"
                value={manualInput}
                onChangeText={setManualInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Quick suggestion chips */}
              <Text style={styles.quickLabel}>Quick Presets:</Text>
              <View style={styles.quickChipsRow}>
                {["device_001", "device_002", "hydronode_001"].map((id) => (
                  <TouchableOpacity
                    key={id}
                    style={styles.chip}
                    onPress={() => setManualInput(id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleManualSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>LINK & PAIR UNIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !permission ? (
          /* Permission Request View */
          <View style={styles.permissionContainer}>
            <Text style={styles.permIcon}>📷</Text>
            <Text style={styles.permTitle}>Camera Permission Required</Text>
            <Text style={styles.permDesc}>
              HydroNode needs camera access to scan device QR codes and pair your water tank controller.
            </Text>
            <TouchableOpacity
              style={styles.permBtn}
              onPress={requestPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.permBtnText}>GRANT CAMERA ACCESS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fallbackLink}
              onPress={() => setManualMode(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.fallbackLinkText}>Or Enter Device ID Manually →</Text>
            </TouchableOpacity>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permIcon}>🔒</Text>
            <Text style={styles.permTitle}>Camera Access Denied</Text>
            <Text style={styles.permDesc}>
              Camera access was denied. You can still link your unit manually by entering its Device ID.
            </Text>
            <TouchableOpacity
              style={styles.permBtn}
              onPress={() => setManualMode(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.permBtnText}>ENTER DEVICE ID MANUALLY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Live Camera Scanning View */
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Visual Reticle Overlay */}
            <View style={styles.scannerOverlay}>
              <View style={styles.scanTarget}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.targetHint}>
                Align QR code within the frame to pair
              </Text>
            </View>

            {/* Bottom Actions */}
            {scanned && statusState?.type === "error" && (
              <View style={styles.retryBottomBox}>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => {
                    setScanned(false);
                    setStatusState(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retryBtnText}>🔄 SCAN AGAIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 28) + 10 : 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#000000",
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  headerTitleCol: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  headerSub: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  toggleModeBtn: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  toggleModeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanTarget: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  targetHint: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 28,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    zIndex: 20,
  },
  statusSuccess: {
    backgroundColor: "#16A34A",
  },
  statusError: {
    backgroundColor: "#DC2626",
  },
  statusIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  loadingOverlay: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  permIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  permTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  permDesc: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  permBtn: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  permBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  fallbackLink: {
    marginTop: 20,
    padding: 10,
  },
  fallbackLinkText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "700",
  },
  manualContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  manualCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  manualTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  manualDesc: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#000000",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 14,
  },
  quickLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  chipText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  retryBottomBox: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  retryBtn: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
