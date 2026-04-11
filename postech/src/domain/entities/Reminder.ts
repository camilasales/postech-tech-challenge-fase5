/**
 * Entidade de Domínio: ReminderTag
 */
export class ReminderTag {
  readonly name: string;
  readonly color: string;

  constructor(props: { name: string; color: string }) {
    this.name = props.name;
    this.color = props.color;
  }
}

/**
 * Entidade de Domínio: Reminder
 * Representa um lembrete/tarefa no sistema
 * Independente de UI e contém lógica de negócio
 */
export class Reminder {
  readonly id: string;
  readonly userId: string;
  readonly description: string;
  readonly scheduledAt: Date;
  readonly completed: boolean;
  readonly tag?: ReminderTag;
  readonly commentCount: number;
  readonly attachmentCount: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(props: {
    id: string;
    userId: string;
    description: string;
    scheduledAt: Date;
    completed: boolean;
    tag?: ReminderTag;
    commentCount?: number;
    attachmentCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.description = props.description;
    this.scheduledAt = props.scheduledAt;
    this.completed = props.completed;
    this.tag = props.tag;
    this.commentCount = props.commentCount ?? 0;
    this.attachmentCount = props.attachmentCount ?? 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Lógica de negócio: verificar se o lembrete está vencido
   */
  isOverdue(now: Date = new Date()): boolean {
    return !this.completed && this.scheduledAt < now;
  }

  /**
   * Lógica de negócio: verificar se o lembrete é para hoje
   */
  isToday(now: Date = new Date()): boolean {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const reminderDate = new Date(this.scheduledAt);
    reminderDate.setHours(0, 0, 0, 0);

    return reminderDate.getTime() === today.getTime();
  }

  /**
   * Criar nova instância com status atualizado (padrão imutável)
   */
  toggleCompletion(): Reminder {
    return new Reminder({
      id: this.id,
      userId: this.userId,
      description: this.description,
      scheduledAt: this.scheduledAt,
      completed: !this.completed,
      tag: this.tag,
      commentCount: this.commentCount,
      attachmentCount: this.attachmentCount,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Criar nova instância com descrição atualizada
   */
  updateDescription(newDescription: string): Reminder {
    return new Reminder({
      id: this.id,
      userId: this.userId,
      description: newDescription,
      scheduledAt: this.scheduledAt,
      completed: this.completed,
      tag: this.tag,
      commentCount: this.commentCount,
      attachmentCount: this.attachmentCount,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
