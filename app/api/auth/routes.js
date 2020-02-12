/** @format */

import Joi from 'joi';
import cookieParser from 'cookie-parser';
import mongoConnect from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import uniqueID from 'shared/uniqueID';
import svgCaptcha from 'svg-captcha';
import settings from 'api/settings';
import urljoin from 'url-join';

import { validation } from '../utils';

import './passport_conf.js';

const MongoStore = mongoConnect(session);

export default app => {
  app.use(cookieParser());

  app.use(
    session({
      secret: app.get('env') === 'production' ? uniqueID() : 'harvey&lola',
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
      }),
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.post(
    '/api/login',

    validation.validateRequest(
      Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
        token: Joi.string(),
      }).required()
    ),

    (req, res, next) => {
      passport.authenticate('local', (err, user) => {
        if (err) {
          next(err);
          return;
        }
        req.logIn(user, error => {
          if (error) {
            next(err);
            return;
          }
          res.status(200);
          res.json({ success: true });
        });
      })(req, res, next);
    }
  );

  app.get('/api/user', (req, res) => {
    res.json(req.user || {});
  });

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  app.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.createMathExpr({ mathMin: 1, mathMax: 19, mathOperator: '+' });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.send(captcha.data);
  });

  app.get('/remotecaptcha', async (req, res) => {
    const { publicFormDestination } = await settings.get({}, { publicFormDestination: 1 });
    const remoteResponse = await fetch(urljoin(publicFormDestination, '/captcha'));
    const [remotecookie] = remoteResponse.headers._headers['set-cookie'];
    req.session.remotecookie = remotecookie;
    res.type('svg');
    remoteResponse.body.pipe(res);
  });
};
