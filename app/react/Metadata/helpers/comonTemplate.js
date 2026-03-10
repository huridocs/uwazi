import Immutable from 'immutable';
import comonProperties from 'shared/commonProperties';

export default (templates, entities) => {
  const selectedTemplates = entities
    .map(entity => entity.get('template'))
    .filter((type, index, _types) => _types.indexOf(type) === index);
  const properties = comonProperties.comonProperties(templates, selectedTemplates);
  const _id = selectedTemplates.size === 1 ? selectedTemplates.first() : '';

  const withoutTemplate = entities.reduce((memo, entity) => memo && !entity.get('template'), true);

  if (withoutTemplate) {
    return Immutable.fromJS(templates.find(template => template.default));
  }
  return Immutable.fromJS({ _id, properties });
};
