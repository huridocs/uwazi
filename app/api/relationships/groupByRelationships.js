function getGroupData(reference, groupedReferences, templates, relationTypes) {
  const key = reference.template ? reference.template.toString() : null;
  let groupData = groupedReferences.find(ref => ref.key === key);
  if (!groupData) {
    groupData = {
      key,
      context: reference.template ? reference.template.toString() : null,
      connectionLabel: reference.template ? relationTypes.find(r => r._id.toString() === reference.template.toString()).name : null,
      templates: []
    };
    groupedReferences.push(groupData);
  }
  return groupData;
}

const filterRelevantRelationships = (relationships, id, locale, user) => relationships.filter(
  ref => Boolean(ref.entity !== id && (ref.entityData && ref.entityData.published || user))
);

const groupRelationships = (relationships, templates, relationTypes) => {
  const groupedReferences = [];
  relationships.forEach((reference) => {
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
};

export {
  filterRelevantRelationships,
  groupRelationships
};
