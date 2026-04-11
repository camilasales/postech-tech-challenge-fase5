/**
 * Service Locator / Dependency Injection
 * Gerencia a criação e injeção de dependências
 * Centraliza todas as instâncias de repositórios e use cases
 */
import { RemoteAuthDataSource } from "../data/datasources/RemoteAuthDataSource";
import { LocalUserDataSource } from "../data/datasources/LocalUserDataSource";
import { RemoteReminderDataSource } from "../data/datasources/RemoteReminderDataSource";
import { AuthRepositoryImpl } from "../data/repositories/AuthRepositoryImpl";
import { UserRepositoryImpl } from "../data/repositories/UserRepositoryImpl";
import { ReminderRepositoryImpl } from "../data/repositories/ReminderRepositoryImpl";
import {
  SignInUseCase,
  SignUpUseCase,
  SignOutUseCase,
  UpdateUserProfileUseCase,
  GetRemindersUseCase,
  CreateReminderUseCase,
  ToggleReminderCompletionUseCase,
} from "../domain/usecases";

/**
 * Singleton para gerenciar todas as dependências
 */
class ServiceLocator {
  private static instance: ServiceLocator;

  // Data Sources
  private remoteAuthDataSource!: RemoteAuthDataSource;
  private localUserDataSource!: LocalUserDataSource;
  private remoteReminderDataSource!: RemoteReminderDataSource;

  // Repositories
  private authRepository!: AuthRepositoryImpl;
  private userRepository!: UserRepositoryImpl;
  private reminderRepository!: ReminderRepositoryImpl;

  // Use Cases
  private signInUseCase!: SignInUseCase;
  private signUpUseCase!: SignUpUseCase;
  private signOutUseCase!: SignOutUseCase;
  private updateUserProfileUseCase!: UpdateUserProfileUseCase;
  private getRemindersUseCase!: GetRemindersUseCase;
  private createReminderUseCase!: CreateReminderUseCase;
  private toggleReminderCompletionUseCase!: ToggleReminderCompletionUseCase;

  private constructor() {
    this.initialize();
  }

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  /**
   * Inicializar todas as dependências
   */
  private initialize(): void {
    // Data Sources
    this.remoteAuthDataSource = new RemoteAuthDataSource();
    this.localUserDataSource = new LocalUserDataSource();
    this.remoteReminderDataSource = new RemoteReminderDataSource();

    // Repositories
    this.authRepository = new AuthRepositoryImpl(
      this.remoteAuthDataSource,
      this.localUserDataSource,
    );
    this.userRepository = new UserRepositoryImpl(
      this.localUserDataSource,
      this.remoteAuthDataSource,
    );
    this.reminderRepository = new ReminderRepositoryImpl(
      this.remoteReminderDataSource,
    );

    // Use Cases
    this.signInUseCase = new SignInUseCase(
      this.authRepository,
      this.userRepository,
    );
    this.signUpUseCase = new SignUpUseCase(
      this.authRepository,
      this.userRepository,
    );
    this.signOutUseCase = new SignOutUseCase(
      this.authRepository,
      this.userRepository,
    );
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      this.userRepository,
    );
    this.getRemindersUseCase = new GetRemindersUseCase(this.reminderRepository);
    this.createReminderUseCase = new CreateReminderUseCase(
      this.reminderRepository,
    );
    this.toggleReminderCompletionUseCase = new ToggleReminderCompletionUseCase(
      this.reminderRepository,
    );
  }

  // Getter methods
  getAuthRepository() {
    return this.authRepository;
  }

  getUserRepository() {
    return this.userRepository;
  }

  getReminderRepository() {
    return this.reminderRepository;
  }

  getSignInUseCase() {
    return this.signInUseCase;
  }

  getSignUpUseCase() {
    return this.signUpUseCase;
  }

  getSignOutUseCase() {
    return this.signOutUseCase;
  }

  getUpdateUserProfileUseCase() {
    return this.updateUserProfileUseCase;
  }

  getGetRemindersUseCase() {
    return this.getRemindersUseCase;
  }

  getCreateReminderUseCase() {
    return this.createReminderUseCase;
  }

  getToggleReminderCompletionUseCase() {
    return this.toggleReminderCompletionUseCase;
  }

  /**
   * Reset para testes
   */
  reset(): void {
    this.initialize();
  }
}

export const serviceLocator = ServiceLocator.getInstance();
