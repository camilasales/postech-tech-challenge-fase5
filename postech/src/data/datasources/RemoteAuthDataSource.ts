/**
 * Data Source: RemoteAuthDataSource
 * Responsável pela comunicação com a API remota para autenticação
 */
import { API_BASE_URL } from "@/config/api";
import type { UserDTO } from "../mappers/UserMapper";

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

export class RemoteAuthDataSource {
  /**
   * Fazer login na API remota
   */
  async signIn(email: string, password: string): Promise<UserDTO> {
    const res = await safeFetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Email ou senha inválidos");
    }

    const data = (await res.json()) as UserDTO;
    return data;
  }

  /**
   * Registrar novo usuário na API
   */
  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<UserDTO> {
    const res = await safeFetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Erro ao registrar");
    }

    const data = (await res.json()) as UserDTO;
    return data;
  }

  /**
   * Fazer logout
   */
  async signOut(): Promise<void> {
    await safeFetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    });
  }
}
