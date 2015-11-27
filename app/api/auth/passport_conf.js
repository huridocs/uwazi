import fetch from 'isomorphic-fetch'
import passport from 'passport'
import LocalStrategy from 'passport-local'

passport.use('local', new LocalStrategy(
  function(username, password, done){
    var user = username+password;
    fetch('http://127.0.0.1:5984/uwazi/_design/users/_view/users/?key="'+user+'"')
    .then(response => response.json())
    .then(json => done(null, json.rows[0]), () => done(null, false))
  })
)

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  fetch('http://127.0.0.1:5984/uwazi/' + id)
  .then(response => response.json())
  .then(user => done(null, user))
});
