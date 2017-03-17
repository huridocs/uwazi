function conformGroupData(connectionType, groupedReferences, options) {
  let {key, connectionLabel, context} = options;
  let groupData = groupedReferences.find(ref => ref.key === key);

  if (!groupData) {
    groupData = {key, connectionType, connectionLabel, templates: [], context};
    groupedReferences.push(groupData);
  }

  return groupData;
}

function getGroupData(reference, groupedReferences, templates, relationTypes) {
  const referenceTemplate = templates.find(template => template._id.toString() === reference.connectedDocumentTemplate.toString());
  if (reference.sourceType === 'metadata') {
    return conformGroupData('metadata', groupedReferences, {
      key: reference.sourceProperty,
      context: reference.connectedDocumentTemplate.toString(),
      connectionLabel: referenceTemplate
                       .properties
                       .find(p => p.name === reference.sourceProperty)
                       .label
    });
  }

  if (reference.sourceType !== 'metadata') {
    return conformGroupData('connection', groupedReferences, {
      key: reference.relationType.toString(),
      context: reference.relationType.toString(),
      connectionLabel: relationTypes.find(r => r._id.toString() === reference.relationType.toString()).name
    });
  }
}

export default {
  filterRelevantReferences: (references, locale, user) => {
    return references.filter(ref => {
      const isOutboundMetadata = !ref.inbound && ref.sourceType === 'metadata';
      const isOtherLocale = ref.language && ref.language !== locale;
      const publishedOrLoggedIn = Boolean(ref.connectedDocumentPublished || user);
      return !(isOtherLocale || isOutboundMetadata) && publishedOrLoggedIn;
    });
  },

  groupReferences: (references, templates, relationTypes) => {
    const groupedReferences = [];
    references.forEach((reference) => {
      const groupData = getGroupData(reference, groupedReferences, templates, relationTypes);

      let groupDataTemplate = groupData.templates.find(template => template._id.toString() === reference.connectedDocumentTemplate.toString());

      if (!groupDataTemplate) {
        const referenceTemplate = templates.find(template => template._id.toString() === reference.connectedDocumentTemplate.toString());

        groupDataTemplate = {
          _id: reference.connectedDocumentTemplate,
          label: referenceTemplate.name,
          count: 0,
          refs: []
        };

        groupData.templates.push(groupDataTemplate);
      }

      groupDataTemplate.refs.push(reference);
      groupDataTemplate.count += 1;
    });

    return groupedReferences;
  }
};
