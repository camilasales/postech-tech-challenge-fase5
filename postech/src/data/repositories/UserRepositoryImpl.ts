/**
 * Implementação: UserRepository
 * Implementação concreta da interface de repositório de usuário
 */
import type { UserRepository as IUserRepository } from "../../domain/repositories/UserRepository";
import type { User } from "../../domain/entities/User";
import { LocalUserDataSource } from "../datasources/LocalUserDataSource";
import { RemoteAuthDataSource } from "../datasources/RemoteAuthDataSource";
import { UserMapper } from "../mappers/UserMapper";

export class UserRepositoryImpl implements IUserRepository {
  constructor(
    private localUserDataSource: LocalUserDataSource,
    private remoteAuthDataSource: RemoteAuthDataSource,
  ) {}

  async getUserById(id: string): Promise<User | null> {
    // Por enquanto, obtém apenas do cache local
    const dto = await this.localUserDataSource.getUser();
    if (dto && dto.id === id) {
      return UserMapper.toDomain(dto);
    }
    return null;
  }

  async updateProfile(user: User): Promise<User> {
    // Converter entidade para DTO
    const dto = UserMapper.toDTO(user);

    // Salvar no cache local (simular persistência)
    await this.localUserDataSource.saveUser(dto);

    return user;
  }

  async cacheUser(user: User): Promise<void> {
    const dto = UserMapper.toDTO(user);
    await this.localUserDataSource.saveUser(dto);
  }

  async getCachedUser(): Promise<User | null> {
    const dto = await this.localUserDataSource.getUser();
    if (!dto) return null;
    return UserMapper.toDomain(dto);
  }

  async clearCache(): Promise<void> {
    await this.localUserDataSource.clear();
  }
}
