import type { ClientProperty } from '#V2/shared/types.js';

const buildTemplatePropertyById = (properties: ClientProperty[] | undefined) => {
  const map = new Map<string, ClientProperty>();
  for (const p of properties ?? []) {
    if (typeof p._id === 'string') {
      map.set(p._id, p);
    }
  }
  return map;
};

export { buildTemplatePropertyById };
