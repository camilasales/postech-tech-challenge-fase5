/**
 * Implementação: ReminderRepository
 * Implementação concreta da interface de repositório de lembretes
 */
import type { ReminderRepository as IReminderRepository } from "../../domain/repositories/ReminderRepository";
import { Reminder, ReminderTag } from "../../domain/entities/Reminder";
import { RemoteReminderDataSource } from "../datasources/RemoteReminderDataSource";
import { ReminderMapper } from "../mappers/ReminderMapper";

export class ReminderRepositoryImpl implements IReminderRepository {
  constructor(private remoteReminderDataSource: RemoteReminderDataSource) {}

  async getRemindersByUserId(userId: string): Promise<Reminder[]> {
    const dtos =
      await this.remoteReminderDataSource.getRemindersByUserId(userId);
    return ReminderMapper.toDomainList(dtos);
  }

  async getReminderById(id: string): Promise<Reminder | null> {
    try {
      const dto = await this.remoteReminderDataSource.getReminderById(id);
      return ReminderMapper.toDomain(dto);
    } catch {
      return null;
    }
  }

  async createReminder(reminder: Reminder): Promise<Reminder> {
    const dto = ReminderMapper.toDTO(reminder);
    const created = await this.remoteReminderDataSource.createReminder(dto);
    return ReminderMapper.toDomain(created);
  }

  async updateReminder(reminder: Reminder): Promise<Reminder> {
    const dto = ReminderMapper.toDTO(reminder);
    const updated = await this.remoteReminderDataSource.updateReminder(dto);
    return ReminderMapper.toDomain(updated);
  }

  async deleteReminder(id: string): Promise<void> {
    await this.remoteReminderDataSource.deleteReminder(id);
  }

  async toggleReminderCompletion(id: string): Promise<Reminder> {
    const reminder = await this.getReminderById(id);
    if (!reminder) {
      throw new Error("Lembrete não encontrado");
    }

    const toggled = reminder.toggleCompletion();
    return this.updateReminder(toggled);
  }

  async getTags(): Promise<ReminderTag[]> {
    const tags = await this.remoteReminderDataSource.getTags();
    return tags.map((tag) => new ReminderTag(tag));
  }

  async searchReminders(
    userId: string,
    query: {
      status?: "pending" | "completed" | "all";
      dateRange?: { from: Date; to: Date };
      tag?: string;
    },
  ): Promise<Reminder[]> {
    let reminders = await this.getRemindersByUserId(userId);

    // Filtrar por status
    if (query.status && query.status !== "all") {
      const isPending = query.status === "pending";
      reminders = reminders.filter((r) => r.completed !== isPending);
    }

    // Filtrar por intervalo de datas
    if (query.dateRange) {
      reminders = reminders.filter(
        (r) =>
          r.scheduledAt >= query.dateRange!.from &&
          r.scheduledAt <= query.dateRange!.to,
      );
    }

    // Filtrar por tag
    if (query.tag) {
      reminders = reminders.filter((r) => r.tag?.name === query.tag);
    }

    return reminders;
  }
}
