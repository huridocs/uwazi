import passport from 'passport';
import LocalStrategy from 'passport-local';
import SHA256 from 'crypto-js/sha256';
import users from 'api/users/users';

passport.use('local', new LocalStrategy(
  (username, password, done) => {
    users.get({username, password: SHA256(password).toString()})
    .then(results => done(null, results[0]), () => done(null, false));
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
