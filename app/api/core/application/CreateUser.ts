import { User } from '../domain/user/User.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { CreateUserDTO, UserCreateSchema } from './contracts/UserCreateSchema.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';

type Input = CreateUserDTO;

type Output = User;

type Dependencies = { usersDS: UsersDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Dependencies> {
  static InputSchema = UserCreateSchema;

  async execute(input: Input): Promise<Output> {
    const { password, ...userData } = input;

    const user = new User({ _id: this.idGenerator.generate(), ...userData });

    const userExists = await this.deps.usersDS.userExists(user);

    if (userExists) {
      // this is likely a domain error
      // throw new UserExistsError();
    }

    user.initPassword(password);

    await this.transactionManager.run(async () => {
      //the insert will update groups
      await this.deps.usersDS.insert(user);
    });

    //this service is from a new model for the passwordrecoveries
    // this.deps.services.sendRecoveryEmail(user);

    return user;
  }
}

export { CreateUser };
export type { Input, Dependencies };

// async newUser(user, domain) {
//   const [userNameMatch, emailMatch] = await Promise.all([
//     model.get({ username: user.username }),
//     model.get({ email: user.email }),
//   ]);
//   if (user.username && user.username.includes(' ')) {
//     return Promise.reject(createError('Usernames can not contain spaces.', 400));
//   }
//   if (userNameMatch.length || emailMatch.length) {
//     const message = userNameMatch.length ? 'Username already exists' : 'Email already exists';
//     return Promise.reject(createError(message, 409));
//   }
//   const password = user.password ? user.password : random();
//   const _user = await model.save({
//     ...user,
//     password: await encryptPassword(password),
//     using2fa: undefined,
//     secret: undefined,
//   });
//   if (user.groups && user.groups.length > 0) {
//     await updateUserMemberships(_user, user.groups);
//   }
//   await this.recoverPassword(user.email, domain, { newUser: true });
//   return _user;
// },
