/**
 * Haptic Feedback Utility
 * Provides native tactile response for button clicks, toggles, overrides, and saves.
 */

import { Vibration, Platform } from "react-native";

export const hapticFeedback = {
  /** Light click for tabs and subtle buttons */
  light: () => {
    try {
      Vibration.vibrate(15);
    } catch (_) {}
  },

  /** Standard tactile click for pump and valve toggles */
  medium: () => {
    try {
      Vibration.vibrate(25);
    } catch (_) {}
  },

  /** Heavy vibration for manual overrides and emergency stops */
  heavy: () => {
    try {
      Vibration.vibrate(45);
    } catch (_) {}
  },

  /** Double-pulse for successful operations (e.g., schedule saved) */
  success: () => {
    try {
      Vibration.vibrate([0, 15, 60, 20]);
    } catch (_) {}
  },

  /** Distinct pattern for safety warnings and locks */
  warning: () => {
    try {
      Vibration.vibrate([0, 30, 80, 40]);
    } catch (_) {}
  },
};

export default hapticFeedback;
