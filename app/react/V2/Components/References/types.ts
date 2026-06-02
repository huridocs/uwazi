import type { EntityReference } from '#V2/formatters/relationships/types.js';

type ReferenceWithTemplate = EntityReference & {
  targetEntity: EntityReference['targetEntity'] & {
    template: { _id: string; name: string; color: string };
  };
};

export type { ReferenceWithTemplate };
