import passport from 'passport';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { appContext } from '#api/utils/AppContext.js';

passport.serializeUser((user, done) => {
  done(null, `${user._id}///${tenants.current().name}`);
});

passport.deserializeUser(async (serializeUser, done) => {
  try {
    const currentTenant = tenants.current().name;
    const [id, serializedTenant] = serializeUser.split('///');
    if (serializedTenant !== currentTenant) {
      return done(null, false);
    }
    // getProfile: the session user needs `groups` (permissionsContext derives permission
    // refIds from them) plus `using2fa` and `accountLocked`.
    const user = (await UsersDirectoryFactory.default().getProfile(id)).getData() ?? null;

    appContext.set('user', user);
    done(null, user);
  } catch (e) {
    done(e);
  }
});
