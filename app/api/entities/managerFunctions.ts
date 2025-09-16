import { groupBy } from 'lodash';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { WithId } from 'api/odm';
import { files as filesAPI, storage } from 'api/files';
import { processDocument } from 'api/files/processDocument';
import { search } from 'api/search';
import { legacyLogger } from 'api/log';
import { handleError, prettifyError } from 'api/utils/handleError';
import { ClientEntitySchema } from 'app/istore';
import { FileType } from 'shared/types/fileType';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { TypeOfFile } from 'shared/types/fileSchema';
import { FileAttachment } from './entitySavingManager';

const prepareNewFiles = async (
  entity: EntityWithFilesSchema,
  updatedEntity: EntityWithFilesSchema,
  newAttachments: FileAttachment[] = [],
  newDocuments: FileAttachment[] = []
) => {
  const attachments: FileType[] = [];
  const documents: FileType[] = [];

  const newUrls = entity.attachments?.filter(attachment => !attachment._id && attachment.url);

  if (newAttachments.length) {
    await Promise.all(
      newAttachments.map(async file => {
        await storage.storeFile(file.filename, createReadStream(file.path), 'attachment');
        attachments.push({
          ...file,
          entity: updatedEntity.sharedId,
          type: TypeOfFile.attachment,
        });
      })
    );
  }

  if (newDocuments.length) {
    await Promise.all(
      newDocuments.map(async doc => {
        await storage.storeFile(doc.filename, createReadStream(doc.path), 'document');
        documents.push({
          ...doc,
          entity: updatedEntity.sharedId,
          type: TypeOfFile.document,
        });
      })
    );
  }

  if (newUrls && newUrls.length) {
    await Promise.all(
      newUrls.map(async (url: any) => {
        attachments.push({
          ...url,
          entity: updatedEntity.sharedId,
          type: TypeOfFile.attachment,
        });
      })
    );
  }

  return { attachments, documents };
};

const updateDeletedFiles = async (
  entityFiles: WithId<FileType>[],
  entity: EntityWithFilesSchema,
  type: TypeOfFile.attachment | TypeOfFile.document
) => {
  const deletedFiles = entityFiles.filter(
    existingFile =>
      existingFile._id &&
      existingFile.type === type &&
      !entity[type === TypeOfFile.attachment ? 'attachments' : 'documents']?.find(
        attachment => attachment._id?.toString() === existingFile._id.toString()
      )
  );
  const fileIdList = deletedFiles.map(file => file._id.toString());
  const fileNameList = fileIdList.map(fileId => `${fileId}.jpg`);
  await filesAPI.delete({
    $or: [{ _id: { $in: fileIdList } }, { filename: { $in: fileNameList } }],
  });
};

const filterRenamedFiles = (entity: EntityWithFilesSchema, entityFiles: WithId<FileType>[]) => {
  const process = (files: FileType[]) =>
    files
      .filter(
        (file: FileType) =>
          file._id &&
          entityFiles.find(
            entityFile =>
              file._id?.toString() === entityFile._id.toString() &&
              file.originalname !== entityFile.originalname
          )
      )
      .map((file: FileType) => ({
        _id: file._id!.toString(),
        originalname: file.originalname,
      }));

  const renamedAttachments = entity.attachments ? process(entity.attachments) : [];

  const renamedDocuments = entity.documents ? process(entity.documents) : [];

  return { renamedAttachments, renamedDocuments };
};

const processFiles = async (
  entity: EntityWithFilesSchema,
  updatedEntity: EntityWithFilesSchema,
  fileAttachments: FileAttachment[] | undefined,
  documentAttachments: FileAttachment[] | undefined
) => {
  const { attachments, documents } = await prepareNewFiles(
    entity,
    updatedEntity,
    fileAttachments,
    documentAttachments
  );

  if (entity._id && (entity.attachments || entity.documents)) {
    const entityFiles: WithId<FileType>[] = await filesAPI.get(
      { entity: entity.sharedId, type: { $in: [TypeOfFile.attachment, TypeOfFile.document] } },
      '_id, originalname, type'
    );

    await updateDeletedFiles(entityFiles, entity, TypeOfFile.attachment);
    await updateDeletedFiles(entityFiles, entity, TypeOfFile.document);

    const { renamedAttachments, renamedDocuments } = filterRenamedFiles(entity, entityFiles);

    attachments.push(...renamedAttachments);
    documents.push(...renamedDocuments);
  }

  return { proccessedAttachments: attachments, proccessedDocuments: documents };
};

const bindAttachmentToMetadataProperty = (
  _values: MetadataObjectSchema[],
  attachments: FileType[]
) => {
  // 📍 CALL STACK TRACKING: bindAttachmentToMetadataProperty entry
  console.log('🔄 [CALL STACK] bindAttachmentToMetadataProperty() ENTRY');
  console.log('📍 [CALL STACK] Stack trace:', new Error().stack);
  console.log('📊 [CALL STACK] Input data:', {
    values: _values,
    attachmentsCount: attachments.length,
    attachments: attachments.map((att, idx) => ({ 
      index: idx, 
      filename: att.filename, 
      originalname: att.originalname,
      type: att.type 
    }))
  });

  const values = _values;
  if (_values[0].attachment !== undefined) {
    const attachmentIndex = _values[0].attachment;
    const originalValue = _values[0].value;
    
    console.log('🔍 [CALL STACK] Processing attachment:', {
      attachmentIndex,
      originalValue,
      attachmentsAvailable: attachments.length,
      attachmentExists: attachments[attachmentIndex] ? true : false,
      attachmentDetails: attachments[attachmentIndex] ? {
        filename: attachments[attachmentIndex].filename,
        originalname: attachments[attachmentIndex].originalname
      } : null
    });

    // Check if attachment exists
    if (attachments[attachmentIndex]) {
      const newValue = `/api/files/${attachments[attachmentIndex].filename}`;
      values[0].value = newValue;
      console.log('✅ [CALL STACK] Attachment bound successfully:', {
        index: attachmentIndex,
        filename: attachments[attachmentIndex].filename,
        newValue
      });
    } else {
      values[0].value = '';
      console.log('❌ [CALL STACK] Attachment not found, setting empty value:', {
        index: attachmentIndex,
        availableAttachments: attachments.length
      });
    }

    // Handle time links
    if (_values[0].timeLinks !== undefined && _values[0].timeLinks.length > 0) {
      const timeLinks = _values[0].timeLinks.replace(/([()])/g, '');
      const finalValue = `(${values[0].value}, ${timeLinks})`;
      values[0].value = finalValue;
      console.log('⏰ [CALL STACK] Time links added:', {
        originalTimeLinks: _values[0].timeLinks,
        cleanedTimeLinks: timeLinks,
        finalValue
      });
    }
  } else {
    console.log('ℹ️ [CALL STACK] No attachment to bind');
  }

  console.log('🏁 [CALL STACK] bindAttachmentToMetadataProperty() EXIT');
  console.log('📊 [CALL STACK] Final values:', values);
  return values;
};

const handleAttachmentInMetadataProperties = (
  entity: EntityWithFilesSchema,
  attachments: FileType[]
) => {
  // 📍 CALL STACK TRACKING: handleAttachmentInMetadataProperties entry
  console.log('🔄 [CALL STACK] handleAttachmentInMetadataProperties() ENTRY');
  console.log('📍 [CALL STACK] Stack trace:', new Error().stack);
  console.log('📊 [CALL STACK] Input data:', {
    entityTitle: entity.title,
    entitySharedId: entity.sharedId,
    attachmentsCount: attachments.length,
    metadataKeys: Object.keys(entity.metadata || {}),
    metadata: entity.metadata,
    attachments: attachments.map((att, idx) => ({ 
      index: idx, 
      filename: att.filename, 
      originalname: att.originalname,
      type: att.type 
    }))
  });

  Object.entries(entity.metadata || {}).forEach(([propertyName, _values]) => {
    if (_values && _values.length) {
      console.log(`🔍 [CALL STACK] Processing property: ${propertyName}`, {
        originalValue: _values[0]?.value,
        hasAttachment: _values[0]?.attachment !== undefined,
        attachmentIndex: _values[0]?.attachment,
        timeLinks: _values[0]?.timeLinks
      });
      
      console.log(`🔄 [CALL STACK] About to call bindAttachmentToMetadataProperty() for ${propertyName}`);
      const values = bindAttachmentToMetadataProperty(_values, attachments);
      console.log(`✅ [CALL STACK] bindAttachmentToMetadataProperty() completed for ${propertyName}`);
      console.log(`📊 [CALL STACK] Result for ${propertyName}:`, {
        finalValue: values[0]?.value,
        hadAttachment: _values[0]?.attachment !== undefined,
        hadTimeLinks: _values[0]?.timeLinks !== undefined
      });
      
      delete values[0].attachment;
      delete values[0].timeLinks;
      
      console.log(`🧹 [CALL STACK] Cleaned up attachment/timeLinks for ${propertyName}`);
    }
  });

  console.log('🏁 [CALL STACK] handleAttachmentInMetadataProperties() EXIT');
  console.log('📊 [CALL STACK] Final entity metadata:', entity.metadata);
  return entity;
};

const saveFiles = async (
  attachments: FileType[],
  documents: FileType[],
  entity: ClientEntitySchema
) => {
  const saveResults: string[] = [];

  const { documentsToProcess = [], documentsToSave = [] } = groupBy(documents, document =>
    document._id ? 'documentsToSave' : 'documentsToProcess'
  );

  const filesToSave = [...attachments, ...documentsToSave];

  await Promise.all(
    filesToSave.map(async file => {
      try {
        await filesAPI.save(file, false);
      } catch (e) {
        legacyLogger.error(prettifyError(e));
        saveResults.push(`Could not save file/s: ${file.originalname}`);
      }
    })
  );

  if (documentsToProcess.length) {
    const documentsBeingProcessed = Promise.allSettled(
      documentsToProcess.map(async document => processDocument(entity.sharedId!, document))
    ).then(results => {
      results
        .filter(result => result.status === 'rejected')
        .map(rejected => handleError(rejected.reason));
    });

    await documentsBeingProcessed;
  }

  if (attachments.length || documents.length) {
    await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
  }

  return saveResults;
};

export { handleAttachmentInMetadataProperties, processFiles, saveFiles };
