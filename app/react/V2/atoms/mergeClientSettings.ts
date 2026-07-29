import { ClientSettings } from '#app/apiResponseTypes.js';
import { omitInlineCustomization } from '#shared/settings/omitInlineCustomization.js';

const mergeClientSettings = (prev: ClientSettings, incoming?: ClientSettings): ClientSettings => {
  const merged = {
    ...prev,
    ...incoming,
    features: {
      ...(prev.features ?? {}),
      ...(incoming?.features ?? {}),
    },
  };

  // CSS/JS are applied via the SSR <head>; keep them out of the settings atom.
  return omitInlineCustomization(merged) as ClientSettings;
};

export { mergeClientSettings };
