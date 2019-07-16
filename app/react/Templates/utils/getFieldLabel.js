import { t } from 'app/I18N';

export default function getFieldLabel(field, template) {
  const _template = template && template.toJS ? template.toJS() : template;
  if (field === 'title') {
    const titleField = _template.commonProperties.find(p => p.name === 'title');
    return t(_template._id, titleField.label);
  }
  if (field.startsWith('metadata.') && _template) {
    const name = field.split('.')[1];
    const property = _template.properties.find(p => p.name === name);
    if (property) {
      return t(_template._id, property.label);
    }
  }
  return field;
}
