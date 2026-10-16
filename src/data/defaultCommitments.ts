import { DailyCommitment } from '../types.ts';

/**
 * Returns empty commitments so the user starts completely clean from scratch
 */
export function getDefaultCommitments(): DailyCommitment[] {
  return [];
}

/**
 * Generates starter commitments for preview or restore if requested by the user
 */
export function getDemoCommitments(): DailyCommitment[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Current hours for contextual scheduling
  const currentHour = now.getHours();
  const nextHourStr = String(Math.min(currentHour + 1, 23)).padStart(2, '0') + ':00';
  const laterHourStr = String(Math.min(currentHour + 3, 23)).padStart(2, '0') + ':30';

  return [
    {
      id: 'comm-socorro-1',
      title: 'Socorro: Comprar remédio na farmácia e levar comprovante',
      type: 'emergency',
      priority: 'urgent',
      date: todayStr,
      time: nextHourStr,
      completed: false,
      notes: 'Urgente! Não esquecer a receita médica na gaveta.',
      soundAlertMinutesBefore: 10,
      soundEnabled: true,
      location: 'Farmácia Central',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'comm-appt-1',
      title: 'Consulta médica / Alinhamento de rotina',
      type: 'appointment',
      priority: 'high',
      date: todayStr,
      time: laterHourStr,
      completed: false,
      notes: 'Chegar com 10 minutos de antecedência.',
      soundAlertMinutesBefore: 15,
      soundEnabled: true,
      location: 'Consultório Dr. Carlos',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'comm-task-1',
      title: 'Ligar para a companhia de internet sobre o sinal',
      type: 'task',
      priority: 'normal',
      date: todayStr,
      completed: false,
      notes: 'Protocolo anterior anotado no caderno.',
      soundAlertMinutesBefore: 0,
      soundEnabled: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'comm-task-2',
      title: 'Conferir extrato bancário e pagar fatura do cartão',
      type: 'task',
      priority: 'normal',
      date: todayStr,
      completed: true,
      completedAt: new Date().toISOString(),
      notes: 'Já pago pela manhã.',
      soundAlertMinutesBefore: 0,
      soundEnabled: false,
      createdAt: new Date().toISOString(),
    },
  ];
}
