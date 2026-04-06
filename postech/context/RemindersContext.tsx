import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Reminder, ReminderSummary } from '@/types/reminder';
import { fetchRemindersForUser } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

interface RemindersContextData {
  reminders: Reminder[];
  summary: ReminderSummary;
  isLoading: boolean;
  refetch: () => void;
  error: string | null;
  totalCount: number;
}

const RemindersContext = createContext<RemindersContextData | undefined>(undefined);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const {
    data: reminders = [],
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['reminders', 'all', user?.id],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return fetchRemindersForUser(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const summary = useMemo((): ReminderSummary => {
    const today = startOfDay(new Date());
    let dueTodayPending = 0;
    for (const r of reminders) {
      if (r.completed) continue;
      if (isSameCalendarDay(startOfDay(r.scheduledAt), today)) dueTodayPending += 1;
    }
    const pending = reminders.filter((r) => !r.completed).length;
    const completed = reminders.filter((r) => r.completed).length;
    return {
      total: reminders.length,
      pending,
      completed,
      dueTodayPending,
    };
  }, [reminders]);

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        summary,
        isLoading,
        refetch,
        error: isError ? 'Erro ao carregar lembretes. Verifique se o json-server esta rodando.' : null,
        totalCount: reminders.length,
      }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useRemindersContext() {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useRemindersContext must be used within RemindersProvider');
  }
  return context;
}
