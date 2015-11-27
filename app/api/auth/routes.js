import cookieParser from 'cookie-parser'
import session from 'express-session'
import passport from 'passport'
import './passport_conf.js';

export default app => {

  app.use(cookieParser());
  app.use(session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/api/login',
  passport.authenticate('local'),
  function(req, res) {
    res.json({success: true})
  });

  app.get('/api/user', function(req, res){
    res.json(req.user)
  });

  app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
  });
}
