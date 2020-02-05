/** @format */

export function getLocaleTranslation(translations, locale) {
  return translations.find(d => d.locale === locale) || { contexts: [] };
}

export function getContext(translation, contextId = '') {
  return (
    translation.contexts.find(ctx => ctx.id.toString() === contextId.toString()) || { values: {} }
  );
}

export default function translate(context, key, text) {
  return context.values[key] || text;
}
