import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Icons from './Icons';

export class FilterSuggestions extends Component {

  findSameLabelProperties(label, templates) {
    return templates
    .filter((template) => template._id !== this.props.data._id)
    .map((template) => {
      let property = template.properties.find((prop) => {
        return prop.label.toLowerCase() === label.toLowerCase() & prop.filter;
      });

      if (property) {
        return {template: template.name, property};
      }
    })
    .filter((match) => match);
  }

  getTypeIcon(type) {
    return Icons[type] || 'fa fa-font';
  }

  renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index) {
    let activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    let title = 'This property has the same configuration and will be used together.';
    if (contentConflict) {
      title = 'This property has different Thesauri and wont\'t be used together.';
    }

    if (typeConflict) {
      title = 'This property has different Type and wont\'t be used together.';
    }
    let icon = this.getTypeIcon(propertyMatch.property.type);
    let type = propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1);

    return <tr key={index} className={activeClass} title={title}>
            <td><i className="fa fa-file-o"></i> {propertyMatch.template}</td>
            <td className={typeConflict ? 'conflict' : ''}>
              <i className="fa fa-warning"></i>
              <i className={icon}></i> {type}
            </td>
            {(() => {
              if (hasThesauri && propertyMatch.property.content) {
                let thesauri = this.getThesauriName(propertyMatch.property.content);
                return <td className={contentConflict ? 'conflict' : ''}>
                         <i className="fa fa-warning"></i>
                         <i className="fa fa-book"></i> {thesauri}
                       </td>;
              }
            })()}
          </tr>;
  }

  getThesauriName(thesauriId) {
    let _thesauri = this.props.thesauris.toJS().find((thesauri) => {
      return thesauri._id === thesauriId;
    }) || {};

    return _thesauri.name;
  }

  filterSuggestions(label, type, content, hasThesauri) {
    return this.findSameLabelProperties(label, this.props.templates.toJS())
    .map((propertyMatch, index) => {
      let typeConflict = propertyMatch.property.type !== type;
      let contentConflict = propertyMatch.property.content !== content;
      return this.renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index);
    });
  }

  render() {
    let label = this.props.label;
    let type = this.props.type;
    let content = this.props.content;
    let hasThesauri = typeof content !== 'undefined';
    let activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    let title = 'This is the current property and will be used togheter with equal properties.';
    let icon = this.getTypeIcon(type);


    return <table className="table">
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
                <td><i className="fa fa-file-o"></i> {this.props.data.name}</td>
                <td><i className={icon}></i> {type[0].toUpperCase() + type.slice(1)}</td>
                {(() => {
                  if (hasThesauri) {
                    let thesauri = this.getThesauriName(content);
                    return <td><i className="fa fa-book"></i> {thesauri}</td>;
                  }
                })()}
              </tr>
              {this.filterSuggestions(label, type, content, hasThesauri)}
            </tbody>
          </table>;
  }
}

FilterSuggestions.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  filter: PropTypes.any,
  data: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  content: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    data: state.template.data
  };
}

export default connect(mapStateToProps)(FilterSuggestions);
