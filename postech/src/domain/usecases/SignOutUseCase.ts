/**
 * Use Case: SignOutUseCase
 * Lógica de logout - independente de UI
 */
import type { AuthRepository } from "../repositories/AuthRepository";
import type { UserRepository } from "../repositories/UserRepository";

export class SignOutUseCase {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(): Promise<void> {
    // Fazer logout na API
    await this.authRepository.signOut();

    // Limpar cache local
    await this.userRepository.clearCache();
  }
}
