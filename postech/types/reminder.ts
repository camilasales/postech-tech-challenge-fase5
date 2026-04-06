export type ReminderTag = {
  name: string;
  color: string;
};

export interface Reminder {
  id: string;
  userId: string;
  description: string;
  scheduledAt: Date;
  completed: boolean;
  tag?: ReminderTag;
  commentCount: number;
  attachmentCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ReminderStatusFilter = 'all' | 'pending' | 'completed';

export interface ReminderSummary {
  total: number;
  pending: number;
  completed: number;
  dueTodayPending: number;
}
