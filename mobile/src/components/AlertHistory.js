import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AlertHistory({ history = [] }) {
  const getEventBadge = (event) => {
    switch (event) {
      case "TANK_FULL":
        return { icon: "💧", color: "#16A34A", label: "Tank Full", bg: "#F0FDF4" };
      case "LOW_WATER":
        return { icon: "⚠️", color: "#DC2626", label: "Low Water", bg: "#FEF2F2" };
      case "MOTOR_FAULT":
        return { icon: "🚨", color: "#DC2626", label: "Safety Auto-Stop", bg: "#FEF2F2" };
      case "MOTOR_ON":
        return { icon: "⚡", color: "#0284C7", label: "Pump Started", bg: "#E0F2FE" };
      case "MOTOR_OFF":
        return { icon: "⏹️", color: "#64748B", label: "Pump Stopped", bg: "#F1F5F9" };
      default:
        return { icon: "ℹ️", color: "#64748B", label: event || "Event", bg: "#F1F5F9" };
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const safeHistory = Array.isArray(history)
    ? history
    : history && typeof history === "object"
    ? Object.keys(history)
        .map((key) => ({
          id: key,
          ...history[key],
          ts: history[key]?.ts || Number(key) || Date.now(),
        }))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    : [];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Activity History</Text>
          <Text style={styles.cardSubtitle}>Recent tank events and alerts</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{safeHistory.length} recorded</Text>
        </View>
      </View>

      {safeHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No recent activity recorded</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {safeHistory.slice(0, 5).map((item, index) => {
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
                    {item.note || `Water level at ${item.waterLevel ?? "--"}%`}
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  listContainer: {
    marginTop: 4,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
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
    marginRight: 8,
  },
  eventTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  eventLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  eventTime: {
    color: "#94A3B8",
    fontSize: 11,
  },
  eventNote: {
    color: "#64748B",
    fontSize: 12,
  },
  levelTag: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  levelTagText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700",
  },
});
