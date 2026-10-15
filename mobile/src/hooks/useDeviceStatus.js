/**
 * React Hook for subscribing to device telemetry and issuing motor & valve commands
 */

import { useState, useEffect, useCallback } from "react";
import {
  subscribeToDeviceState,
  sendMotorCommand,
  sendValveCommand,
  triggerSimulatedFault,
  setContactProbeLevel,
  updateScheduleConfig,
  setManualOverride as apiSetManualOverride,
} from "../services/deviceService";
import { DEFAULT_DEVICE_ID } from "../services/firebaseConfig";

export function useDeviceStatus(deviceId = DEFAULT_DEVICE_ID, forceSimulation = false) {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToDeviceState(
      deviceId,
      (data) => {
        setDeviceData(data);
        setLoading(false);
      },
      forceSimulation
    );

    return () => unsubscribe();
  }, [deviceId, forceSimulation]);

  const toggleMotor = useCallback(
    async (targetCommand, manualOverride = false) => {
      setIsSubmitting(true);
      setActionError(null);

      // Optimistic state update: immediate UI toggle
      let rollbackData = null;
      setDeviceData((prev) => {
        if (!prev) return prev;
        rollbackData = prev;
        const isRunning = targetCommand === "ON";
        return {
          ...prev,
          status: {
            ...prev.status,
            motorRunning: isRunning,
            relayState: targetCommand,
          },
          commands: {
            ...prev.commands,
            motorCommand: targetCommand,
          },
        };
      });

      try {
        await sendMotorCommand(deviceId, targetCommand, forceSimulation, manualOverride);
      } catch (err) {
        if (rollbackData) {
          setDeviceData(rollbackData);
        }
        setActionError(err.message || "Failed to send motor command");
      } finally {
        setIsSubmitting(false);
      }
    },
    [deviceId, forceSimulation]
  );

  const toggleValve = useCallback(
    async (targetCommand, manualOverride = false) => {
      setIsSubmitting(true);
      setActionError(null);

      // Optimistic state update: immediate UI toggle
      let rollbackData = null;
      setDeviceData((prev) => {
        if (!prev) return prev;
        rollbackData = prev;
        return {
          ...prev,
          status: {
            ...prev.status,
            valveState: targetCommand,
          },
          commands: {
            ...prev.commands,
            valveCommand: targetCommand,
          },
        };
      });

      try {
        await sendValveCommand(deviceId, targetCommand, forceSimulation, manualOverride);
      } catch (err) {
        if (rollbackData) {
          setDeviceData(rollbackData);
        }
        setActionError(err.message || "Failed to send valve command");
      } finally {
        setIsSubmitting(false);
      }
    },
    [deviceId, forceSimulation]
  );

  const setManualOverrideMode = useCallback(
    async (enabled) => {
      setIsSubmitting(true);
      let rollbackData = null;
      setDeviceData((prev) => {
        if (!prev) return prev;
        rollbackData = prev;
        return {
          ...prev,
          commands: {
            ...prev.commands,
            manualOverride: enabled,
          },
        };
      });

      try {
        await apiSetManualOverride(deviceId, enabled, forceSimulation);
      } catch (err) {
        if (rollbackData) {
          setDeviceData(rollbackData);
        }
        setActionError(err.message || "Failed to update manual override mode");
      } finally {
        setIsSubmitting(false);
      }
    },
    [deviceId, forceSimulation]
  );

  const simulateFault = useCallback((active) => {
    triggerSimulatedFault(active);
  }, []);

  const changeWaterLevel = useCallback((level) => {
    setContactProbeLevel(level);
  }, []);

  const saveSchedule = useCallback(
    async (scheduleConfig) => {
      setIsSubmitting(true);
      setActionError(null);
      let rollbackData = null;

      // Optimistically update schedule in local state
      setDeviceData((prev) => {
        if (!prev) return prev;
        rollbackData = prev;
        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            ...scheduleConfig,
          },
          commands: {
            ...prev.commands,
            autoMode: scheduleConfig.enabled,
            scheduledOn: scheduleConfig.onTime,
            scheduledOff: scheduleConfig.offTime,
          },
        };
      });

      try {
        await updateScheduleConfig(deviceId, scheduleConfig, forceSimulation);
      } catch (err) {
        if (rollbackData) {
          setDeviceData(rollbackData);
        }
        setActionError(err.message || "Failed to update schedule");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [deviceId, forceSimulation]
  );

  return {
    deviceData,
    loading,
    isSubmitting,
    actionError,
    clearError: () => setActionError(null),
    toggleMotor,
    toggleValve,
    setManualOverride: setManualOverrideMode,
    simulateFault,
    changeWaterLevel,
    saveSchedule,
  };
}
