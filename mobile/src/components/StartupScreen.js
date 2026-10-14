import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DIAGNOSTIC_STEPS = [
  "Initializing telemetry uplink...",
  "Calibrating ultrasonic tank sensor...",
  "Arming auto-guards & overflow cutoffs...",
  "HydroNode Core Active ✓",
];

export default function StartupScreen({ onFinish = () => {} }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Animation values (all use native driver where possible)
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoTranslateY = useRef(new Animated.Value(-35)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Ripples
  const ripple1Scale = useRef(new Animated.Value(0.4)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.8)).current;
  const ripple2Scale = useRef(new Animated.Value(0.4)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.6)).current;

  // Text & UI elements
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current; // 0 to 100%

  // Status step fade
  const stepOpacity = useRef(new Animated.Value(1)).current;

  const hasFinishedRef = useRef(false);

  const completeStartup = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    try {
      Vibration.vibrate(30);
    } catch (e) {
      // Non-fatal
    }

    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1.04,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    // 1. Entrance of droplet logo
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(logoTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Ripple pulse animations (continuous loop)
    const runRipple = (scaleVal, opacityVal, delay = 0) => {
      scaleVal.setValue(0.5);
      opacityVal.setValue(0.7);
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleVal, {
              toValue: 2.4,
              duration: 2000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacityVal, {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    runRipple(ripple1Scale, ripple1Opacity, 0);
    runRipple(ripple2Scale, ripple2Opacity, 650);

    // 3. Branding text fade & slide up
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.spring(textTranslateY, {
        toValue: 0,
        tension: 40,
        friction: 6,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Progress bar fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false, // width animation requires layout
    }).start();

    // 5. Sequence through diagnostic steps
    const stepTimer1 = setTimeout(() => {
      animateToStep(1);
    }, 650);

    const stepTimer2 = setTimeout(() => {
      animateToStep(2);
    }, 1300);

    const stepTimer3 = setTimeout(() => {
      animateToStep(3);
    }, 1900);

    // 6. Complete and exit smoothly into main dashboard
    const finishTimer = setTimeout(() => {
      completeStartup();
    }, 2450);

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(finishTimer);
    };
  }, []);

  const animateToStep = (nextIndex) => {
    Animated.sequence([
      Animated.timing(stepOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentStepIndex(nextIndex);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["4%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.overlayContainer,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      {/* Top Bar with Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.secureBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.secureText}>SYSTEM BOOT</Text>
        </View>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={completeStartup}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        >
          <Text style={styles.skipBtnText}>SKIP ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Center Stage: Ripple Wave & Droplet Icon */}
      <View style={styles.centerStage}>
        {/* Expanding Water Ripple 1 */}
        <Animated.View
          style={[
            styles.rippleRing,
            {
              transform: [{ scale: ripple1Scale }],
              opacity: ripple1Opacity,
            },
          ]}
        />

        {/* Expanding Water Ripple 2 */}
        <Animated.View
          style={[
            styles.rippleRing,
            styles.rippleRingSecondary,
            {
              transform: [{ scale: ripple2Scale }],
              opacity: ripple2Opacity,
            },
          ]}
        />

        {/* Core Droplet Badge */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>💧</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Branding & Loading Progress */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <View style={styles.appNameRow}>
          <Text style={styles.brandTitle}>HydroNode</Text>
          <View style={styles.proTag}>
            <Text style={styles.proTagText}>PRO</Text>
          </View>
        </View>

        <Text style={styles.brandTagline}>SMART REALTIME WATER AUTOMATION</Text>

        {/* Minimal Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Diagnostic Status Pill */}
        <Animated.View style={[styles.stepContainer, { opacity: stepOpacity }]}>
          <View style={styles.stepDot} />
          <Text style={styles.stepText}>
            {DIAGNOSTIC_STEPS[currentStepIndex]}
          </Text>
        </Animated.View>

        {/* Version info footer */}
        <Text style={styles.versionText}>v1.0.0 • Connected to SRWS Hub</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 99999,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  secureText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  skipBtn: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  skipBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  centerStage: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  rippleRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(0, 210, 255, 0.35)",
    backgroundColor: "rgba(0, 210, 255, 0.05)",
  },
  rippleRingSecondary: {
    borderColor: "rgba(14, 165, 233, 0.2)",
    backgroundColor: "rgba(14, 165, 233, 0.03)",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F172A",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 48,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
  },
  appNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  brandTitle: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  proTag: {
    backgroundColor: "#000000",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  proTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  brandTagline: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 26,
    textAlign: "center",
  },
  progressTrack: {
    width: "75%",
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0284C7",
    marginRight: 8,
  },
  stepText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  versionText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
});
