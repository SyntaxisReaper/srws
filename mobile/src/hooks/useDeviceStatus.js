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
    async (targetCommand) => {
      setIsSubmitting(true);
      setActionError(null);
      try {
        await sendMotorCommand(deviceId, targetCommand, forceSimulation);
      } catch (err) {
        setActionError(err.message || "Failed to send motor command");
      } finally {
        setIsSubmitting(false);
      }
    },
    [deviceId, forceSimulation]
  );

  const toggleValve = useCallback(
    async (targetCommand) => {
      setIsSubmitting(true);
      setActionError(null);
      try {
        await sendValveCommand(deviceId, targetCommand, forceSimulation);
      } catch (err) {
        setActionError(err.message || "Failed to send valve command");
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
      try {
        await updateScheduleConfig(deviceId, scheduleConfig, forceSimulation);
      } catch (err) {
        setActionError(err.message || "Failed to update schedule");
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
    simulateFault,
    changeWaterLevel,
    saveSchedule,
  };
}
