import { t } from 'app/I18N';

function getTitleLabel(template) {
  const titleField = template.commonProperties.find(p => p.name === 'title');
  return t(template._id, titleField.label);
}

function getMetadataFieldLabel(field, template) {
  const name = field.split('.')[1];
  const property = template.properties.find(p => p.name === name);
  return (property && t(template._id, property.label)) || field;
}

export default function getFieldLabel(field, template) {
  const _template = template && template.toJS ? template.toJS() : template;
  if (field === 'title' && _template) {
    return getTitleLabel(_template);
  }
  if (field.startsWith('metadata.') && _template) {
    return getMetadataFieldLabel(field, _template) || field;
  }
  return field;
}
