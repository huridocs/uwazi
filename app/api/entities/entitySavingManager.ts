import { set } from 'lodash';
import entities from 'api/entities/entities';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { UserSchema } from 'shared/types/userType';
import { handleAttachmentInMetadataProperties, processFiles, saveFiles } from './managerFunctions';

const saveEntity = async (
  _entity: EntityWithFilesSchema,
  {
    user,
    language,
    files: reqFiles,
  }: { user: UserSchema; language: string; socketEmiter?: Function; files?: FileAttachment[] }
) => {
  // 📍 CALL STACK TRACKING: saveEntity entry
  console.log('🚀 [CALL STACK] saveEntity() ENTRY');
  console.log('📍 [CALL STACK] Stack trace:', new Error().stack);
  console.log('📊 [CALL STACK] Entity data:', {
    title: _entity.title,
    template: _entity.template,
    metadataKeys: Object.keys(_entity.metadata || {}),
    metadata: _entity.metadata,
    reqFilesCount: reqFiles?.length || 0,
    reqFiles: reqFiles?.map(f => ({ 
      fieldname: f.fieldname, 
      originalname: f.originalname,
      filename: f.filename 
    }))
  });

  const { attachments, documents } = (reqFiles || []).reduce(
    (acum, file) => set(acum, file.fieldname, file),
    {
      attachments: [] as FileAttachment[],
      documents: [] as FileAttachment[],
    }
  );

  console.log('📁 [CALL STACK] Files organized:', {
    attachmentsCount: attachments.length,
    documentsCount: documents.length,
    attachments: attachments.map(att => ({ 
      fieldname: att.fieldname, 
      originalname: att.originalname,
      filename: att.filename 
    }))
  });

  console.log('🔄 [CALL STACK] About to call handleAttachmentInMetadataProperties()');
  const entity = handleAttachmentInMetadataProperties(_entity, attachments);
  console.log('✅ [CALL STACK] handleAttachmentInMetadataProperties() completed');
  console.log('📊 [CALL STACK] Entity after processing:', {
    title: entity.title,
    metadata: entity.metadata
  });

  console.log('💾 [CALL STACK] About to call entities.save()');
  const updatedEntity = await entities.save(
    entity,
    { user, language },
    { includeDocuments: false }
  );
  console.log('✅ [CALL STACK] entities.save() completed');
  console.log('📊 [CALL STACK] Updated entity:', {
    sharedId: updatedEntity.sharedId,
    metadata: updatedEntity.metadata
  });

  console.log('🔄 [CALL STACK] About to call processFiles()');
  const { proccessedAttachments, proccessedDocuments } = await processFiles(
    entity,
    updatedEntity,
    attachments,
    documents
  );
  console.log('✅ [CALL STACK] processFiles() completed');
  console.log('📊 [CALL STACK] Processed files:', {
    processedAttachmentsCount: proccessedAttachments.length,
    processedDocumentsCount: proccessedDocuments.length
  });

  console.log('🔄 [CALL STACK] About to call saveFiles()');
  const fileSaveErrors = await saveFiles(proccessedAttachments, proccessedDocuments, updatedEntity);
  console.log('✅ [CALL STACK] saveFiles() completed');
  console.log('📊 [CALL STACK] File save errors:', fileSaveErrors);

  console.log('🔄 [CALL STACK] About to call entities.getUnrestrictedWithDocuments()');
  const [entityWithAttachments]: EntityWithFilesSchema[] =
    await entities.getUnrestrictedWithDocuments(
      {
        sharedId: updatedEntity.sharedId,
        language: updatedEntity.language,
      },
      '+permissions'
    );
  console.log('✅ [CALL STACK] entities.getUnrestrictedWithDocuments() completed');
  console.log('📊 [CALL STACK] Final entity with attachments:', {
    sharedId: entityWithAttachments.sharedId,
    metadata: entityWithAttachments.metadata
  });

  console.log('🏁 [CALL STACK] saveEntity() EXIT');
  return { entity: entityWithAttachments, errors: fileSaveErrors };
};

export type FileAttachment = {
  originalname: string;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding?: string;
  destination: string;
  filename: string;
  path: string;
};

export { saveEntity };
