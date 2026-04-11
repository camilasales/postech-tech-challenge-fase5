/**
 * AuthContext refatorado com Clean Architecture
 * Exemplo de como integrar use cases com React Context
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { serviceLocator } from "@/src/di/ServiceLocator";
import type { User } from "@/src/domain/entities/User";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  error: Error | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider que gerencia o estado de autenticação
 * Utiliza os use cases da camada de domínio
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Injetar dependências dos use cases
  const signInUseCase = useMemo(() => serviceLocator.getSignInUseCase(), []);
  const signUpUseCase = useMemo(() => serviceLocator.getSignUpUseCase(), []);
  const signOutUseCase = useMemo(() => serviceLocator.getSignOutUseCase(), []);
  const updateUserProfileUseCase = useMemo(
    () => serviceLocator.getUpdateUserProfileUseCase(),
    [],
  );
  const userRepository = useMemo(() => serviceLocator.getUserRepository(), []);

  // Carregar usuário em cache ao inicializar
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cachedUser = await userRepository.getCachedUser();
        if (!cancelled && cachedUser) {
          setUser(cachedUser);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e : new Error("Erro ao carregar usuário"),
          );
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userRepository]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const authenticatedUser = await signInUseCase.execute(email, password);
        setUser(authenticatedUser);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Erro ao fazer login");
        setError(err);
        throw err;
      }
    },
    [signInUseCase],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setError(null);
        const newUser = await signUpUseCase.execute(email, password, name);
        setUser(newUser);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Erro ao registrar");
        setError(err);
        throw err;
      }
    },
    [signUpUseCase],
  );

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await signOutUseCase.execute();
      setUser(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Erro ao fazer logout");
      setError(err);
      throw err;
    }
  }, [signOutUseCase]);

  const updateProfile = useCallback(
    async (updates: { name?: string; phone?: string; address?: string }) => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        setError(null);
        const updated = await updateUserProfileUseCase.execute(user, updates);
        setUser(updated);
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error("Erro ao atualizar perfil");
        setError(err);
        throw err;
      }
    },
    [user, updateUserProfileUseCase],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: user !== null,
      signIn,
      signUp,
      signOut,
      updateProfile,
      error,
      clearError,
    }),
    [
      user,
      initializing,
      signIn,
      signUp,
      signOut,
      updateProfile,
      error,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar o AuthContext
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
