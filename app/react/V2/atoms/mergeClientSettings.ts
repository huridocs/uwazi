import { ClientSettings } from '#app/apiResponseTypes.js';

const mergeClientSettings = (prev: ClientSettings, incoming?: ClientSettings): ClientSettings => ({
  ...prev,
  ...incoming,
  features: {
    ...(prev.features ?? {}),
    ...(incoming?.features ?? {}),
  },
});

export { mergeClientSettings };
