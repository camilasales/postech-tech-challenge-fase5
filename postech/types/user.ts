export type AppUser = {
  id: string;
  email: string;
  name: string;
  /** Preenchido pelo usuário na tela de perfil (persistido localmente). */
  phone?: string;
  address?: string;
};

/** Campos editáveis no modal de perfil (e-mail não entra aqui). */
export type ProfileEditablePayload = {
  name: string;
  phone: string;
  address: string;
};
