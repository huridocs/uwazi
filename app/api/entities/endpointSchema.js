/** @format */

import Joi from 'joi';

// Must match entitiesModel.js interfaces!
const dateRangeSchema = Joi.object().keys({
  from: Joi.number().allow(null),
  to: Joi.number().allow(null),
});

// Must match entitiesModel.js interfaces!
const metadataSchema = Joi.object()
  .keys()
  .pattern(
    Joi.string(),
    Joi.array().items(
      Joi.object().keys({
        value: Joi.alternatives().try(
          Joi.number(),
          Joi.string(),
          dateRangeSchema,
          Joi.object().keys({
            lat: Joi.number(),
            lon: Joi.number(),
            label: Joi.string().allow(null).allow(''),
          }),
          Joi.object().keys({
            label: Joi.string(),
            url: Joi.string(),
          })
        ),
        label: Joi.string().allow(null).allow(''),
      })
    )
  );

const iconSchema = Joi.object().keys({
  _id: Joi.string().allow(null),
  label: Joi.string(),
  type: Joi.string(),
});

const saveSchema = Joi.object()
  .keys({
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
      language: Joi.string(),
      timestamp: Joi.number(),
    }),
    fullText: Joi.any(),
    totalPages: Joi.number(),
    icon: iconSchema,
    toc: Joi.array().items(
      Joi.object().keys({
        _id: Joi.string(),
        label: Joi.string(),
        indentation: Joi.number(),
        range: Joi.object().keys({
          start: Joi.number(),
          end: Joi.number(),
        }),
      })
    ),
    attachments: Joi.array().items(
      Joi.object().keys({
        _id: Joi.string(),
        originalname: Joi.string(),
        filename: Joi.string(),
        mimetype: Joi.string(),
        size: Joi.number(),
        timestamp: Joi.number(),
      })
    ),
    creationDate: Joi.number(),
    processed: Joi.boolean(),
    uploaded: Joi.boolean(),
    published: Joi.boolean(),
    metadata: metadataSchema,
    user: Joi.string(),
  })
  .required();

export { iconSchema, metadataSchema, saveSchema };
