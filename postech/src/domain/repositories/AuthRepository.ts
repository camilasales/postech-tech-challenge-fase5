/**
 * Interface de Repositório: AuthRepository
 * Contrato independente de implementação (Remote API, Local Storage, etc)
 * Define operações de autenticação
 */
import type { User } from "../entities/User";

export interface AuthRepository {
  /**
   * Fazer login e obter um usuário
   */
  signIn(email: string, password: string): Promise<User>;

  /**
   * Registrar um novo usuário
   */
  signUp(email: string, password: string, name: string): Promise<User>;

  /**
   * Fazer logout
   */
  signOut(): Promise<void>;

  /**
   * Verificar se há uma sessão ativa
   */
  getCurrentUser(): Promise<User | null>;
}
