/**
 * Entidade de Domínio: User
 * Representa um usuário no sistema, independente da UI
 * Imutável e contém apenas lógica de negócio
 */
export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly address?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(props: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.phone = props.phone;
    this.address = props.address;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Lógica de negócio: validar se o usuário tem dados completos
   */
  isProfileComplete(): boolean {
    return !!(this.name && this.phone && this.address);
  }

  /**
   * Criar nova instância com dados atualizados (padrão imutável)
   */
  updateProfile(updates: {
    name?: string;
    phone?: string;
    address?: string;
  }): User {
    return new User({
      id: this.id,
      email: this.email,
      name: updates.name ?? this.name,
      phone: updates.phone ?? this.phone,
      address: updates.address ?? this.address,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
