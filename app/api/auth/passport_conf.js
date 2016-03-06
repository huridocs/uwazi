import fetch from 'isomorphic-fetch'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import {db_url} from '../config/database.js'
import SHA256 from 'crypto-js/sha256';

passport.use('local', new LocalStrategy(
  function(username, password, done){
    var user = username+SHA256(password).toString();
    fetch(db_url+'/_design/users/_view/users/?key="'+user+'"')
    .then(response => response.json())
    .then(json => done(null, json.rows[0]), () => done(null, false))
  })
)

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  fetch(db_url+'/'+ id)
  .then(response => response.json())
  .then(user => done(null, user))
});
