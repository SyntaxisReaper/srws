import React, { useState } from "react";
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
  const [showSimControls, setShowSimControls] = useState(false);
  const liters = Math.round((waterLevel / 100) * capacityLiters);

  let statusLabel = "Normal Level";
  let statusBadgeBg = "#F0FDF4";
  let statusTextColor = "#16A34A";
  let waterColor = "#0EA5E9"; // Fresh vibrant sky blue

  if (probeTop || waterLevel >= 90) {
    statusLabel = "Tank Full";
    statusBadgeBg = "#F0FDF4";
    statusTextColor = "#16A34A";
    waterColor = "#10B981";
  } else if (!probeLow || waterLevel <= 20) {
    statusLabel = "Low Water";
    statusBadgeBg = "#FEF2F2";
    statusTextColor = "#DC2626";
    waterColor = "#EF4444";
  } else if (!probeMid || waterLevel < 50) {
    statusLabel = "Half Tank";
    statusBadgeBg = "#FFFBEB";
    statusTextColor = "#D97706";
    waterColor = "#38BDF8";
  }

  return (
    <View style={styles.card}>
      {/* Header - Prominent & Clear */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Water Tank Level</Text>
          <Text style={styles.cardSubtitle}>
            {liters} of {capacityLiters} Liters available in reservoir
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: statusBadgeBg }]}>
          <View style={[styles.badgeDot, { backgroundColor: statusTextColor }]} />
          <Text style={[styles.badgeText, { color: statusTextColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Main Tank Visualizer */}
      <View style={styles.tankOuterContainer}>
        {/* Modern Cylindrical Reservoir Graphic */}
        <View style={styles.tankFrame}>
          {/* Top Cap */}
          <View style={styles.tankLid} />

          {/* Transparent Reservoir Body */}
          <View style={styles.tankInterior}>
            {/* Gloss reflection highlight on left */}
            <View style={styles.glassHighlight} />

            {/* High-Contrast Level Markers */}
            <View style={[styles.levelLine, { top: "12%" }]}>
              <View style={[styles.probeDot, (probeTop || waterLevel >= 90) && styles.probeDotWet]} />
              <View style={styles.markerBadge}>
                <Text style={styles.levelMarkerText}>Full (90%)</Text>
              </View>
            </View>

            <View style={[styles.levelLine, { top: "50%" }]}>
              <View style={[styles.probeDot, (probeMid || waterLevel >= 50) && styles.probeDotWet]} />
              <View style={styles.markerBadge}>
                <Text style={styles.levelMarkerText}>Half (50%)</Text>
              </View>
            </View>

            <View style={[styles.levelLine, { top: "80%" }]}>
              <View style={[styles.probeDot, (probeLow || waterLevel >= 20) && styles.probeDotWet]} />
              <View style={styles.markerBadge}>
                <Text style={styles.levelMarkerText}>Low (20%)</Text>
              </View>
            </View>

            {/* Fluid with wave crest */}
            <View
              style={[
                styles.fluidFill,
                {
                  height: `${Math.min(100, Math.max(0, waterLevel))}%`,
                  backgroundColor: waterColor,
                },
              ]}
            >
              <View style={styles.fluidSurface} />
            </View>
          </View>

          {/* Sturdy Tank Stand Base */}
          <View style={styles.tankBase} />
        </View>

        {/* Readout Metrics */}
        <View style={styles.metricsColumn}>
          {/* Massive Hero Percentage */}
          <View style={styles.percentageHero}>
            <Text style={styles.percentageNumber}>{waterLevel}</Text>
            <Text style={styles.percentageSymbol}>%</Text>
          </View>

          {/* Highlighted Volume Card */}
          <View style={styles.volumeBox}>
            <View style={styles.volumeIconCircle}>
              <Text style={styles.volumeIcon}>💧</Text>
            </View>
            <View style={styles.volumeTextGroup}>
              <Text style={styles.volumeLabel}>Current Volume</Text>
              <Text style={styles.volumeValue}>
                {liters} <Text style={styles.volumeUnit}>/ {capacityLiters} Liters</Text>
              </Text>
            </View>
          </View>

          {/* Visual 3-Stage Sensor Level Indicators */}
          <View style={styles.stageIndicatorCard}>
            <View style={styles.stageRow}>
              <View style={[styles.stageDot, (probeTop || waterLevel >= 90) && styles.stageDotActive]} />
              <Text style={styles.stageLabel}>Upper Limit</Text>
              <Text style={[styles.stageValue, (probeTop || waterLevel >= 90) && styles.stageValActive]}>
                {probeTop || waterLevel >= 90 ? "Full Reached" : "Clear"}
              </Text>
            </View>
            <View style={styles.stageDivider} />
            <View style={styles.stageRow}>
              <View style={[styles.stageDot, (probeMid || waterLevel >= 50) && styles.stageDotActive]} />
              <Text style={styles.stageLabel}>Middle Level</Text>
              <Text style={[styles.stageValue, (probeMid || waterLevel >= 50) && styles.stageValActive]}>
                {probeMid || waterLevel >= 50 ? "Satisfied" : "Below Half"}
              </Text>
            </View>
            <View style={styles.stageDivider} />
            <View style={styles.stageRow}>
              <View style={[styles.stageDot, (probeLow || waterLevel >= 20) && styles.stageDotActive]} />
              <Text style={styles.stageLabel}>Safety Base</Text>
              <Text style={[styles.stageValue, (probeLow || waterLevel >= 20) && styles.stageValActive]}>
                {probeLow || waterLevel >= 20 ? "Safe (Water Present)" : "EMPTY CRITICAL"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Demo Level Controls Drawer */}
      {onLevelAdjust && (
        <View style={styles.demoSection}>
          <TouchableOpacity
            style={styles.demoToggleHeader}
            onPress={() => setShowSimControls(!showSimControls)}
            activeOpacity={0.7}
          >
            <Text style={styles.demoToggleText}>
              {showSimControls ? "Hide Level Simulator ▲" : "🧪 Test & Simulate Water Level ▼"}
            </Text>
          </TouchableOpacity>

          {showSimControls && (
            <View style={styles.calibrationButtons}>
              <TouchableOpacity
                style={styles.calBtn}
                onPress={() => onLevelAdjust("EMPTY")}
                activeOpacity={0.8}
              >
                <Text style={styles.calBtnText}>Empty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calBtn}
                onPress={() => onLevelAdjust("LOW")}
                activeOpacity={0.8}
              >
                <Text style={styles.calBtnText}>Low 25%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calBtn}
                onPress={() => onLevelAdjust("MEDIUM")}
                activeOpacity={0.8}
              >
                <Text style={styles.calBtnText}>Mid 60%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calBtn}
                onPress={() => onLevelAdjust("FULL")}
                activeOpacity={0.8}
              >
                <Text style={styles.calBtnText}>Full 100%</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  tankOuterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tankFrame: {
    width: 124,
    height: 208,
    alignItems: "center",
  },
  tankLid: {
    width: 86,
    height: 9,
    backgroundColor: "#94A3B8",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tankInterior: {
    width: 114,
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  glassHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 4,
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 3,
    zIndex: 15,
  },
  levelLine: {
    position: "absolute",
    left: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
  },
  probeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#94A3B8",
    marginRight: 5,
  },
  probeDotWet: {
    backgroundColor: "#0EA5E9",
  },
  markerBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelMarkerText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  fluidFill: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  fluidSurface: {
    height: 5,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  tankBase: {
    width: 104,
    height: 8,
    backgroundColor: "#64748B",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  metricsColumn: {
    flex: 1,
    marginLeft: 18,
    justifyContent: "center",
  },
  percentageHero: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  percentageNumber: {
    color: "#0F172A",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -1,
  },
  percentageSymbol: {
    color: "#0EA5E9",
    fontSize: 30,
    fontWeight: "900",
    marginLeft: 4,
  },
  volumeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  volumeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  volumeIcon: {
    fontSize: 16,
  },
  volumeTextGroup: {
    flex: 1,
  },
  volumeLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  volumeValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  volumeUnit: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  stageIndicatorCard: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    marginRight: 6,
  },
  stageDotActive: {
    backgroundColor: "#10B981",
  },
  stageLabel: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  stageValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  stageValActive: {
    color: "#0F172A",
  },
  stageDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 2,
  },
  demoSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  demoToggleHeader: {
    alignItems: "center",
    paddingVertical: 4,
  },
  demoToggleText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  calibrationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  calBtn: {
    backgroundColor: "#000000",
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 3,
    alignItems: "center",
  },
  calBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});
