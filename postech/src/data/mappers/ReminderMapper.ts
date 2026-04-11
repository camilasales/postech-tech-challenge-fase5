/**
 * Mapper: ReminderMapper
 * Convertidor entre DTOs (da API) e Entidades de Domínio
 */
import { Reminder, ReminderTag } from "../../domain/entities/Reminder";

/**
 * DTO recebido da API
 */
export type ReminderDTO = {
  id: string;
  userId: string;
  description: string;
  scheduledAt: string;
  completed: boolean;
  tag?: { name: string; color: string };
  commentCount?: number;
  attachmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export class ReminderMapper {
  /**
   * Converter DTO para Entidade de Domínio
   */
  static toDomain(dto: ReminderDTO): Reminder {
    return new Reminder({
      id: dto.id,
      userId: dto.userId,
      description: dto.description,
      scheduledAt: new Date(dto.scheduledAt),
      completed: dto.completed,
      tag: dto.tag ? new ReminderTag(dto.tag) : undefined,
      commentCount: dto.commentCount,
      attachmentCount: dto.attachmentCount,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    });
  }

  /**
   * Converter Entidade para DTO
   */
  static toDTO(entity: Reminder): ReminderDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      description: entity.description,
      scheduledAt: entity.scheduledAt.toISOString(),
      completed: entity.completed,
      tag: entity.tag
        ? { name: entity.tag.name, color: entity.tag.color }
        : undefined,
      commentCount: entity.commentCount,
      attachmentCount: entity.attachmentCount,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }

  /**
   * Converter múltiplos DTOs
   */
  static toDomainList(dtos: ReminderDTO[]): Reminder[] {
    return dtos.map((dto) => this.toDomain(dto));
  }
}
