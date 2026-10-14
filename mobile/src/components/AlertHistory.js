import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function AlertHistory({ history = [] }) {
  const [filter, setFilter] = useState("ALL"); // "ALL" | "WATER" | "PUMP" | "ALERTS"

  const getEventBadge = (event) => {
    switch (event) {
      case "TANK_FULL":
        return { icon: "💧", color: "#16A34A", label: "Tank Full Cutoff", bg: "#F0FDF4", category: "WATER" };
      case "LOW_WATER":
        return { icon: "⚠️", color: "#DC2626", label: "Low Water Warning", bg: "#FEF2F2", category: "ALERTS" };
      case "MOTOR_FAULT":
        return { icon: "🚨", color: "#DC2626", label: "Safety Auto-Stop", bg: "#FEF2F2", category: "ALERTS" };
      case "MOTOR_ON":
        return { icon: "⚡", color: "#0284C7", label: "Pump Started", bg: "#E0F2FE", category: "PUMP" };
      case "MOTOR_OFF":
        return { icon: "⏹️", color: "#64748B", label: "Pump Stopped", bg: "#F1F5F9", category: "PUMP" };
      default:
        return { icon: "ℹ️", color: "#64748B", label: event || "Event", bg: "#F1F5F9", category: "ALL" };
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

  const filteredHistory = safeHistory.filter((item) => {
    if (filter === "ALL") return true;
    const badge = getEventBadge(item.event);
    return badge.category === filter;
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Activity History</Text>
          <Text style={styles.cardSubtitle}>Audit trail of recent events and safety trips</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{safeHistory.length} Total</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === "ALL" && styles.filterChipActive]}
          onPress={() => setFilter("ALL")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>
            All ({safeHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === "WATER" && styles.filterChipActive]}
          onPress={() => setFilter("WATER")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === "WATER" && styles.filterTextActive]}>
            💧 Tank
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === "PUMP" && styles.filterChipActive]}
          onPress={() => setFilter("PUMP")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === "PUMP" && styles.filterTextActive]}>
            ⚡ Pump
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === "ALERTS" && styles.filterChipActive]}
          onPress={() => setFilter("ALERTS")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === "ALERTS" && styles.filterTextActive]}>
            ⚠️ Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {filteredHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No events recorded in this category</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredHistory.slice(0, 6).map((item, index) => {
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
    marginBottom: 16,
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
    marginTop: 3,
  },
  countBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  countText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  filterText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  eventIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 18,
  },
  eventDetails: {
    flex: 1,
    marginRight: 8,
  },
  eventTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  eventTime: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
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
    fontWeight: "800",
  },
});
