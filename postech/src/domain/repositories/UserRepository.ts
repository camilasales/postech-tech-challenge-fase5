/**
 * Interface de Repositório: UserRepository
 * Contrato para operações com usuários
 */
import type { User } from "../entities/User";

export interface UserRepository {
  /**
   * Obter usuário por ID
   */
  getUserById(id: string): Promise<User | null>;

  /**
   * Atualizar perfil do usuário
   */
  updateProfile(user: User): Promise<User>;

  /**
   * Salvar usuário localmente (cache)
   */
  cacheUser(user: User): Promise<void>;

  /**
   * Obter usuário do cache local
   */
  getCachedUser(): Promise<User | null>;

  /**
   * Limpar cache do usuário
   */
  clearCache(): Promise<void>;
}
