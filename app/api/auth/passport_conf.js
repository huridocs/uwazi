import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from 'api/users/users';

passport.use('local', new LocalStrategy(
  (username, password, done) => {
    users.login({ username, password })
    .then(user => done(null, user), () => done(null, false));
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
