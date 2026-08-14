import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from '#api/users/users.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { usersDirectoryEnabled } from '#api/core/infrastructure/factories/usersBackendFlags.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { appContext } from '#api/utils/AppContext.js';

const getDomain = req => `${req.protocol}://${tenants.current().domain}`;

passport.use(
  'local',
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      const token = req.body ? req.body.token : undefined;
      users
        .login({ username, password, token }, getDomain(req))
        .then(user => done(null, user))
        .catch(e => done(e));
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, `${user._id}///${tenants.current().name}`);
});

// No v2Login-specific branch here: sessions established via LoginController (v2Login on) and
// via the LocalStrategy above (v2Login off) both end up as passport sessions deserialized the
// same way — deserialization isn't part of the login use case. Which backend answers is
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
