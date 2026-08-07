import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from '#api/users/users.js';
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
// same way. users.getById already routes through UsersDAOFactory under the separate v2UsersGet
// flag (see app/api/users/users.js:252-273) — deserialization isn't part of the login use case.
passport.deserializeUser(async (serializeUser, done) => {
  try {
    const currentTenant = tenants.current().name;
    const [id, serializedTenant] = serializeUser.split('///');
    if (serializedTenant !== currentTenant) {
      return done(null, false);
    }
    const user = await users.getById(id, '-password', true);
    appContext.set('user', user);
    done(null, user);
  } catch (e) {
    done(e);
  }
});
