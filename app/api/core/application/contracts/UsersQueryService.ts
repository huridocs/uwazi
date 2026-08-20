import type { UserRole } from '#api/core/domain/user/User.js';
import type { UserProfile } from './UserReadModels.js';

interface UsersQueryService {
  listUsers(): Promise<UserProfile[]>;
  countByRole(): Promise<Record<UserRole, number>>;
}

export type { UsersQueryService };
