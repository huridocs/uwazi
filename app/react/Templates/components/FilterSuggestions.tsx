import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

import { TemplateSchema } from 'shared/types/templateType';
import { IStore } from 'app/istore';
import { ensure } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
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

export const SimilarProperty = (props: MapStateProps) => (
  <tr className="property-atributes is-active">
    <td>
      <Icon icon="file" /> {props.templateProperty.template}
    </td>
    <td
      {...((props.templateProperty.typeConflict || props.templateProperty.relationConflict) && {
        className: 'conflict',
      })}
      {...(props.templateProperty.typeConflict && { title: titles.typeConflict })}
      {...(props.templateProperty.relationConflict && { title: titles.relationConflict })}
    >
      {(props.templateProperty.typeConflict || props.templateProperty.relationConflict) && (
        <Icon icon="exclamation-triangle" />
      )}
      {/*<Icon icon={Icons[props.templateProperty.type.toLowerCase()] || 'fa fa-font'} />*/}
      <Icon icon={Icons.numeric || 'fa fa-font'} />
      {` ${props.templateProperty.type}`}
      {props.templateProperty.relationTypeName && ` (${props.templateProperty.relationTypeName})`}
    </td>
    <td
      className={props.templateProperty.contentConflict ? 'conflict' : ''}
      {...(props.templateProperty.contentConflict && { title: titles.contentConflict })}
    >
      {props.templateProperty.contentConflict && <Icon icon="exclamation-triangle" />}
      {props.templateProperty.thesaurusName && <Icon icon="book" />}
      {props.templateProperty.thesaurusName}
    </td>
  </tr>
);

SimilarProperty.propTypes = {
  templateProperty: PropTypes.object.isRequired,
};

interface MatchedProperty {
  template: string;
  property: PropertySchema;
}

export class FilterSuggestions extends Component<FilterSuggestionsProps> {
  getRelationTypeName(relationTypeId: string) {
    const relationType = relationTypeId
      ? this.props.relationTypes.toJS().find((r: any) => r._id === relationTypeId)
      : undefined;
    return relationType ? relationType.name : undefined;
  }

  getThesauriName(thesauriId: string | undefined) {
    const thesaurus = thesauriId
      ? this.props.thesauris.toJS().find((thesauri: any) => thesauri._id === thesauriId)
      : undefined;
    return thesaurus ? thesaurus.name : undefined;
  }

  findSameLabelProperties(label: string, templates: TemplateSchema[]): MatchedProperty[] {
    return templates
      .filter(template => template._id !== this.props.templateId && template.properties)
      .map(template => {
        const property = ensure<PropertySchema[]>(template.properties).find(
          prop => prop.label.trim().toLowerCase() === label.trim().toLowerCase()
        );
        return (property
          ? { template: template.name, property }
          : { template: undefined }) as MatchedProperty;
      })
      .filter(prop => prop.template !== undefined);
  }

  render() {
    const { label, type, content, relationType } = this.props;

    const similarProperties: TemplateProperty[] = this.findSameLabelProperties(
      this.props.label,
      this.props.templates.toJS()
    ).map((propertyMatch: MatchedProperty) => {
      const { property } = ensure<MatchedProperty>(propertyMatch);
      return Object.assign({}, propertyMatch, {
        typeConflict: property.type !== type,
        relationConflict: relationType && property.relationType !== relationType,
        contentConflict: property.content !== content,
        type: property.type[0].toUpperCase() + property.type.slice(1),
        relationTypeName: this.getRelationTypeName(property.relationType),
        thesaurusName: this.getThesauriName(property.content),
      }) as TemplateProperty;
    });

    const thisProperty = {
      template: `${this.props.templateName} (this template)`,
      property: {
        content,
        label,
        type,
      },
      type: type[0].toUpperCase() + type.slice(1),
      relationTypeName: this.getRelationTypeName(relationType),
      thesaurusName: this.getThesauriName(content),
    };

    const templatesWithSameLabelProperties = [
      thisProperty as TemplateProperty,
      ...similarProperties,
    ];
    const hasContent = templatesWithSameLabelProperties.find(prop => prop.thesaurusName);
    return (
      <>
        <label className="suggestions-label">
          Properties from other templates in the collection using the same label
        </label>
        <table className="table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Type</th>
              {hasContent && <th>Thesauri/Document</th>}
            </tr>
          </thead>
          <tbody>
            {templatesWithSameLabelProperties.map(templateProperty => (
              <SimilarProperty
                key={templateProperty.template + templateProperty.property.name}
                templateProperty={templateProperty}
              />
            ))}
          </tbody>
        </table>
      </>
    );
  }
}

export type FilterSuggestionsProps = {
  index: number;
  label: string;
  type: string;
  filter: any;
  templateName: string;
  templateId: string | { [k: string]: any } | undefined;
  templates: IImmutable<TemplateSchema[]>;
  thesauris: IImmutable<[]>;
  relationTypes: IImmutable<[]>;
  content: string;
  relationType: string;
};

export function mapStateToProps(state: IStore, props: FilterSuggestionsProps) {
  const propertySchemaElement = ensure<PropertySchema>(state.template.data.properties)[props.index];
  // @ts-ignore
  const relationTypes = state.relationTypes;
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    relationTypes: relationTypes,
    templateName: state.template.data.name,
    templateId: state.template.data._id,
    type: propertySchemaElement.type,
    filter: propertySchemaElement.filter,
    label: propertySchemaElement.label,
    content: propertySchemaElement.content,
    relationType: propertySchemaElement.relationType,
  };
}

// @ts-ignore
export default connect(mapStateToProps)(FilterSuggestions);
