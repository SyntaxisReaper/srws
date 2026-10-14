import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function WaterUsageChart() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(6); // default to Sunday (today)

  const daysData = [
    { day: "Mon", fullDay: "Monday", liters: 42, runtimeMins: 16 },
    { day: "Tue", fullDay: "Tuesday", liters: 38, runtimeMins: 14 },
    { day: "Wed", fullDay: "Wednesday", liters: 52, runtimeMins: 20 },
    { day: "Thu", fullDay: "Thursday", liters: 40, runtimeMins: 15 },
    { day: "Fri", fullDay: "Friday", liters: 48, runtimeMins: 18 },
    { day: "Sat", fullDay: "Saturday", liters: 56, runtimeMins: 22 },
    { day: "Sun", fullDay: "Today (Sun)", liters: 34, runtimeMins: 12 },
  ];

  const maxLiters = Math.max(...daysData.map((d) => d.liters), 60);
  const totalLiters = daysData.reduce((acc, d) => acc + d.liters, 0);
  const dailyAverage = Math.round(totalLiters / daysData.length);
  const selectedDay = daysData[selectedDayIndex] || daysData[6];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Water Consumption</Text>
          <Text style={styles.cardSubtitle}>Household usage over the last 7 days</Text>
        </View>
        <View style={styles.efficiencyBadge}>
          <Text style={styles.efficiencyText}>🌿 EFFICIENT</Text>
        </View>
      </View>

      {/* Summary Stat Pills */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>7-DAY TOTAL</Text>
          <Text style={styles.statValue}>
            {totalLiters} <Text style={styles.statUnit}>Liters</Text>
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DAILY AVERAGE</Text>
          <Text style={styles.statValue}>
            {dailyAverage} <Text style={styles.statUnit}>L/day</Text>
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL CYCLES</Text>
          <Text style={styles.statValue}>
            14 <Text style={styles.statUnit}>fills</Text>
          </Text>
        </View>
      </View>

      {/* Selected Day Highlight Banner */}
      <View style={styles.dayDetailBanner}>
        <View style={styles.dayDetailLeft}>
          <Text style={styles.dayDetailTitle}>{selectedDay.fullDay}</Text>
          <Text style={styles.dayDetailSub}>
            Pump ran for {selectedDay.runtimeMins} mins across 2 auto-cycles
          </Text>
        </View>
        <View style={styles.dayDetailPill}>
          <Text style={styles.dayDetailPillNumber}>{selectedDay.liters}</Text>
          <Text style={styles.dayDetailPillUnit}>Liters</Text>
        </View>
      </View>

      {/* 7-Day Bar Chart */}
      <View style={styles.chartContainer}>
        {daysData.map((item, index) => {
          const isSelected = index === selectedDayIndex;
          const barHeightPercent = Math.round((item.liters / maxLiters) * 100);

          return (
            <TouchableOpacity
              key={item.day}
              style={styles.barColumn}
              onPress={() => setSelectedDayIndex(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.barLitersText, isSelected && styles.barLitersSelected]}>
                {item.liters}L
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${barHeightPercent}%` },
                    isSelected ? styles.barFillSelected : styles.barFillDefault,
                  ]}
                />
              </View>
              <View style={[styles.dayLabelContainer, isSelected && styles.dayLabelSelected]}>
                <Text style={[styles.dayLabelText, isSelected && styles.dayLabelTextSelected]}>
                  {item.day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
  efficiencyBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  efficiencyText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  statUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  dayDetailBanner: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  dayDetailLeft: {
    flex: 1,
    marginRight: 12,
  },
  dayDetailTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  dayDetailSub: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  dayDetailPill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  dayDetailPillNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  dayDetailPillUnit: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 3,
    opacity: 0.9,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barLitersText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  barLitersSelected: {
    color: "#0F172A",
    fontWeight: "900",
  },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  barFillDefault: {
    backgroundColor: "#93C5FD", // soft calm water blue
  },
  barFillSelected: {
    backgroundColor: "#000000", // crisp black accent on selection
  },
  dayLabelContainer: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  dayLabelSelected: {
    backgroundColor: "#000000",
  },
  dayLabelText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  dayLabelTextSelected: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
