export function formatNames(matches) {
  return matches.reduce((names, match) => {
    names.push(match.template);
    return names;
  }, [])
  .join(', ').replace(/(,) (\w* *\w*$)/, ' and $2');
}

export function findSameLabelProperties(label, templates, currentTemplateId) {
  return templates
  .filter((template) => template._id !== currentTemplateId)
  .map((template) => {
    let property = template.properties.find((prop) => {
      return prop.label === label & prop.filter;
    });

    if (property) {
      return {template: template.name, property};
    }
  })
  .filter((match) => match);
}
