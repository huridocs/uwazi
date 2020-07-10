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
    const conflictAtType =
      this.props.templateProperty.typeConflict || this.props.templateProperty.relationConflict;
    return (
      <tr className="property-atributes is-active">
        <td>
          <Icon icon="file" /> {this.props.templateProperty.template}
        </td>
        <td
          {...(conflictAtType && {
            className: 'conflict',
          })}
          {...(this.props.templateProperty.typeConflict && { title: titles.typeConflict })}
          {...(this.props.templateProperty.relationConflict && { title: titles.relationConflict })}
        >
          {conflictAtType && <Icon icon="exclamation-triangle" />}
          {/*<Icon icon={Icons[this.props.templateProperty.type.toLowerCase()] || 'fa fa-font'} />*/}
          <Icon icon={Icons.numeric || 'fa fa-font'} />
          {` ${this.props.templateProperty.type}`}
          {this.props.templateProperty.relationTypeName &&
            ` (${this.props.templateProperty.relationTypeName})`}
        </td>
        <td
          className={this.props.templateProperty.contentConflict ? 'conflict' : ''}
          {...(this.props.templateProperty.contentConflict && { title: titles.contentConflict })}
        >
          {this.props.templateProperty.contentConflict && <Icon icon="exclamation-triangle" />}
          {this.props.templateProperty.thesaurusName && <Icon icon="book" />}
          {this.props.templateProperty.thesaurusName}
        </td>
      </tr>
    );
  }
}
