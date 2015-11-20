import bodyParser from 'body-parser'
import fetch from 'isomorphic-fetch'
import passport from 'passport'
import LocalStrategy from 'passport-local'


passport.use('local', new LocalStrategy(
  function(username, password, done){
    var user = username+password;
    console.log('authenticating');
    fetch('http://127.0.0.1:5984/uwazi/_design/users/_view/users/?key="'+user+'"')
    .then(response => response.json())
    .then(json => done(null, json.rows.length > 0))
  })
)

export default app => {

  app.use(bodyParser.json());
  app.use(passport.initialize());

  app.post('/api/login',
  passport.authenticate('local', { session: false }),
  function(req, res) {
    console.log('success');
    res.json({success: true});
  });
}
