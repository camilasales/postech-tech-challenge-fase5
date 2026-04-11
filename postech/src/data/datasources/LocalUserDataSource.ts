/**
 * Data Source: LocalUserDataSource
 * Responsável pelo armazenamento local (cache) do usuário
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserDTO } from "../mappers/UserMapper";

const STORAGE_KEY = "@postech/auth_user";

export class LocalUserDataSource {
  /**
   * Salvar usuário no armazenamento local
   */
  async saveUser(user: UserDTO): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Obter usuário do armazenamento local
   */
  async getUser(): Promise<UserDTO | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserDTO;
  }

  /**
   * Remover usuário do armazenamento local
   */
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Limpar todo o armazenamento de autenticação
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
