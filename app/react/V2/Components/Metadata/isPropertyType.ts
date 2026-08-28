import type { PropertyTypeSchema } from '#shared/types/commonTypes.js';
import { propertyTypes } from '#shared/propertyTypes.js';

const PROPERTY_TYPES = new Set<string>(Object.values(propertyTypes));

const isPropertyType = (value: string): value is PropertyTypeSchema => PROPERTY_TYPES.has(value);

export { isPropertyType };
