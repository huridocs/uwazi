/* eslint-disable max-statements */
import { createError } from '#api/utils/index.js';
import { encryptPassword } from '#api/auth/encryptPassword.js';
import { getByMemberIdList } from '#api/usergroups/userGroupsMembers.js';

import mailer from '../utils/mailer.js';
import model from './usersModel.js';
import passwordRecoveriesModel from './passwordRecoveriesModel.js';
import settings from '../settings/settings.js';
import { generateUnlockCode } from './generateUnlockCode.js';

function conformRecoverText(options, _settings, domain, key, user) {
  const response = {};
  if (!options.newUser) {
    response.subject = 'Password recovery';
    response.text =
      `Your username is: ${user.username}\n` +
      `To set your password click on the following link:\n${domain}/setpassword/${key}\nThis link will be valid for 24 hours.`;
  }

  if (options.newUser) {
    const siteName = _settings.site_name || 'Uwazi';
    response.subject = `Welcome to ${siteName}`;
    const text =
      'Hello!\n\n' +
      `The administrators of ${siteName} have created an account for you under the user name:\n` +
      `${user.username}\n\n` +
      'To complete this process, please create a strong password by clicking on the following link:\n' +
      `${domain}/setpassword/${key}?createAccount=true\n` +
      'This link will be valid for 24 hours.\n\n' +
      'For more information about the Uwazi platform, visit https://www.uwazi.io.\n\nThank you!\nUwazi team';

    const htmlLink = `<a href="${domain}/setpassword/${key}?createAccount=true">${domain}/setpassword/${key}?createAccount=true</a>`;

    response.text = text;
    response.html = `<p>${response.text
      .replace(new RegExp(user.username, 'g'), `<b>${user.username}</b>`)
      .replace(new RegExp(`${domain}/setpassword/${key}\\?createAccount=true`, 'g'), htmlLink)
      .replace(/https:\/\/www.uwazi.io/g, '<a href="https://www.uwazi.io">https://www.uwazi.io</a>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />')}</p>`;
  }

  return response;
}

const populateGroupsOfUsers = async (user, groups) => {
  const memberships = groups
    .filter(group => group.members.find(member => member.refId === user._id.toString()))
    .map(group => ({
      _id: group._id,
      name: group.name,
    }));
  return { ...user, groups: memberships };
};

export default {
  /**
   * @deprecated v1 Mongo-only query path, no longer routed through the postgresUsers flag
   * (see UsersDAOFactory) since PostgresUsersDAO has no equivalent generic get(). Still the
   * legitimate v1 fallback for routes.ts's /api/users GET route (v2UsersGet off) and for
   * activitylog/helpers.js, entitiesPermissions.ts, userGroups.ts when `usersDirectory` is
   * off — those call sites read through UsersDirectory when it is on. `collaborators.ts` and
   * `search.js` no longer appear here: they went to UsersDirectory unconditionally, which
   * resolves the backend itself (plan 05 step 1).
   */
  async get(query, select) {
    const users = await model.get({ ...query, deletedAt: { $exists: false } }, select);
    if (typeof select === 'string' && select.includes('+groups')) {
      const userIds = users.map(user => user._id.toString());
      const groups = await getByMemberIdList(userIds);
      return Promise.all(users.map(user => populateGroupsOfUsers(user, groups)));
    }
    return users;
  },

  /**
   * @deprecated v1 single-user read. Use `UsersDirectory` (`UsersDirectoryFactory.default()`),
   * which resolves the backend itself and returns a read model that cannot carry credentials.
   * Pick the method by what the caller actually needs (D1/D3):
   *
   * | this call | UsersDirectory |
   * |---|---|
   * | `getById(id)` | `getById` → `UserView` |
   * | `getById(id, '', true)` | `getProfile` → adds `groups`, `using2fa`, `accountLocked` |
   * | `getById(id, '', _, true)` | `getActor` → the only read that resolves a soft-deleted user |
   * | `getById(id, '+password')` | **nothing** — no read model carries a password. Load the
   *   aggregate through `UsersDataSource` instead. |
   *
   * Every production caller has moved; what is left is the `v2UsersGet` fallback for
   * routes.ts's /api/users GET route, and this method's own consistency spec
   * (`UsersGettersConsistency.spec.ts`), which pins its behaviour across that flag.
   */
  async getById(id, select = '', includeGroups = false, includeDeleted = false) {
    const [user] = await model.get(
      { _id: id, ...(!includeDeleted && { deletedAt: { $exists: false } }) },
      select
    );

    if (includeGroups && user) {
      const groups = await getByMemberIdList([user._id.toString()]);
      return populateGroupsOfUsers(user, groups);
    }

    return user ?? null;
  },

  /**
   * @deprecated
   * v1 self-service account unlock flow. Only reached while the tenant's
   * `v2UsersUtilityRoutes` flag is off (see `UnlockAccountController`). Use the
   * v2 `UnlockAccount` use case (`UnlockAccountUseCaseFactory`) instead.
   */
  async unlockAccount({ username, code }) {
    const [user] = await model.get(
      { username, accountUnlockCode: code, deletedAt: { $exists: false } },
      '_id'
    );

    if (!user) {
      throw createError('Invalid username or unlock code', 403);
    }

    return model.save({
      ...user,
      accountLocked: false,
      accountUnlockCode: false,
      failedLogins: false,
    });
  },

  /**
   * @deprecated
   * v1 admin unlock flow. Only reached while the tenant's
   * `v2UsersUtilityRoutes` flag is off (see `UnlockBlockedUserController`), and
   * also called internally by the legacy `resetPassword` below. Use the v2
   * `UnlockBlockedUser` use case (`UnlockBlockedUserUseCaseFactory`) instead.
   */
  async simpleUnlock(_id) {
    await model.updateMany(
      { _id },
      { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }
    );
  },

  /**
   * @deprecated
   * v1 password recovery flow — writes the Mongo `passwordrecoveries`
   * collection directly via `passwordRecoveriesModel`, bypassing
   * `PasswordRecoveriesDataSourceFactory` entirely. Only reached while the
   * tenant's `v2UsersUtilityRoutes` flag is off (see
   * `RecoverPasswordController`), but note that reach is independent of
   * `postgresPasswordRecoveries` — enabling that flag alone does not stop
   * this method from hitting Mongo. Use the v2 `RecoverPassword` use case
   * (`RecoverPasswordUseCaseFactory`) instead.
   *
   * Its `options.newUser` branch is now only reachable from specs: the welcome email is
   * dispatched as a `SendWelcomeEmailHandler` job by the v2 `CreateUser` use case.
   */
  recoverPassword(email, domain, options = {}) {
    const key = generateUnlockCode();
    return Promise.all([model.get({ email, deletedAt: { $exists: false } }), settings.get()]).then(
      ([_user, _settings]) => {
        const user = _user[0];
        if (user) {
          return passwordRecoveriesModel.save({ key, user: user._id }).then(() => {
            const emailSender = mailer.createSenderDetails(_settings);
            const mailOptions = { from: emailSender, to: email };
            const mailTexts = conformRecoverText(options, _settings, domain, key, user);
            mailOptions.subject = mailTexts.subject;
            mailOptions.text = mailTexts.text;

            if (options.newUser) {
              mailOptions.html = mailTexts.html;
            }

            return mailer.send(mailOptions);
          });
        }

        return undefined;
      }
    );
  },

  /**
   * @deprecated
   * v1 password reset flow — reads/deletes the Mongo `passwordrecoveries`
   * collection directly via `passwordRecoveriesModel`, bypassing
   * `PasswordRecoveriesDataSourceFactory` entirely; see the note on
   * `recoverPassword` above — the same `postgresPasswordRecoveries`
   * caveat applies here. Use the v2 `ResetPassword` use case
   * (`ResetPasswordUseCaseFactory`) instead.
   */
  async resetPassword(credentials) {
    const [key] = await passwordRecoveriesModel.get({ key: credentials.key });
    if (key) {
      const [user] = await model.get({ _id: key.user, deletedAt: { $exists: false } }, '_id');
      if (!user) {
        throw createError('User not found', 404);
      }
      return Promise.all([
        passwordRecoveriesModel.delete(key._id),
        model
          .save({ _id: key.user, password: await encryptPassword(credentials.password) })
          .then(() => this.simpleUnlock({ _id: key.user })),
      ]);
    }
    throw createError('key not found', 403);
  },
};
