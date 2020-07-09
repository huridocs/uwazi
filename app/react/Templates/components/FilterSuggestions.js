import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

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

const SimilarProperty = props => (
  <tr className="property-atributes is-active">
    <td>
      <Icon icon="file" /> {props.property.template}
    </td>
    <td
      className={props.property.typeConflict || props.property.relationConflict ? 'conflict' : ''}
      {...(props.property.typeConflict && { title: titles.typeConflict })}
      {...(props.property.relationConflict && { title: titles.relationConflict })}
    >
      {(props.property.typeConflict || props.property.relationConflict) && (
        <Icon icon="exclamation-triangle" />
      )}
      <Icon icon={Icons[props.property.type.toLowerCase()] || 'fa fa-font'} />
      {` ${props.property.type}`}
      {props.property.relationTypeName && ` (${props.property.relationTypeName})`}
    </td>
    <td
      className={props.property.contentConflict ? 'conflict' : ''}
      {...(props.property.contentConflict && { title: titles.contentConflict })}
    >
      {props.property.contentConflict && <Icon icon="exclamation-triangle" />}
      <Icon icon="book" />
      {props.property.thesaurusName}
    </td>
  </tr>
);

SimilarProperty.propTypes = {
  property: PropTypes.object.isRequired,
};

export class FilterSuggestions extends Component {
  getRelationTypeName(relationTypeId) {
    const relationType = relationTypeId
      ? this.props.relationTypes.toJS().find(r => r._id === relationTypeId)
      : undefined;
    return relationType ? relationType.name : undefined;
  }

  getThesauriName(thesauriId) {
    const thesaurus = thesauriId
      ? this.props.thesauris.toJS().find(thesauri => thesauri._id === thesauriId)
      : undefined;
    return thesaurus ? thesaurus.name : undefined;
  }

  findSameLabelProperties(label, templates) {
    return templates
      .filter(template => template._id !== this.props.templateId)
      .map(template => {
        const property = template.properties.find(
          prop => prop.label.trim().toLowerCase() === label.trim().toLowerCase()
        );
        if (property) {
          return { template: template.name, property };
        }
        return null;
      })
      .filter(match => match);
  }

  render() {
    const { label, type, content, relationType } = this.props;

    const similarProperties = this.findSameLabelProperties(label, this.props.templates.toJS()).map(
      propertyMatch =>
        Object.assign(
          {},
          propertyMatch,
          { typeConflict: propertyMatch.property.type !== type },
          {
            relationConflict: relationType && propertyMatch.property.relationType !== relationType,
          },
          { contentConflict: propertyMatch.property.content !== content },
          {
            type:
              propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1),
          },
          {
            relationTypeName: this.getRelationTypeName(propertyMatch.property.relationType),
          },
          {
            thesaurusName: this.getThesauriName(propertyMatch.property.content),
          }
        )
    );

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
    const templatesWithSameLabelProperties = [thisProperty].concat(similarProperties);

    const hasContent = templatesWithSameLabelProperties.find(prop => prop.thesaurusName);
    return (
      <>
        <label className="suggestions-label">
          Properties from other templates in the collection using the same label
        </label>
        <table className="table">
          <thead>
            <tr>
              <th>Document or entity</th>
              <th>Type</th>
              {hasContent && <th>Thesauri/Document</th>}
            </tr>
          </thead>
          <tbody>
            {templatesWithSameLabelProperties.map(property => (
              <SimilarProperty
                key={property.template + property.property.name}
                property={property}
              />
            ))}
          </tbody>
        </table>
      </>
    );
  }
}

FilterSuggestions.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  filter: PropTypes.any,
  templateName: PropTypes.string,
  templateId: PropTypes.string,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  relationTypes: PropTypes.object,
  content: PropTypes.string,
  relationType: PropTypes.string,
};

export function mapStateToProps(state, props) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    relationTypes: state.relationTypes,
    templateName: state.template.data.name,
    templateId: state.template.data._id,
    type: state.template.data.properties[props.index].type,
    filter: state.template.data.properties[props.index].filter,
    label: state.template.data.properties[props.index].label,
    content: state.template.data.properties[props.index].content,
    relationType: state.template.data.properties[props.index].relationType,
  };
}

export default connect(mapStateToProps)(FilterSuggestions);
