/**
 * Use Case: CreateReminderUseCase
 * Lógica para criar lembretes - independente de UI
 */
import { Reminder } from "../entities/Reminder";
import type { ReminderRepository } from "../repositories/ReminderRepository";

export type CreateReminderInput = {
  userId: string;
  description: string;
  scheduledAt: Date;
  tagName?: string;
};

export class CreateReminderUseCase {
  constructor(private reminderRepository: ReminderRepository) {}

  async execute(input: CreateReminderInput): Promise<Reminder> {
    // Validar entrada
    if (!input.userId) {
      throw new Error("ID do usuário é obrigatório");
    }

    if (!input.description || !input.description.trim()) {
      throw new Error("Descrição é obrigatória");
    }

    if (!input.scheduledAt) {
      throw new Error("Data de agendamento é obrigatória");
    }

    if (input.scheduledAt < new Date()) {
      throw new Error("Não é possível criar lembrete para uma data no passado");
    }

    // Criar nova entidade (sem ID, será gerado pelo repositório)
    const reminder = new Reminder({
      id: "", // Será preenchido pelo repositório
      userId: input.userId,
      description: input.description.trim(),
      scheduledAt: input.scheduledAt,
      completed: false,
      commentCount: 0,
      attachmentCount: 0,
    });

    // Persistir no repositório
    const created = await this.reminderRepository.createReminder(reminder);

    return created;
  }
}
