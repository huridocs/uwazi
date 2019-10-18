"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getLocaleTranslation = getLocaleTranslation;exports.getContext = getContext;exports.default = translate;function getLocaleTranslation(translations, locale) {
  return translations.find(d => d.locale === locale) || { contexts: [] };
}

function getContext(translation, contextId) {
  return translation.contexts.find(ctx => ctx.id === contextId) || { values: {} };
}

function translate(context, key, text) {
  return context.values[key] || text;
}