/* eslint-disable no-console */
import P from 'bluebird';
import templates from '../templates/templates';
import mongoose from 'mongoose';
import translationsModel from '../i18n/translations';
import thesauris from '../thesauris/thesauris';

translationsModel.get()
.then((translations) => {
  let contextsWithoutTypes = [];
  translations.forEach((translation) => {
    translation.contexts.forEach((context) => {
      if (!context.type) {
        contextsWithoutTypes.push(context);
      }
    });
  });

  return P.resolve(contextsWithoutTypes).map((context) => {
    return thesauris.getById(context.id)
    .then((thesauri) => {
      if (thesauri) {
        context.type = 'Dictionary';
        return;
      }
      return templates.getById({_id: context.id});
    })
    .then((result) => {
      if (result) {
        context.type = 'Entity';
        return;
      }
    });
  }, {concurrency: 1})
  .then(() => {
    return P.resolve(translations).map((translation) => {
      return translationsModel.save(translation);
    }, {concurrency: 1});
  });
})
.then(() => {
  mongoose.disconnect();
})
.catch((e) => {
  console.log(e);
  mongoose.disconnect();
});
