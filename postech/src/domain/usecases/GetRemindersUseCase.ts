/**
 * Use Case: GetRemindersUseCase
 * Lógica para obter e filtrar lembretes - independente de UI
 */
import type { Reminder } from "../entities/Reminder";
import type { ReminderRepository } from "../repositories/ReminderRepository";

export type ReminderFilter = {
  status?: "pending" | "completed" | "all";
  dateRange?: { from: Date; to: Date };
  tag?: string;
};

export class GetRemindersUseCase {
  constructor(private reminderRepository: ReminderRepository) {}

  async execute(userId: string, filter?: ReminderFilter): Promise<Reminder[]> {
    if (!userId) {
      throw new Error("ID do usuário é obrigatório");
    }

    if (filter) {
      return this.reminderRepository.searchReminders(userId, filter);
    }

    return this.reminderRepository.getRemindersByUserId(userId);
  }

  /**
   * Obter apenas lembretes vencidos e pendentes
   */
  async getOverdueReminders(userId: string): Promise<Reminder[]> {
    const all = await this.reminderRepository.getRemindersByUserId(userId);
    const now = new Date();
    return all.filter((r) => r.isOverdue(now) && !r.completed);
  }

  /**
   * Obter lembretes de hoje
   */
  async getTodayReminders(userId: string): Promise<Reminder[]> {
    const all = await this.reminderRepository.getRemindersByUserId(userId);
    return all.filter((r) => r.isToday());
  }
}
