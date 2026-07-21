import { EntityIcon } from './Entity.js';
import { EntityTranslationProps } from './EntityTranslation.js';

/**s
 * Data Transfer Object representing an Entity.
 * This was created to represent an Entity as a simple key/value object.
 *
 * We have control over its structure, so it makes part of domain layer.
 */

type EntityDTO = {
  sharedId: string;
  translations: EntityTranslationProps[];
  templateId: string;
  userId?: string;
  icon?: EntityIcon;
  generatedToc?: boolean;
};

export type { EntityDTO };
