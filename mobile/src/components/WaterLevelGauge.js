import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function WaterLevelGauge({
  waterLevel = 60,
  levelState = "MEDIUM",
  probeTop = false,
  probeMid = true,
  probeLow = true,
  tankHeight = 30,
  capacityLiters = 20,
  onLevelAdjust = null,
}) {
  const liters = Math.round((waterLevel / 100) * capacityLiters);

  // Status color logic based on levelState and contact probes
  let themeColor = "#00D2FF";
  let statusBadge = levelState || "MEDIUM";
  let statusBg = "rgba(0, 210, 255, 0.15)";

  if (probeTop || waterLevel >= 90) {
    themeColor = "#10B981"; // Emerald green for full
    statusBadge = "TANK FULL";
    statusBg = "rgba(16, 185, 129, 0.15)";
  } else if (!probeLow || waterLevel <= 0) {
    themeColor = "#EF4444"; // Crimson alert for empty
    statusBadge = "TANK EMPTY";
    statusBg = "rgba(239, 68, 68, 0.2)";
  } else if (!probeMid) {
    themeColor = "#F59E0B"; // Amber for low
    statusBadge = "LOW WATER";
    statusBg = "rgba(245, 158, 11, 0.15)";
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>OVERHEAD WATER TANK</Text>
          <Text style={styles.cardSubtitle}>Contact Probe Multi-Level Sensor</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusBg, borderColor: themeColor }]}>
          <View style={[styles.badgeDot, { backgroundColor: themeColor }]} />
          <Text style={[styles.badgeText, { color: themeColor }]}>{statusBadge}</Text>
        </View>
      </View>

      {/* Main Tank Visualizer */}
      <View style={styles.tankOuterContainer}>
        {/* Tank Pillar Frame */}
        <View style={styles.tankFrame}>
          {/* Top Tank Lid */}
          <View style={styles.tankLid} />

          {/* Liquid Chamber */}
          <View style={styles.tankInterior}>
            {/* Top Probe Level Line */}
            <View style={[styles.levelLine, { top: "10%" }]}>
              <View style={[styles.probeIndicator, probeTop && styles.probeIndicatorWet]} />
              <Text style={styles.levelMarkerText}>Top (GPIO 5)</Text>
            </View>

            {/* Mid Probe Level Line */}
            <View style={[styles.levelLine, { top: "45%" }]}>
              <View style={[styles.probeIndicator, probeMid && styles.probeIndicatorWet]} />
              <Text style={styles.levelMarkerText}>Mid (GPIO 18)</Text>
            </View>

            {/* Low Probe Level Line */}
            <View style={[styles.levelLine, { top: "80%" }]}>
              <View style={[styles.probeIndicator, probeLow && styles.probeIndicatorWet]} />
              <Text style={styles.levelMarkerText}>Low (GPIO 19)</Text>
            </View>

            {/* Dynamic Water Fluid Fill */}
            <View
              style={[
                styles.fluidFill,
                {
                  height: `${waterLevel}%`,
                  backgroundColor: themeColor,
                },
              ]}
            >
              <View style={styles.fluidSurface} />
            </View>
          </View>

          {/* Tank Base */}
          <View style={styles.tankBase} />
        </View>

        {/* Readout Metrics */}
        <View style={styles.metricsColumn}>
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageNumber, { color: themeColor }]}>{waterLevel}</Text>
            <Text style={[styles.percentageSymbol, { color: themeColor }]}>%</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Approx. Volume</Text>
            <Text style={styles.metricValue}>
              {liters} <Text style={styles.metricUnit}>/ {capacityLiters} L</Text>
            </Text>
          </View>

          {/* Probe Status Matrix */}
          <View style={styles.probeStatusBox}>
            <Text style={styles.probeBoxTitle}>PROBE SIGNALS (3.3V PULLUP)</Text>
            <View style={styles.probeRow}>
              <Text style={styles.probeName}>Top Probe:</Text>
              <Text style={[styles.probeVal, probeTop ? styles.valWet : styles.valDry]}>
                {probeTop ? "SUBMERGED (LOW)" : "DRY (HIGH)"}
              </Text>
            </View>
            <View style={styles.probeRow}>
              <Text style={styles.probeName}>Mid Probe:</Text>
              <Text style={[styles.probeVal, probeMid ? styles.valWet : styles.valDry]}>
                {probeMid ? "SUBMERGED (LOW)" : "DRY (HIGH)"}
              </Text>
            </View>
            <View style={styles.probeRow}>
              <Text style={styles.probeName}>Low Probe:</Text>
              <Text style={[styles.probeVal, probeLow ? styles.valWet : styles.valDry]}>
                {probeLow ? "SUBMERGED (LOW)" : "DRY (HIGH)"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Level Test (Simulation & Bench Calibration) */}
      {onLevelAdjust && (
        <View style={styles.calibrationRow}>
          <Text style={styles.calibrationLabel}>Simulate Level:</Text>
          <View style={styles.calibrationButtons}>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => onLevelAdjust("EMPTY")}
              activeOpacity={0.7}
            >
              <Text style={styles.calBtnText}>Empty</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => onLevelAdjust("LOW")}
              activeOpacity={0.7}
            >
              <Text style={styles.calBtnText}>Low (25%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => onLevelAdjust("MEDIUM")}
              activeOpacity={0.7}
            >
              <Text style={styles.calBtnText}>Mid (60%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => onLevelAdjust("FULL")}
              activeOpacity={0.7}
            >
              <Text style={styles.calBtnText}>Full (100%)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardSubtitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tankOuterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tankFrame: {
    width: 100,
    alignItems: "center",
  },
  tankLid: {
    width: 80,
    height: 8,
    backgroundColor: "#374151",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tankInterior: {
    width: 90,
    height: 180,
    backgroundColor: "#1F2937",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#374151",
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  tankBase: {
    width: 100,
    height: 10,
    backgroundColor: "#374151",
    borderRadius: 4,
    marginTop: 2,
  },
  levelLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
    zIndex: 2,
    paddingLeft: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  probeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6B7280",
    marginRight: 4,
    marginTop: -6,
  },
  probeIndicatorWet: {
    backgroundColor: "#00D2FF",
  },
  levelMarkerText: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
    marginTop: -8,
  },
  fluidFill: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  fluidSurface: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  metricsColumn: {
    flex: 1,
    paddingLeft: 18,
    justifyContent: "center",
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  percentageNumber: {
    fontSize: 44,
    fontWeight: "900",
  },
  percentageSymbol: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 2,
  },
  metricItem: {
    marginBottom: 10,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  metricValue: {
    color: "#F3F4F6",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
  },
  metricUnit: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "400",
  },
  probeStatusBox: {
    backgroundColor: "#1F2937",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  probeBoxTitle: {
    color: "#9CA3AF",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  probeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 1,
  },
  probeName: {
    color: "#D1D5DB",
    fontSize: 9,
    fontWeight: "500",
  },
  probeVal: {
    fontSize: 9,
    fontWeight: "700",
  },
  valWet: {
    color: "#10B981",
  },
  valDry: {
    color: "#9CA3AF",
  },
  calibrationRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calibrationLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  calibrationButtons: {
    flexDirection: "row",
    gap: 6,
  },
  calBtn: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#374151",
  },
  calBtnText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
  },
});
