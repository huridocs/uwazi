import type { EntitySchema } from '#shared/types/entityType.js';

type MetadataFieldProps = {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
};

interface Entity extends EntitySchema {
  _id: string;
  templateId: string;
}

export type { MetadataFieldProps, Entity };
