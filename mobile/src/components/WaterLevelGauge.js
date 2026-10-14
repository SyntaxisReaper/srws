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
      {/* Header - Bigger, Prominent & Highlighted */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Water Tank Level</Text>
          <Text style={styles.cardSubtitle}>
            {liters} of {capacityLiters} Liters available in tank
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: statusBadgeBg }]}>
          <View style={[styles.badgeDot, { backgroundColor: statusTextColor }]} />
          <Text style={[styles.badgeText, { color: statusTextColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Main Tank Visualizer */}
      <View style={styles.tankOuterContainer}>
        {/* Tank Pillar Graphic */}
        <View style={styles.tankFrame}>
          {/* Top Lid */}
          <View style={styles.tankLid} />

          {/* Liquid Chamber */}
          <View style={styles.tankInterior}>
            {/* Full Marker Line */}
            <View style={[styles.levelLine, { top: "12%" }]}>
              <View style={[styles.probeDot, (probeTop || waterLevel >= 90) && styles.probeDotWet]} />
              <View style={styles.markerBadge}>
                <Text style={styles.levelMarkerText}>Full (90%)</Text>
              </View>
            </View>

            {/* Half Marker Line */}
            <View style={[styles.levelLine, { top: "50%" }]}>
              <View style={[styles.probeDot, (probeMid || waterLevel >= 50) && styles.probeDotWet]} />
              <View style={styles.markerBadge}>
                <Text style={styles.levelMarkerText}>Half (50%)</Text>
              </View>
            </View>

            {/* Low Marker Line */}
            <View style={[styles.levelLine, { top: "80%" }]}>
              <View style={[styles.probeDot, (probeLow || waterLevel >= 20) && styles.probeDotWet]} />
              <View style={styles.markerBadge}>
                <Text style={styles.levelMarkerText}>Low (20%)</Text>
              </View>
            </View>

            {/* Fluid fill with smooth surface */}
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

          {/* Base */}
          <View style={styles.tankBase} />
        </View>

        {/* Readout Metrics - MASSIVE & HIGHLIGHTED */}
        <View style={styles.metricsColumn}>
          {/* Highlighted Percentage Hero Display */}
          <View style={styles.percentageHero}>
            <Text style={styles.percentageNumber}>{waterLevel}</Text>
            <Text style={styles.percentageSymbol}>%</Text>
          </View>

          {/* Volume Highlight Box */}
          <View style={styles.volumeBox}>
            <Text style={styles.volumeLabel}>Current Volume</Text>
            <Text style={styles.volumeValue}>
              {liters} <Text style={styles.volumeUnit}>Liters</Text>
            </Text>
          </View>

          {/* Sensor Points */}
          <View style={styles.sensorStatusBox}>
            <View style={styles.sensorRow}>
              <Text style={styles.sensorName}>Top Sensor:</Text>
              <Text style={[styles.sensorVal, probeTop ? styles.valActive : styles.valInactive]}>
                {probeTop ? "Reached" : "Clear"}
              </Text>
            </View>
            <View style={styles.sensorRow}>
              <Text style={styles.sensorName}>Middle Sensor:</Text>
              <Text style={[styles.sensorVal, probeMid ? styles.valActive : styles.valInactive]}>
                {probeMid ? "Reached" : "Clear"}
              </Text>
            </View>
            <View style={styles.sensorRow}>
              <Text style={styles.sensorName}>Bottom Sensor:</Text>
              <Text style={[styles.sensorVal, probeLow ? styles.valActive : styles.valInactive]}>
                {probeLow ? "Covered" : "Empty"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Level Adjust (for demo/simulation) - Black buttons with white text */}
      {onLevelAdjust && (
        <View style={styles.calibrationRow}>
          <Text style={styles.calibrationLabel}>Simulate Water Level:</Text>
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
              <Text style={styles.calBtnText}>Low (25%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => onLevelAdjust("MEDIUM")}
              activeOpacity={0.8}
            >
              <Text style={styles.calBtnText}>Mid (60%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => onLevelAdjust("FULL")}
              activeOpacity={0.8}
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
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
    fontSize: 20, // Bigger & prominent
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
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
    width: 120,
    height: 200,
    alignItems: "center",
  },
  tankLid: {
    width: 80,
    height: 9,
    backgroundColor: "#94A3B8",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tankInterior: {
    width: 110,
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  levelLine: {
    position: "absolute",
    left: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
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
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelMarkerText: {
    fontSize: 10,
    color: "#FFFFFF", // Sharp white text with dark backdrop pill for 100% readability
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
    width: 100,
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
    fontSize: 56, // MASSIVE HERO NUMBER
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
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
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
    fontSize: 18, // Highlighted volume
    fontWeight: "900",
    marginTop: 2,
  },
  volumeUnit: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  sensorStatusBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sensorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  sensorName: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  sensorVal: {
    fontSize: 11,
    fontWeight: "800",
  },
  valActive: {
    color: "#0EA5E9",
  },
  valInactive: {
    color: "#94A3B8",
  },
  calibrationRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  calibrationLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  calibrationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calBtn: {
    backgroundColor: "#000000",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
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
