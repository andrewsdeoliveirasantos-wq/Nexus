import { useEffect, useRef, useState, useCallback } from 'react';
import { DailyCommitment } from '../types.ts';
import {
  playAppointmentAlertSound,
  playEmergencyAlarmSound,
  isSoundAlertEnabled,
} from '../utils/audioAlert.ts';

export function useCommitmentMonitor(
  commitments: DailyCommitment[],
  onUpdateCommitment: (updated: DailyCommitment) => void
) {
  const [activeAlert, setActiveAlert] = useState<DailyCommitment | null>(null);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  const checkAlerts = useCallback(() => {
    if (!isSoundAlertEnabled()) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    commitments.forEach((comm) => {
      // Must be today, pending, have a time, and sound enabled
      if (comm.completed || !comm.soundEnabled || comm.date !== todayStr || !comm.time) {
        return;
      }

      const [h, m] = comm.time.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return;

      const commTotalMinutes = h * 60 + m;
      const diffMinutes = commTotalMinutes - currentTotalMinutes;
      const alertWindowMinutes = comm.soundAlertMinutesBefore ?? 5;

      // Condition: within alert window and not more than 15 minutes past due
      if (diffMinutes <= alertWindowMinutes && diffMinutes >= -15) {
        const alertKey = `${comm.id}-${comm.date}-${comm.time}`;
        if (!alertedIdsRef.current.has(alertKey)) {
          alertedIdsRef.current.add(alertKey);

          // Play appropriate sound
          if (comm.type === 'emergency' || comm.priority === 'urgent') {
            playEmergencyAlarmSound();
          } else {
            playAppointmentAlertSound();
          }

          // Trigger screen popup
          setActiveAlert(comm);

          // Try browser notification if granted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⏰ Alerta: ${comm.title}`, {
                body: comm.time ? `Horário agendado: ${comm.time}` : 'Compromisso próximo!',
                icon: '/favicon.ico',
              });
            } catch (err) {
              console.warn('Notification error:', err);
            }
          }

          // Mark last alerted
          onUpdateCommitment({
            ...comm,
            lastAlertedTimestamp: Date.now(),
          });
        }
      }
    });
  }, [commitments, onUpdateCommitment]);

  useEffect(() => {
    // Check immediately and then every 10 seconds
    checkAlerts();
    const timer = setInterval(checkAlerts, 10000);
    return () => clearInterval(timer);
  }, [checkAlerts]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const snooze5Min = (id: string) => {
    setActiveAlert(null);
    const comm = commitments.find((c) => c.id === id);
    if (!comm) return;

    // Postpone the alertKey by clearing it from alerted and adjusting alerted timestamp
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const newTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onUpdateCommitment({
      ...comm,
      time: newTime,
      lastAlertedTimestamp: undefined,
    });
  };

  return {
    activeAlert,
    dismissAlert,
    snooze5Min,
  };
}
