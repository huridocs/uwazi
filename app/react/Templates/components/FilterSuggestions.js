import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

import Icons from './Icons';

function getMatchMessage({ typeConflict, relationConflict, contentConflict }) {
  let title =
    'This property has the same configuration as others with the same label and will be used together.';

  if (contentConflict) {
    title = 'Properties with the same label but different thesauri as content are not allowed.';
  }

  if (relationConflict) {
    title =
      'Relationship properties with the same label but different relationship types are not allowed.';
  }

  if (typeConflict) {
    title = 'Properties with the same label but different types are not allowed.';
  }

  return title;
}

export class FilterSuggestions extends Component {
  static getTypeIcon(type) {
    return Icons[type] || 'fa fa-font';
  }

  getThesauriName(thesauriId) {
    const _thesauri =
      this.props.thesauris.toJS().find(thesauri => thesauri._id === thesauriId) || {};

    return _thesauri.name;
  }

  getRelationTypeName(relationTypeId) {
    const relation = this.props.relationTypes.toJS().find(r => r._id === relationTypeId) || {};

    return relation.name;
  }

  findSameLabelProperties(label, templates) {
    return templates
      .filter(template => template._id !== this.props.templateId)
      .map(template => {
        const property = template.properties.find(
          prop => prop.label.trim().toLowerCase() === label.trim().toLowerCase() && prop.filter
        );

        if (property) {
          return { template: template.name, property };
        }

        return null;
      })
      .filter(match => match);
  }

  filterSuggestions(label, type, content, relationType, hasThesauri) {
    return this.findSameLabelProperties(label, this.props.templates.toJS()).map(
      (propertyMatch, index) => {
        const typeConflict = propertyMatch.property.type !== type;
        const relationConflict =
          relationType && propertyMatch.property.relationType !== relationType;
        const contentConflict = propertyMatch.property.content !== content;
        return this.renderMatch(
          propertyMatch,
          { typeConflict, relationConflict, contentConflict },
          hasThesauri,
          index
        );
      }
    );
  }

  renderMatch(
    propertyMatch,
    { typeConflict, relationConflict, contentConflict },
    hasThesauri,
    index
  ) {
    const activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    const title = getMatchMessage({ typeConflict, relationConflict, contentConflict });
    const icon = FilterSuggestions.getTypeIcon(propertyMatch.property.type);
    const type =
      propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1);

    return (
      <tr key={index} className={activeClass} title={title}>
        <td>
          <Icon icon="file" /> {propertyMatch.template}
        </td>
        <td className={typeConflict || relationConflict ? 'conflict' : ''}>
          {typeConflict || relationConflict ? <Icon icon="exclamation-triangle" /> : null}
          <Icon icon={icon} />
          {(() => {
            if (type === 'Relationship') {
              const relationTypeName = this.getRelationTypeName(
                propertyMatch.property.relationType
              );
              return `${type} (${relationTypeName})`;
            }

            return type;
          })()}
        </td>
        {(() => {
          if (hasThesauri && propertyMatch.property.content) {
            const thesauri = this.getThesauriName(propertyMatch.property.content);
            return (
              <td className={contentConflict ? 'conflict' : ''}>
                {contentConflict ? <Icon icon="exclamation-triangle" /> : null}
                <Icon icon="book" /> {thesauri}
              </td>
            );
          }
          return false;
        })()}
      </tr>
    );
  }

  render() {
    const { label, type, content, relationType } = this.props;
    const hasThesauri = typeof content !== 'undefined';
    const activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    const title = 'This is the current property and will be used together with equal properties.';
    const icon = FilterSuggestions.getTypeIcon(type);

    return (
      <React.Fragment>
        <label className="suggestions-label">
          Properties from other templates in the collection using the same label
        </label>
        <table className="table">
          <thead>
            <tr>
              <th>Document or entity</th>
              <th>Type</th>
              {(() => {
                if (hasThesauri) {
                  return <th>Thesauri</th>;
                }

                return null;
              })()}
            </tr>
          </thead>
          <tbody>
            <tr className={activeClass} title={title}>
              <td>
                <Icon icon="file" /> {this.props.templateName}
              </td>
              <td>
                <Icon icon={icon} /> {type[0].toUpperCase() + type.slice(1)}
              </td>
              {(() => {
                if (hasThesauri) {
                  const thesauri = this.getThesauriName(content);
                  return (
                    <td>
                      <Icon icon="book" /> {thesauri}
                    </td>
                  );
                }

                return null;
              })()}
            </tr>
            {this.filterSuggestions(label, type, content, relationType, hasThesauri)}
          </tbody>
        </table>
      </React.Fragment>
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
