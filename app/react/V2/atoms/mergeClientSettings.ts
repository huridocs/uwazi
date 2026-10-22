import { ClientSettings } from '#app/apiResponseTypes.js';
import { omitInlineCustomization } from '#shared/settings/omitInlineCustomization.js';

const previewFeatureKeys = [
  'newHeader',
  'featureFlagLibraryV2',
  'featureFlagEntityViewerv2',
  'themeCustomization',
];

const keptPreviewFeatures = (features: ClientSettings['features']) => {
  const kept: ClientSettings['features'] = {};
  if (!features) return kept;
  previewFeatureKeys.forEach(key => {
    if (features[key] === true) kept[key] = true;
  });
  return kept;
};

const mergeClientSettings = (prev: ClientSettings, incoming?: ClientSettings): ClientSettings => {
  const keepPreview = Boolean(prev.themeCustomization) && incoming?.themeCustomization === false;
  const merged = {
    ...prev,
    ...incoming,
    ...(keepPreview ? { themeCustomization: true } : {}),
    features: {
      ...(prev.features ?? {}),
      ...(incoming?.features ?? {}),
      ...(keepPreview ? keptPreviewFeatures(prev.features) : {}),
    },
  };

  // CSS/JS are applied via the SSR <head>; keep them out of the settings atom.
  return omitInlineCustomization(merged) as ClientSettings;
};

export { mergeClientSettings };
