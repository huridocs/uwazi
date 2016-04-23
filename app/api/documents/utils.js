export function updateMetadataNames(documents, nameMatches) {
  documents.forEach((doc) => {
    let oldMetadata = Object.assign({}, doc.metadata);
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
