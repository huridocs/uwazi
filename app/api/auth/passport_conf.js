import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from 'api/users/users';
import { tenants } from 'api/tenants/tenantContext';

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

passport.deserializeUser((serializeUser, done) => {
  const currentTenant = tenants.current().name;
  const [id, serializedTenant] = serializeUser.split('///');
  if (serializedTenant !== currentTenant) {
    return done(null, false);
  }

  users.getById(id, '-password').then(user => {
    done(null, user);
  });
});
