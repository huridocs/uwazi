function getGroupData(reference, groupedReferences, templates, relationTypes) {
  let key = reference.template.toString();
  let groupData = groupedReferences.find(ref => ref.key === key);

  if (!groupData) {
    groupData = {
      key: reference.template ? reference.template.toString() : null,
      context: reference.template ? reference.template.toString() : null,
      connectionLabel: reference.template ? relationTypes.find((r) => {
        return r._id.toString() === reference.template.toString();
      }).name : null,
      templates: []
    };
    groupedReferences.push(groupData);
  }

  return groupData;
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
