import { AdapterEntity } from './types';

export class SupportingFilesProcessor {
  attachSupportingFiles(entities: AdapterEntity[]): void {
    entities.forEach(entity => {
      const { rawEntity } = entity;
      const toAssign: Partial<AdapterEntity> = {};

      if (
        rawEntity?.documents &&
        Array.isArray(rawEntity.documents) &&
        rawEntity.documents.length > 0
      ) {
        toAssign.documents = rawEntity.documents;
        [toAssign.mainDocument] = rawEntity.documents;
      }

      if (
        rawEntity?.attachments &&
        Array.isArray(rawEntity.attachments) &&
        rawEntity.attachments.length > 0
      ) {
        toAssign.attachments = rawEntity.attachments;
      }

      if (Object.keys(toAssign).length > 0) {
        Object.assign(entity, toAssign);
      }
    });
  }
}
