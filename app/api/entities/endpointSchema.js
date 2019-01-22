import Joi from 'joi';

const schema = Joi.object().keys({
  _id: Joi.string(),
  __v: Joi.number(),
  language: Joi.string(),
  mongoLanguage: Joi.string(),
  sharedId: Joi.string(),
  title: Joi.string(),
  type: Joi.string(),
  template: Joi.string(),
  file: Joi.object().keys({
    originalname: Joi.string(),
    filename: Joi.string(),
    mimetype: Joi.string(),
    size: Joi.number(),
    language: Joi.string()
  }),
  fullText: Joi.any(),
  totalPages: Joi.number(),
  icon: Joi.object().keys({
    _id: Joi.string(),
    label: Joi.string(),
    type: Joi.string()
  }),
  toc: Joi.array().items(Joi.object().keys({
    label: Joi.string(),
    indentation: Joi.number(),
    range: Joi.object().keys({
      start: Joi.number(),
      end: Joi.number()
    })
  })),
  attachments: Joi.array().items(Joi.object().keys({
    originalname: Joi.string(),
    filename: Joi.string(),
    mimetype: Joi.string(),
    size: Joi.number()
  })),
  creationDate: Joi.number(),
  processed: Joi.boolean(),
  uploaded: Joi.boolean(),
  published: Joi.boolean(),
  metadata: Joi.object().keys().pattern(Joi.string(), Joi.alternatives().try(
    Joi.number(),
    Joi.string(),
    Joi.array().items(Joi.alternatives().try(
      Joi.number(),
      Joi.string()
    )),
    Joi.array().items(Joi.object().pattern(Joi.string(),
      Joi.array().items(Joi.string())))
  )),
  pdfInfo: Joi.any(),
  user: Joi.string()
}).required();

export default schema;
