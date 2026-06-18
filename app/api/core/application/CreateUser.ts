import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { MongoUsersDataSource } from '../infrastructure/mongodb/user/MongoUsersDataSource.js';

const InputSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
});

type Input = z.infer<typeof InputSchema>;

type Output = User; //domain

type Deps = { usersDS: MongoUsersDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(input: Input): Promise<Output> {
    const { password, ...userData } = input;

    //MODEL SHOULD NOT TAKE PASSWORD IN THE CONSTRUCTOR
    const user = new User(userData);

    const userExists = this.deps.usersDS.userExists(user);

    if (userExists) {
      // this is likely a domain error
      throw new UserExistsError();
    }

    // if it undefined it will do it's own thing
    user.initPassword(password);

    await this.transactionManager.run(async () => {
      //the insert will update groups
      this.deps.usersDS.insert(user);
    });

    //this service is from a new model for the passwordrecoveries
    this.deps.services.sendRecoveryEmail(user);

    return user;
  }
}

export { CreateUser };
export type { Input };

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
