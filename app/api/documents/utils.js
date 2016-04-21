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
