import passport from 'passport';
import users from '#api/users/users.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { usersDirectoryEnabled } from '#api/core/infrastructure/factories/usersBackendFlags.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { appContext } from '#api/utils/AppContext.js';

passport.serializeUser((user, done) => {
  done(null, `${user._id}///${tenants.current().name}`);
});

// Sessions are established by LoginController, which calls `req.logIn` itself; deserialization
// is not part of the login use case, so nothing here belongs in it. Which backend answers is
// UsersDirectory's business, under the separate `usersDirectory` rollout flag (D8).
passport.deserializeUser(async (serializeUser, done) => {
  try {
    const currentTenant = tenants.current().name;
    const [id, serializedTenant] = serializeUser.split('///');
    if (serializedTenant !== currentTenant) {
      return done(null, false);
    }
    // getProfile, not getById: the session user carries `groups` (permissionsContext
    // derives permission refIds from them) plus `using2fa` and `accountLocked`, which
    // ServerUsersService.mapCurrentUser reads off the context user. `?? null` preserves the
    // exact `done(null, null)` a vanished user produces today.
    const user = usersDirectoryEnabled()
      ? ((await UsersDirectoryFactory.default().getProfile(id)).getData() ?? null)
      : await users.getById(id, '-password', true);

    appContext.set('user', user);
    done(null, user);
  } catch (e) {
    done(e);
  }
});
