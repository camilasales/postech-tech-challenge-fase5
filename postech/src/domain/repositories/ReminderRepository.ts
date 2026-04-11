/**
 * Interface de Repositório: ReminderRepository
 * Contrato para operações com lembretes
 */
import type { Reminder, ReminderTag } from "../entities/Reminder";

export interface ReminderRepository {
  /**
   * Obter todos os lembretes de um usuário
   */
  getRemindersByUserId(userId: string): Promise<Reminder[]>;

  /**
   * Obter lembrete por ID
   */
  getReminderById(id: string): Promise<Reminder | null>;

  /**
   * Criar novo lembrete
   */
  createReminder(reminder: Reminder): Promise<Reminder>;

  /**
   * Atualizar lembrete existente
   */
  updateReminder(reminder: Reminder): Promise<Reminder>;

  /**
   * Deletar lembrete
   */
  deleteReminder(id: string): Promise<void>;

  /**
   * Marcar lembrete como completado/não completado
   */
  toggleReminderCompletion(id: string): Promise<Reminder>;

  /**
   * Obter tags disponíveis
   */
  getTags(): Promise<ReminderTag[]>;

  /**
   * Buscar lembretes por filtro
   */
  searchReminders(
    userId: string,
    query: {
      status?: "pending" | "completed" | "all";
      dateRange?: { from: Date; to: Date };
      tag?: string;
    },
  ): Promise<Reminder[]>;
}
