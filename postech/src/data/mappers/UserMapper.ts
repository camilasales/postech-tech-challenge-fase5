/**
 * Mapper: UserMapper
 * Convertidor entre DTOs (da API) e Entidades de Domínio
 */
import { User } from "../../domain/entities/User";

/**
 * DTO (Data Transfer Object) recebido da API
 */
export type UserDTO = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
};

export class UserMapper {
  /**
   * Converter DTO para Entidade de Domínio
   */
  static toDomain(dto: UserDTO): User {
    return new User({
      id: dto.id,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      address: dto.address,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    });
  }

  /**
   * Converter Entidade para DTO (para enviar à API)
   */
  static toDTO(entity: User): UserDTO {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      phone: entity.phone,
      address: entity.address,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }
}
