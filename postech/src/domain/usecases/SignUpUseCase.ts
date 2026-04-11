/**
 * Use Case: SignUpUseCase
 * Lógica de registro - independente de UI
 */
import type { AuthRepository } from "../repositories/AuthRepository";
import type { UserRepository } from "../repositories/UserRepository";
import type { User } from "../entities/User";

export class SignUpUseCase {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(email: string, password: string, name: string): Promise<User> {
    // Validar entrada
    if (!email || !password || !name) {
      throw new Error("Email, senha e nome são obrigatórios");
    }

    if (password.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres");
    }

    if (!this.isValidEmail(email)) {
      throw new Error("Email inválido");
    }

    // Chamar repositório para registrar
    const user = await this.authRepository.signUp(email, password, name);

    // Salvar no cache local
    await this.userRepository.cacheUser(user);

    return user;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
