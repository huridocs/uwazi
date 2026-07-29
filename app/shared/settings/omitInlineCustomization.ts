/**
 * customCSS / customJS are inlined into the HTML head during SSR.
 * Keep them out of the client settings atom / serialized blob.
 */
const omitInlineCustomization = <T extends Record<string, unknown>>(settings: T): T => {
  const { customCSS: _customCSS, customJS: _customJS, ...rest } = settings;
  return rest as T;
};

export { omitInlineCustomization };
