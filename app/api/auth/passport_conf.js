import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from 'api/users/users';
import { tenants } from 'api/tenants/tenantContext';
import { appContext } from 'api/utils/AppContext';

const getDomain = req => `${req.protocol}://${req.get('host')}`;

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
