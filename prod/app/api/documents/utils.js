"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.updateMetadataNames = updateMetadataNames;exports.deleteMetadataProperties = deleteMetadataProperties;function updateMetadataNames(documents, nameMatches) {
  documents.forEach(doc => {
    const oldMetadata = Object.assign({}, doc.metadata);
    Object.keys(doc.metadata).forEach(propertyName => {
      if (nameMatches[propertyName]) {
        delete doc.metadata[propertyName];
        doc.metadata[nameMatches[propertyName]] = oldMetadata[propertyName];
      }
    });
  });

  return documents;
}

function deleteMetadataProperties(documents, properties = []) {
  documents.forEach(doc => {
    properties.forEach(property => {
      delete doc.metadata[property];
    });
  });

  return documents;
}