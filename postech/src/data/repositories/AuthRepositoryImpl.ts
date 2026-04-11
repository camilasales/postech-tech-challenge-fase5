/**
 * Implementação: AuthRepository
 * Implementação concreta da interface de repositório de autenticação
 */
import type { AuthRepository as IAuthRepository } from "../../domain/repositories/AuthRepository";
import type { User } from "../../domain/entities/User";
import { RemoteAuthDataSource } from "../datasources/RemoteAuthDataSource";
import { LocalUserDataSource } from "../datasources/LocalUserDataSource";
import { UserMapper } from "../mappers/UserMapper";

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    private remoteAuthDataSource: RemoteAuthDataSource,
    private localUserDataSource: LocalUserDataSource,
  ) {}

  async signIn(email: string, password: string): Promise<User> {
    // 1. Fazer requisição à API
    const dto = await this.remoteAuthDataSource.signIn(email, password);

    // 2. Converter DTO para entidade de domínio
    const user = UserMapper.toDomain(dto);

    // 3. Salvar no cache local
    await this.localUserDataSource.saveUser(dto);

    return user;
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    // 1. Fazer requisição à API
    const dto = await this.remoteAuthDataSource.signUp(email, password, name);

    // 2. Converter DTO para entidade de domínio
    const user = UserMapper.toDomain(dto);

    // 3. Salvar no cache local
    await this.localUserDataSource.saveUser(dto);

    return user;
  }

  async signOut(): Promise<void> {
    await this.remoteAuthDataSource.signOut();
    await this.localUserDataSource.removeUser();
  }

  async getCurrentUser(): Promise<User | null> {
    // Primeiro tenta obter do cache local
    const cached = await this.localUserDataSource.getUser();
    if (cached) {
      return UserMapper.toDomain(cached);
    }
    return null;
  }
}
