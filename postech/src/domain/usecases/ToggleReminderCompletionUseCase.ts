/**
 * Use Case: ToggleReminderCompletionUseCase
 * Lógica para marcar lembrete como completo/incompleto - independente de UI
 */
import type { Reminder } from "../entities/Reminder";
import type { ReminderRepository } from "../repositories/ReminderRepository";

export class ToggleReminderCompletionUseCase {
  constructor(private reminderRepository: ReminderRepository) {}

  async execute(reminderId: string): Promise<Reminder> {
    if (!reminderId) {
      throw new Error("ID do lembrete é obrigatório");
    }

    // Obter lembrete atual
    const reminder = await this.reminderRepository.getReminderById(reminderId);
    if (!reminder) {
      throw new Error("Lembrete não encontrado");
    }

    // Alternar status
    const updated =
      await this.reminderRepository.toggleReminderCompletion(reminderId);

    return updated;
  }
}
