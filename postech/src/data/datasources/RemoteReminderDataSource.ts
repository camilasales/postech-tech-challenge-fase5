/**
 * Data Source: RemoteReminderDataSource
 * Responsável pela comunicação com a API remota para lembretes
 */
import { API_BASE_URL } from "@/config/api";
import type { ReminderDTO } from "../mappers/ReminderMapper";

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error("Falha de conexão com o servidor");
    }
    throw e;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export class RemoteReminderDataSource {
  /**
   * Obter todos os lembretes de um usuário
   */
  async getRemindersByUserId(userId: string): Promise<ReminderDTO[]> {
    const res = await safeFetch(`${API_BASE_URL}/reminders?userId=${userId}`);
    if (!res.ok) throw new Error("Erro ao buscar lembretes");
    return parseJson<ReminderDTO[]>(res);
  }

  /**
   * Obter lembrete por ID
   */
  async getReminderById(id: string): Promise<ReminderDTO> {
    const res = await safeFetch(`${API_BASE_URL}/reminders/${id}`);
    if (!res.ok) throw new Error("Lembrete não encontrado");
    return parseJson<ReminderDTO>(res);
  }

  /**
   * Criar novo lembrete
   */
  async createReminder(reminder: ReminderDTO): Promise<ReminderDTO> {
    const res = await safeFetch(`${API_BASE_URL}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reminder),
    });
    if (!res.ok) throw new Error("Erro ao criar lembrete");
    return parseJson<ReminderDTO>(res);
  }

  /**
   * Atualizar lembrete
   */
  async updateReminder(reminder: ReminderDTO): Promise<ReminderDTO> {
    const res = await safeFetch(`${API_BASE_URL}/reminders/${reminder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reminder),
    });
    if (!res.ok) throw new Error("Erro ao atualizar lembrete");
    return parseJson<ReminderDTO>(res);
  }

  /**
   * Deletar lembrete
   */
  async deleteReminder(id: string): Promise<void> {
    const res = await safeFetch(`${API_BASE_URL}/reminders/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar lembrete");
  }

  /**
   * Obter tags disponíveis
   */
  async getTags(): Promise<Array<{ name: string; color: string }>> {
    const res = await safeFetch(`${API_BASE_URL}/tags`);
    if (!res.ok) throw new Error("Erro ao buscar tags");
    return parseJson<Array<{ name: string; color: string }>>(res);
  }
}
