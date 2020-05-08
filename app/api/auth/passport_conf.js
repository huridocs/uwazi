import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from 'api/users/users';

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
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  users.getById(id, '-password').then(user => {
    done(null, user);
  });
});
