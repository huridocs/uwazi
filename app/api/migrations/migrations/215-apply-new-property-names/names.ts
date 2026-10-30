type PropertyDoc = {
  name?: string;
  label?: string;
  type?: string;
};

const SUFFIXED_TYPES = new Set(['geolocation', 'nested']);
const KEPT_NAMES = new Set(['title', 'creationDate', 'editDate']);

const generateNewSafeName = (label: string) =>
  label
    .trim()
    .replace(/[# \\ / | * ? " < > = \s : . [ \] % ! \- & ^ + ( ) { } [ \] ~]/gi, '_')
    .replace(/^[ _ \- + $]/, '')
    .toLowerCase();

const sourceLabel = (property: PropertyDoc): string => {
  const label = property.label ?? '';
  if (property.type && SUFFIXED_TYPES.has(property.type)) {
    return `${label}_${property.type}`;
  }
  return label;
};

const nextName = (property: PropertyDoc): string | undefined => {
  if (!property.name || !property.label || KEPT_NAMES.has(property.name)) {
    return undefined;
  }
  const generated = generateNewSafeName(sourceLabel(property));
  if (!generated || generated === property.name) {
    return undefined;
  }
  return generated;
};

export type { PropertyDoc };
export { nextName };
