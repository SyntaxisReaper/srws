/**
 * Hook to monitor ESP32 hardware online presence.
 * Flags the device as offline if no telemetry heartbeat (lastSeen) is received within 30 seconds.
 */
import { useState, useEffect } from "react";

export function useDeviceOnlineStatus(lastSeen, forceSimulation = false, thresholdSec = 30) {
  const [isOnline, setIsOnline] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (forceSimulation) {
      setIsOnline(true);
      setSecondsAgo(0);
      return;
    }

    const evaluatePresence = () => {
      let ts = Number(lastSeen);
      if (!ts || isNaN(ts) || ts <= 0) {
        setIsOnline(false);
        setSecondsAgo(9999);
        return;
      }
      if (ts < 10000000000) {
        ts = ts * 1000;
      }
      const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
      setSecondsAgo(diffSec);
      setIsOnline(diffSec < thresholdSec);
    };

    evaluatePresence();
    const timer = setInterval(evaluatePresence, 1000);
    return () => clearInterval(timer);
  }, [lastSeen, forceSimulation, thresholdSec]);

  return { isOnline, secondsAgo };
}
