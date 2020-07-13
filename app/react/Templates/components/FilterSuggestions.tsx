import { connect } from 'react-redux';
import React, { Component } from 'react';

import { TemplateSchema } from 'shared/types/templateType';
import { ensure } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { SimilarProperty } from './SimilarProperty';
import { Translate } from 'app/I18N';

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
        const property = (template.properties || []).find(
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
      const { property } = propertyMatch;
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
      <React.Fragment>
        <label className="suggestions-label">
          <Translate>Properties from other templates in the collection using the same label</Translate>
        </label>
        <table className="table">
          <thead>
            <tr>
              <th><Translate>Template</Translate></th>
              <th><Translate>Type</Translate></th>
              {hasContent && <th><Translate>Thesauri</Translate>/<Translate>Entity</Translate></th>}
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
      </React.Fragment>
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

export function mapStateToProps(state: any, props: FilterSuggestionsProps) {
  const propertySchemaElement = ensure<PropertySchema>(state.template.data.properties)[props.index];
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

export default connect(mapStateToProps)(FilterSuggestions);
