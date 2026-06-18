import { CreateUser, Dependencies } from '#api/core/application/CreateUser.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class CreateUserUseCaseFactory {
  static default(overrides?: Partial<Dependencies>) {
    const useCase = new CreateUser({ usersDS: UsersDataSourceFactory.default(), ...overrides });
    return useCase;
  }
}
