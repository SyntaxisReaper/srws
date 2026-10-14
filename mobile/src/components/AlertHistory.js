import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

export default function AlertHistory({ history = [] }) {
  const getEventBadge = (event) => {
    switch (event) {
      case "TANK_FULL":
        return { icon: "💧", color: "#10B981", label: "TANK FULL", bg: "rgba(16, 185, 129, 0.15)" };
      case "LOW_WATER":
        return { icon: "⚠️", color: "#EF4444", label: "LOW WATER", bg: "rgba(239, 68, 68, 0.15)" };
      case "MOTOR_FAULT":
        return { icon: "🚨", color: "#DC2626", label: "DRY-RUN FAULT", bg: "rgba(220, 38, 38, 0.2)" };
      case "MOTOR_ON":
        return { icon: "⚡", color: "#00D2FF", label: "MOTOR ON", bg: "rgba(0, 210, 255, 0.15)" };
      case "MOTOR_OFF":
        return { icon: "⏹️", color: "#9CA3AF", label: "MOTOR OFF", bg: "rgba(156, 163, 175, 0.15)" };
      default:
        return { icon: "ℹ️", color: "#9CA3AF", label: event, bg: "rgba(156, 163, 175, 0.15)" };
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>SYSTEM AUDIT TRAIL</Text>
          <Text style={styles.cardSubtitle}>Event & Alert History</Text>
        </View>
        <Text style={styles.countBadge}>{history.length} Events</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No alerts or events recorded yet</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {history.slice(0, 5).map((item, index) => {
            const badge = getEventBadge(item.event);
            return (
              <View key={item.id || index} style={styles.eventRow}>
                <View style={[styles.eventIconBox, { backgroundColor: badge.bg }]}>
                  <Text style={styles.eventIconText}>{badge.icon}</Text>
                </View>

                <View style={styles.eventDetails}>
                  <View style={styles.eventTopLine}>
                    <Text style={[styles.eventLabel, { color: badge.color }]}>{badge.label}</Text>
                    <Text style={styles.eventTime}>{formatTimestamp(item.ts)}</Text>
                  </View>
                  <Text style={styles.eventNote} numberOfLines={1}>
                    {item.note || `Motor: ${item.motorState} | Level: ${item.waterLevel}%`}
                  </Text>
                </View>

                {item.waterLevel !== undefined && (
                  <View style={styles.levelTag}>
                    <Text style={styles.levelTagText}>{item.waterLevel}%</Text>
                  </View>
                )}
              </View>
            );
          })}
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
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  countBadge: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    backgroundColor: "#1F2937",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listContainer: {
    gap: 10,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  eventIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 16,
  },
  eventDetails: {
    flex: 1,
  },
  eventTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  eventTime: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  eventNote: {
    fontSize: 11,
    color: "#D1D5DB",
    marginTop: 2,
  },
  levelTag: {
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  levelTagText: {
    color: "#00D2FF",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
  },
});
