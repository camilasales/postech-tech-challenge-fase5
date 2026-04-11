/**
 * Use Case: UpdateUserProfileUseCase
 * Lógica de atualização de perfil - independente de UI
 */
import type { User } from "../entities/User";
import type { UserRepository } from "../repositories/UserRepository";

export class UpdateUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(
    user: User,
    updates: { name?: string; phone?: string; address?: string },
  ): Promise<User> {
    // Validar entrada
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error("Nome não pode estar vazio");
    }

    if (updates.phone !== undefined && !updates.phone.trim()) {
      throw new Error("Telefone não pode estar vazio");
    }

    if (updates.address !== undefined && !updates.address.trim()) {
      throw new Error("Endereço não pode estar vazio");
    }

    // Criar nova instância com dados atualizados
    const updatedUser = user.updateProfile(updates);

    // Persistir atualização
    const savedUser = await this.userRepository.updateProfile(updatedUser);

    return savedUser;
  }
}
