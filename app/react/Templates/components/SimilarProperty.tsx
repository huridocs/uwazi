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
  typeConflict: 'Properties with the same label but different types are not allowed.',
};

interface TemplateProperty {
  template: string;
  relationTypeName: string;
  thesaurusName: string;
  typeConflict: boolean;
  relationConflict: boolean;
  contentConflict: boolean;
  type: string;
  property: PropertySchema;
}

interface MapStateProps {
  templateProperty: TemplateProperty;
}

export class SimilarProperty extends Component<MapStateProps> {
  render() {
    const typeIcon = this.props.templateProperty.type.toLowerCase() as keyof typeof Icons;
    const invalidType =
      this.props.templateProperty.typeConflict || this.props.templateProperty.relationConflict;
    const invalidThesauri =
      this.props.templateProperty.contentConflict && this.props.templateProperty.thesaurusName;
    return (
      <tr className="property-atributes is-active">
        <td>
          <Icon icon="file" /> {this.props.templateProperty.template}
        </td>
        <td
          {...(invalidType && {
            className: 'conflict',
          })}
          {...(this.props.templateProperty.typeConflict && { title: titles.typeConflict })}
          {...(this.props.templateProperty.relationConflict && { title: titles.relationConflict })}
        >
          {invalidType && <Icon icon="exclamation-triangle" />}
          <Icon icon={Icons[typeIcon] || 'fa fa-font'} />
          {` ${this.props.templateProperty.type}`}
          {this.props.templateProperty.relationTypeName &&
            ` (${this.props.templateProperty.relationTypeName})`}
        </td>
        <td
          className={this.props.templateProperty.contentConflict ? 'conflict' : ''}
          {...(this.props.templateProperty.contentConflict && { title: titles.contentConflict })}
        >
          {invalidThesauri && <Icon icon="exclamation-triangle" />}
          {this.props.templateProperty.thesaurusName && <Icon icon="book" />}
          {this.props.templateProperty.thesaurusName}
        </td>
      </tr>
    );
  }
}
