/**
 * RemindersContext refatorado com Clean Architecture
 * Exemplo de como gerenciar lembretes usando use cases
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { serviceLocator } from "@/src/di/ServiceLocator";
import type { Reminder } from "@/src/domain/entities/Reminder";
import type { ReminderFilter } from "@/src/domain/usecases/GetRemindersUseCase";
import type { CreateReminderInput } from "@/src/domain/usecases/UpdateReminderUseCase";

type RemindersContextValue = {
  reminders: Reminder[];
  loading: boolean;
  error: Error | null;
  loadReminders: (userId: string, filter?: ReminderFilter) => Promise<void>;
  createReminder: (input: CreateReminderInput) => Promise<void>;
  toggleReminder: (reminderId: string) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  clearError: () => void;
};

const RemindersContext = createContext<RemindersContextValue | undefined>(
  undefined,
);

/**
 * Provider que gerencia lembretes
 * Utiliza use cases da camada de domínio
 */
export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Injetar dependências dos use cases
  const getRemindersUseCase = useMemo(
    () => serviceLocator.getGetRemindersUseCase(),
    [],
  );
  const createReminderUseCase = useMemo(
    () => serviceLocator.getCreateReminderUseCase(),
    [],
  );
  const toggleReminderUseCase = useMemo(
    () => serviceLocator.getToggleReminderCompletionUseCase(),
    [],
  );
  const reminderRepository = useMemo(
    () => serviceLocator.getReminderRepository(),
    [],
  );

  const loadReminders = useCallback(
    async (userId: string, filter?: ReminderFilter) => {
      setLoading(true);
      setError(null);

      try {
        const loaded = await getRemindersUseCase.execute(userId, filter);
        setReminders(loaded);
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error("Erro ao carregar lembretes");
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [getRemindersUseCase],
  );

  const createReminder = useCallback(
    async (input: CreateReminderInput) => {
      setError(null);

      try {
        const created = await createReminderUseCase.execute(input);
        // Adicionar novo lembrete à lista local
        setReminders((prev) => [created, ...prev]);
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error("Erro ao criar lembrete");
        setError(err);
        throw err;
      }
    },
    [createReminderUseCase],
  );

  const toggleReminder = useCallback(
    async (reminderId: string) => {
      setError(null);

      try {
        const updated = await toggleReminderUseCase.execute(reminderId);
        // Atualizar lembrete na lista local
        setReminders((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error("Erro ao atualizar lembrete");
        setError(err);
        throw err;
      }
    },
    [toggleReminderUseCase],
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      setError(null);

      try {
        await reminderRepository.deleteReminder(reminderId);
        // Remover da lista local
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error("Erro ao deletar lembrete");
        setError(err);
        throw err;
      }
    },
    [reminderRepository],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<RemindersContextValue>(
    () => ({
      reminders,
      loading,
      error,
      loadReminders,
      createReminder,
      toggleReminder,
      deleteReminder,
      clearError,
    }),
    [
      reminders,
      loading,
      error,
      loadReminders,
      createReminder,
      toggleReminder,
      deleteReminder,
      clearError,
    ],
  );

  return (
    <RemindersContext.Provider value={value}>
      {children}
    </RemindersContext.Provider>
  );
}

/**
 * Hook para usar RemindersContext
 */
export function useReminders(): RemindersContextValue {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error(
      "useReminders deve ser usado dentro de um RemindersProvider",
    );
  }
  return context;
}
