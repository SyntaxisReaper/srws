import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  ScrollView,
} from "react-native";
import { hapticFeedback } from "../utils/haptics";

const DAYS_MAP = [
  { id: "mon", short: "M", full: "Mon" },
  { id: "tue", short: "T", full: "Tue" },
  { id: "wed", short: "W", full: "Wed" },
  { id: "thu", short: "T", full: "Thu" },
  { id: "fri", short: "F", full: "Fri" },
  { id: "sat", short: "S", full: "Sat" },
  { id: "sun", short: "S", full: "Sun" },
];

function formatTime12(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || timeStr.indexOf(":") === -1) {
    return "06:00 AM";
  }
  const parts = timeStr.split(":");
  let hour = parseInt(parts[0], 10);
  const min = parts[1].padStart(2, "0");
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour.toString().padStart(2, "0")}:${min} ${period}`;
}

function parseTime24(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || timeStr.indexOf(":") === -1) {
    return { hour24: 6, hour12: 6, min: 0, period: "AM" };
  }
  const parts = timeStr.split(":");
  const hour24 = parseInt(parts[0], 10);
  const min = parseInt(parts[1], 10);
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour24, hour12, min, period };
}

function toTimeString24(hour12, min, period) {
  let h = parseInt(hour12, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h < 12) h += 12;
  const m = parseInt(min, 10);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getDurationMinutes(onStr, offStr) {
  const on = parseTime24(onStr);
  const off = parseTime24(offStr);
  let onTotal = on.hour24 * 60 + on.min;
  let offTotal = off.hour24 * 60 + off.min;
  if (offTotal < onTotal) offTotal += 1440; // overnight duration
  return offTotal - onTotal;
}

export default function SchedulerPanel({
  schedule = null,
  scheduledOn = "06:00",
  scheduledOff = "06:30",
  autoMode = true,
  days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  isOnline = true,
  onSaveSchedule = () => {},
}) {
  const initialEnabled = schedule?.enabled ?? autoMode;
  const initialOn = schedule?.onTime || scheduledOn || "06:00";
  const initialOff = schedule?.offTime || scheduledOff || "06:30";
  const initialDays = schedule?.days || days || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const [isAuto, setIsAuto] = useState(initialEnabled);
  const [onTime, setOnTime] = useState(initialOn);
  const [offTime, setOffTime] = useState(initialOff);
  const [activeDays, setActiveDays] = useState(initialDays);
  const [selectedPreset, setSelectedPreset] = useState("morning");

  // Time Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState("ON"); // "ON" | "OFF"
  const [tempHour, setTempHour] = useState(6);
  const [tempMin, setTempMin] = useState(0);
  const [tempPeriod, setTempPeriod] = useState("AM");

  // Sync state if props change from external updates
  useEffect(() => {
    if (schedule?.onTime) setOnTime(schedule.onTime);
    if (schedule?.offTime) setOffTime(schedule.offTime);
    if (typeof schedule?.enabled === "boolean") setIsAuto(schedule.enabled);
    if (Array.isArray(schedule?.days)) setActiveDays(schedule.days);
  }, [schedule]);

  const toggleDay = (dayId) => {
    hapticFeedback.light();
    if (activeDays.includes(dayId)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== dayId));
      }
    } else {
      setActiveDays([...activeDays, dayId]);
    }
  };

  const handleToggleAuto = (val) => {
    hapticFeedback.light();
    setIsAuto(val);
  };

  const handleApplyPreset = (preset) => {
    hapticFeedback.light();
    setSelectedPreset(preset);
    if (preset === "morning") {
      setOnTime("06:00");
      setOffTime("06:30");
    } else if (preset === "afternoon") {
      setOnTime("13:30");
      setOffTime("13:50");
    } else if (preset === "evening") {
      setOnTime("18:00");
      setOffTime("18:30");
    }
  };

  const openTimePicker = (target) => {
    hapticFeedback.light();
    setPickerTarget(target);
    const curTime = target === "ON" ? onTime : offTime;
    const parsed = parseTime24(curTime);
    setTempHour(parsed.hour12);
    setTempMin(parsed.min);
    setTempPeriod(parsed.period);
    setPickerVisible(true);
  };

  const confirmTimePicker = () => {
    hapticFeedback.light();
    const formatted24 = toTimeString24(tempHour, tempMin, tempPeriod);
    if (pickerTarget === "ON") {
      setOnTime(formatted24);
      setSelectedPreset("custom");
    } else {
      setOffTime(formatted24);
      setSelectedPreset("custom");
    }
    setPickerVisible(false);
  };

  const adjustMinutes = (delta) => {
    hapticFeedback.light();
    let next = tempMin + delta;
    if (next < 0) next += 60;
    if (next >= 60) next -= 60;
    setTempMin(next);
  };

  const durationMins = getDurationMinutes(onTime, offTime);

  // Calculate timeline track positions
  const onParsed = parseTime24(onTime);
  const onTotalMinutes = onParsed.hour24 * 60 + onParsed.min;
  const trackLeftPercent = Math.min(Math.max((onTotalMinutes / 1440) * 100, 0), 92);
  const trackWidthPercent = Math.min(Math.max((durationMins / 1440) * 100, 4), 50);

  const handleSave = () => {
    if (!isOnline) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.success();
    onSaveSchedule({
      enabled: isAuto,
      onTime,
      offTime,
      days: activeDays,
    });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Automatic Refill</Text>
          <Text style={styles.cardSubtitle}>Local ESP32 hardware schedule & auto-cutoff</Text>
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
            ? "Scheduled Mode: ESP32 automatically starts the pump at the set ON time and safely cuts off at OFF time or when tank is full."
            : "Schedule Paused: Automatic timer refilling is currently disabled. Motor operates on manual commands only."}
        </Text>
      </View>

      {/* Next Scheduled Timer Status Card */}
      <View style={styles.nextRunCard}>
        <View style={styles.nextRunLeft}>
          <Text style={styles.nextRunLabel}>NEXT SCHEDULED FILL</Text>
          <Text style={styles.nextRunTime}>
            {isAuto
              ? `Daily at ${formatTime12(onTime)} (${durationMins} min refill)`
              : "Schedule Paused (Disabled)"}
          </Text>
        </View>
        <View style={[styles.nextRunBadge, !isAuto && styles.nextRunBadgePaused]}>
          <Text style={styles.nextRunBadgeText}>{isAuto ? "Active" : "Paused"}</Text>
        </View>
      </View>

      {/* Visual 24-Hour Timeline Bar */}
      <View style={styles.timelineSection}>
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineLabel}>24-HOUR FILL TIMELINE</Text>
          <Text style={styles.timelineSub}>
            {formatTime12(onTime)} → {formatTime12(offTime)}
          </Text>
        </View>
        <View style={styles.timelineTrack}>
          <View
            style={[
              styles.timelineBlock,
              {
                left: `${trackLeftPercent}%`,
                width: `${trackWidthPercent}%`,
                backgroundColor: isAuto ? "#000000" : "#94A3B8",
              },
            ]}
          />
        </View>
        <View style={styles.timelineHourLabels}>
          <Text style={styles.hourText}>00:00</Text>
          <Text style={styles.hourText}>06:00</Text>
          <Text style={styles.hourText}>12:00</Text>
          <Text style={styles.hourText}>18:00</Text>
          <Text style={styles.hourText}>24:00</Text>
        </View>
      </View>

      {/* Daily Refill Presets */}
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

      {/* Custom Time Selection (Feature 2 Requirements) */}
      <Text style={styles.sectionHeader}>Custom Scheduled Window</Text>
      <View style={styles.customTimeRow}>
        {/* Motor ON Picker Button */}
        <TouchableOpacity
          style={styles.timeSelectBtn}
          onPress={() => openTimePicker("ON")}
          activeOpacity={0.85}
        >
          <Text style={styles.timeSelectLabel}>MOTOR ON AT</Text>
          <Text style={styles.timeSelectVal}>{formatTime12(onTime)}</Text>
          <Text style={styles.timeSelectHint}>Tap to change</Text>
        </TouchableOpacity>

        <View style={styles.timeArrow}>
          <Text style={styles.arrowIcon}>→</Text>
          <Text style={styles.durationPill}>{durationMins}m</Text>
        </View>

        {/* Motor OFF Picker Button */}
        <TouchableOpacity
          style={styles.timeSelectBtn}
          onPress={() => openTimePicker("OFF")}
          activeOpacity={0.85}
        >
          <Text style={styles.timeSelectLabel}>MOTOR OFF AT</Text>
          <Text style={styles.timeSelectVal}>{formatTime12(offTime)}</Text>
          <Text style={styles.timeSelectHint}>Tap to change</Text>
        </TouchableOpacity>
      </View>

      {/* Tank Full Cutoff Safety Notice */}
      <View style={styles.safetyNoticeBox}>
        <Text style={styles.safetyNoticeIcon}>🛡️</Text>
        <Text style={styles.safetyNoticeText}>
          Safety Cutoff: Motor will automatically stop if the tank fills (≥ 90%) before{" "}
          <Text style={styles.boldText}>{formatTime12(offTime)}</Text> to prevent overflow.
        </Text>
      </View>

      {/* Weekly Repeat Days Selector */}
      <View style={styles.daysSection}>
        <Text style={styles.daysHeader}>Repeat Days:</Text>
        <View style={styles.daysRow}>
          {DAYS_MAP.map((day) => {
            const isSelected = activeDays.includes(day.id);
            return (
              <TouchableOpacity
                key={day.id}
                style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                onPress={() => toggleDay(day.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Save Settings Button - Solid Black with White text */}
      <TouchableOpacity
        style={[styles.saveBtn, !isOnline && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!isOnline}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>
          {!isOnline ? "⚠️ DEVICE OFFLINE • CONTROLS LOCKED" : "✓ SAVE SCHEDULE & REFILL RULES"}
        </Text>
      </TouchableOpacity>

      {/* Interactive Time Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>
              ⏰ Set Motor {pickerTarget} Time
            </Text>
            <Text style={styles.modalHeaderSub}>
              {pickerTarget === "ON"
                ? "Pump starts automatically at this local IST time"
                : "Pump cuts off automatically at this time"}
            </Text>

            {/* Large Digital Display */}
            <View style={styles.timePreviewBox}>
              <Text style={styles.timePreviewText}>
                {tempHour.toString().padStart(2, "0")}:{tempMin.toString().padStart(2, "0")} {tempPeriod}
              </Text>
            </View>

            {/* AM / PM Toggle */}
            <View style={styles.periodRow}>
              <TouchableOpacity
                style={[styles.periodBtn, tempPeriod === "AM" && styles.periodBtnActive]}
                onPress={() => setTempPeriod("AM")}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodBtnText, tempPeriod === "AM" && styles.periodBtnTextActive]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, tempPeriod === "PM" && styles.periodBtnActive]}
                onPress={() => setTempPeriod("PM")}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodBtnText, tempPeriod === "PM" && styles.periodBtnTextActive]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hour Selector (1-12) */}
            <Text style={styles.pickerSectionLabel}>Select Hour</Text>
            <View style={styles.gridRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                <TouchableOpacity
                  key={`h-${h}`}
                  style={[styles.gridCell, tempHour === h && styles.gridCellActive]}
                  onPress={() => setTempHour(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.gridCellText, tempHour === h && styles.gridCellTextActive]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Minute Selection */}
            <Text style={styles.pickerSectionLabel}>Select Minute</Text>
            <View style={styles.gridRow}>
              {[0, 10, 15, 20, 30, 45].map((m) => (
                <TouchableOpacity
                  key={`m-${m}`}
                  style={[styles.gridCellMin, tempMin === m && styles.gridCellActive]}
                  onPress={() => setTempMin(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.gridCellText, tempMin === m && styles.gridCellTextActive]}>
                    :{m.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stepper Buttons for fine tuning */}
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMinutes(-5)} activeOpacity={0.7}>
                <Text style={styles.stepperText}>- 5 min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMinutes(5)} activeOpacity={0.7}>
                <Text style={styles.stepperText}>+ 5 min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMinutes(15)} activeOpacity={0.7}>
                <Text style={styles.stepperText}>+ 15 min</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPickerVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmTimePicker}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>Confirm Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  nextRunBadgePaused: {
    backgroundColor: "#94A3B8",
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
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
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
  customTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  timeSelectBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  timeSelectLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeSelectVal: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  timeSelectHint: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "700",
  },
  timeArrow: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  arrowIcon: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "900",
  },
  durationPill: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  safetyNoticeBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16,
  },
  safetyNoticeIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  safetyNoticeText: {
    flex: 1,
    color: "#92400E",
    fontSize: 11,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: "800",
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
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  modalHeaderSub: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  timePreviewBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  timePreviewText: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: "#000000",
  },
  periodBtnText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  periodBtnTextActive: {
    color: "#FFFFFF",
  },
  pickerSectionLabel: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridCell: {
    width: "15%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  gridCellMin: {
    width: "15%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  gridCellActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  gridCellText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  gridCellTextActive: {
    color: "#FFFFFF",
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  stepperBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 3,
  },
  stepperText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalCancelText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  modalConfirmBtn: {
    flex: 1.5,
    backgroundColor: "#000000",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
