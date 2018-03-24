/* eslint-disable no-console */
import P from 'bluebird';
import mongoose from 'mongoose';

import templates from '../templates/templates';
import thesauris from '../thesauris/thesauris';
import translationsModel from '../i18n/translations';

translationsModel.get()
.then((translations) => {
  const contextsWithoutTypes = [];
  translations.forEach((translation) => {
    translation.contexts.forEach((context) => {
      if (!context.type) {
        contextsWithoutTypes.push(context);
      }
    });
  });

  return P.resolve(contextsWithoutTypes).map(context => thesauris.getById(context.id)
  .then((thesauri) => {
    if (thesauri) {
      context.type = 'Dictionary';
      return;
    }
    return templates.getById({ _id: context.id });
  })
  .then((result) => {
    if (result && result.isEntity) {
      context.type = 'Entity';
      return;
    }
    if (result) {
      context.type = 'Document';
    }
  }), { concurrency: 1 })
  .then(() => P.resolve(translations).map(translation => translationsModel.save(translation), { concurrency: 1 }));
})
.then(() => {
  mongoose.disconnect();
})
.catch((e) => {
  console.log(e);
  mongoose.disconnect();
});
