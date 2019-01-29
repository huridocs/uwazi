import Joi from 'joi';
import contact from './contact';
import { validateRequest } from '../utils';

export default (app) => {
  app.post(
    '/api/contact',
    validateRequest(Joi.object().keys({
      email: Joi.string().required(),
      name: Joi.string().required(),
      message: Joi.string().required(),
    }).required()),
    (req, res, next) => contact.sendMessage(req.body).then(res.json)
    .catch(next));
};
