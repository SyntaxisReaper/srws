import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";

export default function SchedulerPanel({
  scheduledOn = "06:00",
  scheduledOff = "06:30",
  autoMode = true,
  onSaveSchedule = () => {},
}) {
  const [isAuto, setIsAuto] = useState(autoMode);
  const [selectedPreset, setSelectedPreset] = useState("morning");
  const [activeDays, setActiveDays] = useState(["M", "T", "W", "Th", "F", "Sa", "Su"]);

  const daysList = [
    { id: "M", label: "M" },
    { id: "T", label: "T" },
    { id: "W", label: "W" },
    { id: "Th", label: "T" },
    { id: "F", label: "F" },
    { id: "Sa", label: "S" },
    { id: "Su", label: "S" },
  ];

  const toggleDay = (dayId) => {
    if (activeDays.includes(dayId)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== dayId));
      }
    } else {
      setActiveDays([...activeDays, dayId]);
    }
  };

  const handleToggleAuto = (val) => {
    setIsAuto(val);
    onSaveSchedule({ autoMode: val });
  };

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset);
    if (preset === "morning") {
      onSaveSchedule({ scheduledOn: "06:00", scheduledOff: "06:30" });
    } else if (preset === "evening") {
      onSaveSchedule({ scheduledOn: "18:00", scheduledOff: "18:30" });
    } else if (preset === "afternoon") {
      onSaveSchedule({ scheduledOn: "13:30", scheduledOff: "13:50" });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Automatic Refill</Text>
          <Text style={styles.cardSubtitle}>Smart level management & daily schedules</Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{isAuto ? "ENABLED" : "OFF"}</Text>
          <Switch
            value={isAuto}
            onValueChange={handleToggleAuto}
            trackColor={{ false: "#E2E8F0", true: "#000000" }}
            thumbColor={isAuto ? "#FFFFFF" : "#94A3B8"}
          />
        </View>
      </View>

      {/* Auto Logic Explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          {isAuto
            ? "Auto Mode: Automatically fills your tank whenever water is low (≤ 20%) and safely stops when full (≥ 90%)."
            : "Manual Mode: Operates strictly when you tap the Start button or during scheduled daily times."}
        </Text>
      </View>

      {/* Next Scheduled Timer Status Card */}
      <View style={styles.nextRunCard}>
        <View style={styles.nextRunLeft}>
          <Text style={styles.nextRunLabel}>NEXT SCHEDULED FILL</Text>
          <Text style={styles.nextRunTime}>
            {selectedPreset === "morning"
              ? "Tomorrow at 06:00 AM (30 min)"
              : selectedPreset === "evening"
              ? "Today at 06:00 PM (30 min)"
              : "Today at 01:30 PM (20 min)"}
          </Text>
        </View>
        <View style={styles.nextRunBadge}>
          <Text style={styles.nextRunBadgeText}>{isAuto ? "Active" : "Paused"}</Text>
        </View>
      </View>

      {/* Visual 24-Hour Timeline Bar */}
      <View style={styles.timelineSection}>
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineLabel}>24-HOUR FILL TIMELINE</Text>
          <Text style={styles.timelineSub}>Scheduled windows highlighted</Text>
        </View>
        <View style={styles.timelineTrack}>
          {/* Morning Window (06:00) */}
          <View style={[styles.timelineBlock, { left: "25%", width: "8%" }]} />
          {/* Midday Window (13:30) */}
          <View style={[styles.timelineBlock, { left: "56%", width: "6%" }]} />
          {/* Evening Window (18:00) */}
          <View style={[styles.timelineBlock, { left: "75%", width: "8%" }]} />
        </View>
        <View style={styles.timelineHourLabels}>
          <Text style={styles.hourText}>00:00</Text>
          <Text style={styles.hourText}>06:00</Text>
          <Text style={styles.hourText}>12:00</Text>
          <Text style={styles.hourText}>18:00</Text>
          <Text style={styles.hourText}>24:00</Text>
        </View>
      </View>

      {/* Scheduled Time Slots */}
      <Text style={styles.sectionHeader}>Daily Refill Presets</Text>
      <View style={styles.presetsRow}>
        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "morning" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("morning")}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetTime, selectedPreset === "morning" && styles.presetTimeActive]}>
            06:00 - 06:30
          </Text>
          <Text style={[styles.presetTitle, selectedPreset === "morning" && styles.presetTitleActive]}>
            🌅 Morning
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "morning" && styles.presetDurationActive]}>
            30 mins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "afternoon" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("afternoon")}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetTime, selectedPreset === "afternoon" && styles.presetTimeActive]}>
            13:30 - 13:50
          </Text>
          <Text style={[styles.presetTitle, selectedPreset === "afternoon" && styles.presetTitleActive]}>
            ☀️ Midday
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "afternoon" && styles.presetDurationActive]}>
            20 mins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "evening" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("evening")}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetTime, selectedPreset === "evening" && styles.presetTimeActive]}>
            18:00 - 18:30
          </Text>
          <Text style={[styles.presetTitle, selectedPreset === "evening" && styles.presetTitleActive]}>
            🌇 Evening
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "evening" && styles.presetDurationActive]}>
            30 mins
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Repeat Days Selector */}
      <View style={styles.daysSection}>
        <Text style={styles.daysHeader}>Repeat Days:</Text>
        <View style={styles.daysRow}>
          {daysList.map((day, idx) => {
            const isSelected = activeDays.includes(day.id);
            return (
              <TouchableOpacity
                key={`${day.id}-${idx}`}
                style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                onPress={() => toggleDay(day.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Save Settings Button - Solid Black with White text */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => {
          let times = { scheduledOn: "06:00", scheduledOff: "06:30" };
          if (selectedPreset === "afternoon") times = { scheduledOn: "13:30", scheduledOff: "13:50" };
          if (selectedPreset === "evening") times = { scheduledOn: "18:00", scheduledOff: "18:30" };
          onSaveSchedule({ autoMode: isAuto, ...times, repeatDays: activeDays });
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>✓ SAVE SCHEDULE & REFILL RULES</Text>
      </TouchableOpacity>
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    marginRight: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  nextRunCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  nextRunLeft: {
    flex: 1,
  },
  nextRunLabel: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  nextRunTime: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  nextRunBadge: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextRunBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  timelineSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timelineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timelineLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timelineSub: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
  },
  timelineTrack: {
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
  },
  timelineBlock: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#000000",
    borderRadius: 3,
  },
  timelineHourLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  hourText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "600",
  },
  sectionHeader: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  presetCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  presetCardActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  presetTime: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  presetTimeActive: {
    color: "#FFFFFF",
  },
  presetTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  presetTitleActive: {
    color: "#E2E8F0",
  },
  presetDuration: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
  },
  presetDurationActive: {
    color: "#94A3B8",
  },
  daysSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
  },
  daysHeader: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayCircleActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  dayText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  dayTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  saveBtn: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
