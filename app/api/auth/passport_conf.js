import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from 'api/users/users';

const getDomain = req => `${req.protocol}://${req.get('host')}`;

passport.use('local', new LocalStrategy(
  {
    passReqToCallback: true
  },
  (req, username, password, done) => {
    users.login({ username, password }, getDomain(req))
    .then(user => done(null, user))
    .catch(e => e.code === 401 ? done(null, false) : done(e));
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  users.getById(id)
  .then((user) => {
    delete user.password;
    done(null, user);
  });
});
