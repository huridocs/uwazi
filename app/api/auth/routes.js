import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import mongoConnect from 'connect-mongo';
import mongoose from 'mongoose';
import './passport_conf.js';

const MongoStore = mongoConnect(session);

export default (app) => {
  app.use(cookieParser());
  app.use(session({
    secret: 'Lola and Harvey',
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
      if (user === false) {
        res.status(401);
        res.json({status: 'Unauthorized'});
      } else {
        req.logIn(user, (error) => {
          if (error) {
            return next(err);
          }
          res.status(200);
          res.json({success: true});
        });
      }
    })(req, res, next);
  });

  app.get('/api/user', (req, res) => {
    res.json(req.user || {});
  });

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });
};
