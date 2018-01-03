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
  const referenceTemplate = templates.find(template => template._id.toString() === reference.entityData.template.toString());
  if (reference.sourceType === 'metadata') {
    return conformGroupData('metadata', groupedReferences, {
      key: reference.entityProperty,
      context: reference.entityData.template.toString(),
      connectionLabel: referenceTemplate
                       .properties
                       .find(p => p.name === reference.entityProperty)
                       .label
    });
  }
  if (reference.sourceType !== 'metadata') {
    return conformGroupData('connection', groupedReferences, {
      key: reference.template.toString(),
      context: reference.template.toString(),
      connectionLabel: relationTypes.find((r) => {
        return r._id.toString() === reference.template.toString();
      }).name
    });
  }
}

export default {
  filterRelevantReferences: (references, locale, user) => {
    return references.filter(ref => {
      return Boolean(ref.entityData && ref.entityData.published || user);
    });
  },

  groupReferences: (references, templates, relationTypes) => {
    const groupedReferences = [];
    references.forEach((reference) => {
      const groupData = getGroupData(reference, groupedReferences, templates, relationTypes);

      let groupDataTemplate = groupData.templates.find(template => template._id.toString() === reference.entityData.template.toString());

      if (!groupDataTemplate) {
        const referenceTemplate = templates.find(template => template._id.toString() === reference.entityData.template.toString());
        groupDataTemplate = {
          _id: reference.entityData.template.toString(),
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
