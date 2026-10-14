import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";

export default function HelpFaqModal({ visible = false, onClose = () => {} }) {
  const faqs = [
    {
      q: "Will my water tank ever overflow?",
      a: "No! HydroNode is equipped with automatic overflow protection. The moment water touches the upper sensor (90%), the pump is instantly powered down.",
      icon: "🛡️",
    },
    {
      q: "What happens if there is no water in the pipe?",
      a: "HydroNode detects dry-running within seconds. If the motor is on but no water is flowing, it cuts power automatically to prevent motor burnout.",
      icon: "💧",
    },
    {
      q: "How does the Automatic Refill work?",
      a: "When Auto Mode is enabled in the Automation tab, HydroNode tops up your tank whenever water drops to 20% and stops at 90%. You never have to manually monitor it.",
      icon: "⏰",
    },
    {
      q: "Can I manually turn the pump or valve on and off anytime?",
      a: "Yes! Tap '⚡ MANUAL OVERRIDE' in the Overview tab. This gives you direct manual switches to turn the pump and valve ON or OFF whenever needed, bypassing automatic cutoffs.",
      icon: "⚡",
    },
    {
      q: "What does the Water Supply Valve do?",
      a: "The valve controls the incoming city/municipal pipeline. Opening it lets city water enter your tank; closing it shuts off incoming city water.",
      icon: "🚰",
    },
    {
      q: "Do I get alerts on my phone?",
      a: "Yes, HydroNode sends instant push notifications when your tank is full, when water is low, or if a safety cut-off is triggered.",
      icon: "🔔",
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Homeowner Guide</Text>
              <Text style={styles.subtitle}>Simple answers on how HydroNode protects your home</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ List */}
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqCard}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqIcon}>{faq.icon}</Text>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                </View>
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              </View>
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Action Button - SOLID BLACK with WHITE TEXT */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>GOT IT, THANKS!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: "85%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 14,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "800",
  },
  scrollList: {
    marginVertical: 4,
  },
  faqCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  faqIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  faqQuestion: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  faqAnswer: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 26,
  },
  doneBtn: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
