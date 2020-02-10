import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

import Icons from './Icons';

export class FilterSuggestions extends Component {
  static getTypeIcon(type) {
    return Icons[type] || 'fa fa-font';
  }

  getThesauriName(thesauriId) {
    const _thesauri =
      this.props.thesauris.toJS().find(thesauri => thesauri._id === thesauriId) || {};

    return _thesauri.name;
  }

  findSameLabelProperties(label, templates) {
    return templates
      .filter(template => template._id !== this.props.data._id)
      .map(template => {
        const property = template.properties.find(
          prop => prop.label.trim().toLowerCase() === label.trim().toLowerCase() && prop.filter
        );

        if (property) {
          return { template: template.name, property };
        }
      })
      .filter(match => match);
  }

  filterSuggestions(label, type, content, hasThesauri) {
    return this.findSameLabelProperties(label, this.props.templates.toJS()).map(
      (propertyMatch, index) => {
        const typeConflict = propertyMatch.property.type !== type;
        const contentConflict = propertyMatch.property.content !== content;
        return this.renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index);
      }
    );
  }

  renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index) {
    const activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    let title = 'This property has the same configuration and will be used together.';
    if (contentConflict) {
      title = "This property has different Thesauri and wont't be used together.";
    }

    if (typeConflict) {
      title = "This property has different Type and wont't be used together.";
    }
    const icon = FilterSuggestions.getTypeIcon(propertyMatch.property.type);
    const type =
      propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1);

    return (
      <tr key={index} className={activeClass} title={title}>
        <td>
          <Icon icon="file" /> {propertyMatch.template}
        </td>
        <td className={typeConflict ? 'conflict' : ''}>
          <Icon icon="warning" />
          <Icon icon={icon} /> {type}
        </td>
        {(() => {
          if (hasThesauri && propertyMatch.property.content) {
            const thesauri = this.getThesauriName(propertyMatch.property.content);
            return (
              <td className={contentConflict ? 'conflict' : ''}>
                <Icon icon="warning" />
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
    const { label } = this.props;
    const { type } = this.props;
    const { content } = this.props;
    const hasThesauri = typeof content !== 'undefined';
    const activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    const title = 'This is the current property and will be used togheter with equal properties.';
    const icon = FilterSuggestions.getTypeIcon(type);

    return (
      <table className="table">
        <thead>
          <tr>
            <th>Document or entity</th>
            <th>Type</th>
            {(() => {
              if (hasThesauri) {
                return <th>Thesauri</th>;
              }
            })()}
          </tr>
        </thead>
        <tbody>
          <tr className={activeClass} title={title}>
            <td>
              <Icon icon="file" /> {this.props.data.name}
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
            })()}
          </tr>
          {this.filterSuggestions(label, type, content, hasThesauri)}
        </tbody>
      </table>
    );
  }
}

FilterSuggestions.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  filter: PropTypes.any,
  data: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  content: PropTypes.string,
};

export function mapStateToProps(state) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    data: state.template.data,
  };
}

export default connect(mapStateToProps)(FilterSuggestions);
