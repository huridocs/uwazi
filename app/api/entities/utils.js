export function updateMetadataNames(documents, nameMatches) {
  documents.forEach((doc) => {
    const oldMetadata = Object.assign({}, doc.metadata);
    Object.keys(doc.metadata).forEach((propertyName) => {
      if (nameMatches[propertyName]) {
        delete doc.metadata[propertyName];
        doc.metadata[nameMatches[propertyName]] = oldMetadata[propertyName];
      }
    });
  });

  return documents;
}

export function deleteMetadataProperties(documents, properties = []) {
  documents.forEach((doc) => {
    properties.forEach((property) => {
      delete doc.metadata[property];
    });
  });

  return documents;
}

export function removeEntityFilenames(entities) {
  return entities.map((entity) => {
    const safeEntity = { ...entity, file: { ...entity.file } };
    if (entity.file) {
      delete safeEntity.file.filename;
    }
    if (safeEntity.attachments) {
      safeEntity.attachments = safeEntity.attachments.map((attachment) => {
        const safeAttachment = { ...attachment };
        delete safeAttachment.filename;
        return safeAttachment;
      });
    }
    return safeEntity;
  });
}
