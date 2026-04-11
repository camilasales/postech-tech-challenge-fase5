/**
 * Use Case: SignInUseCase
 * Lógica de autenticação - independente de UI
 */
import type { AuthRepository } from "../repositories/AuthRepository";
import type { UserRepository } from "../repositories/UserRepository";
import type { User } from "../entities/User";

export class SignInUseCase {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(email: string, password: string): Promise<User> {
    // Validar entrada
    if (!email || !password) {
      throw new Error("Email e senha são obrigatórios");
    }

    // Chamar repositório para autenticar
    const user = await this.authRepository.signIn(email, password);

    // Salvar no cache local
    await this.userRepository.cacheUser(user);

    return user;
  }
}
