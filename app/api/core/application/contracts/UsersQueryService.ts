import type { UserRole } from '#api/core/domain/user/User.js';
import type { UserProfile, UserView } from './UserReadModels.js';

interface UsersQueryService {
  listUsers(): Promise<UserProfile[]>;
  countByRole(): Promise<Record<UserRole, number>>;
  /** Active users only: soft-deleted and public users are not found. */
  findByUsername(username: string): Promise<UserView | undefined>;
}

export type { UsersQueryService };
