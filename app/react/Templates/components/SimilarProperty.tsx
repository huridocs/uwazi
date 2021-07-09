import React, { Component } from 'react';
import { Icon } from 'UI';
import { PropertySchema } from 'shared/types/commonTypes';
import Icons from './Icons';

const titles = {
  defaultTitle:
    'This property has the same configuration as others with the same label and will be used together.',
  contentConflict:
    'Properties with the same label but different thesauri as content are not allowed.',
  relationConflict:
    'Relationship properties with the same label but different relationship types are not allowed.',
  typeConflict: 'Properties with the same label but incompatible types are not allowed.',
  inheritConflict:
    'Properties with the same label but incompatible inherited types are not allowed.',
};

export interface TemplateProperty {
  template: string;
  relationTypeName?: string;
  thesaurusName?: string;
  typeConflict: boolean;
  relationConflict: boolean;
  contentConflict: boolean;
  type: PropertySchema['type'];
  inheritConflict: boolean;
  inheritType?: string;
}

export interface SimilarPropertiesProps {
  templateProperty: TemplateProperty;
}

const inheritTypeToShow = (prop: TemplateProperty) =>
  prop.inheritType ? prop.inheritType[0].toUpperCase() + prop.inheritType.slice(1) : '';

const invalidType = (prop: TemplateProperty) =>
  prop.typeConflict || prop.relationConflict || prop.inheritConflict;

const typeToShow = (prop: TemplateProperty) => prop.type[0].toUpperCase() + prop.type.slice(1);

const title = (prop: TemplateProperty) => {
  if (prop.inheritConflict) {
    return titles.inheritConflict;
  }
  if (prop.relationConflict) {
    return titles.relationConflict;
  }
  if (prop.typeConflict) {
    return titles.typeConflict;
  }
  return '';
};

const contentTitle = (prop: TemplateProperty) =>
  prop.contentConflict ? titles.contentConflict : '';

export class SimilarProperty extends Component<SimilarPropertiesProps> {
  render() {
    const { templateProperty } = this.props;
    const typeIcon = templateProperty.type as keyof typeof Icons;
    const invalidThesauri = templateProperty.contentConflict && templateProperty.thesaurusName;
    return (
      <tr className="property-atributes is-active">
        <td>
          <Icon icon="file" /> {templateProperty.template}
        </td>
        <td
          className={invalidType(templateProperty) ? 'conflict' : ''}
          title={title(templateProperty)}
        >
          {invalidType(templateProperty) && <Icon icon="exclamation-triangle" />}
          &nbsp;
          <Icon icon={Icons[typeIcon] || 'fa fa-font'} />
          &nbsp;
          {typeToShow(templateProperty)}
          {templateProperty.relationTypeName && ` (${templateProperty.relationTypeName})`}
          {inheritTypeToShow(templateProperty) &&
            ` (Inherit: ${inheritTypeToShow(templateProperty)})`}
        </td>
        <td
          className={templateProperty.contentConflict ? 'conflict' : ''}
          title={contentTitle(templateProperty)}
        >
          {invalidThesauri && <Icon icon="exclamation-triangle" />}
          {templateProperty.thesaurusName && <Icon icon="book" />}
          {templateProperty.thesaurusName}
        </td>
      </tr>
    );
  }
}
