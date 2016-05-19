import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

export class FilterSuggestions extends Component {

  findSameLabelProperties(label, templates, currentTemplateId) {
    return templates
    .filter((template) => template._id !== currentTemplateId)
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
    let icon;
    switch (type) {
    case 'checkbox':
      icon = 'fa fa-check-square-o';
      break;
    case 'select':
      icon = 'fa fa-list';
      break;
    case 'list':
      icon = 'fa fa-list';
      break;
    case 'date':
      icon = 'fa fa-calendar';
      break;
    default:
      icon = 'fa fa-font';
    }

    return icon;
  }

  renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index) {
    let activeClass = this.props.filter ? 'property-atributes is-active' : 'property-atributes';
    let title = 'This property has the same configuration and will be used together.';
    if (contentConflict) {
      title = 'This property has different Thesauri and wont\'t be used together';
    }

    if (typeConflict) {
      title = 'This property has different Type and wont\'t be used together';
    }
    let icon = this.getTypeIcon(propertyMatch.property.type);
    let type = propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1);
    if (type === 'Input') {
      type = 'Text';
    }
    return <div key={index} className={activeClass} title={title}>
            <span>
              <i className="fa fa-file-o"></i> {propertyMatch.template}
            </span>
            <i className="fa fa-angle-right"></i>
            <span className={typeConflict ? 'conflict' : ''}>
              <i className={icon}></i>{type}
            </span>
            {(() => {
              if (hasThesauri) {
                let thesauri = this.getThesauriName(propertyMatch.property.content);
                return <span>
                        <i className="fa fa-angle-right"></i>
                        <span className={contentConflict ? 'conflict' : ''}>
                          <i className="fa fa-book"></i>Thesauri: {thesauri}
                        </span>
                       </span>;
              }
            })()}
            <i className="fa fa-info-circle"></i>
          </div>;
  }

  getThesauriName(thesauriId) {
    return this.props.thesauris.find((thesauri) => {
      return thesauri._id === thesauriId;
    }).name;
  }

  filterSuggestions() {
    let label = this.props.label;
    let type = this.props.type;
    let content = this.props.content;

    return this.findSameLabelProperties(label, this.props.templates, this.props.parentTemplateId)
    .map((propertyMatch, index) => {
      let typeConflict = propertyMatch.property.type !== type;
      let contentConflict = propertyMatch.property.content !== content;
      let hasThesauri = typeof content !== 'undefined';
      return this.renderMatch(propertyMatch, typeConflict, contentConflict, hasThesauri, index);
    });
  }

  render() {
    return <div className="filter-suggestions col-sm-12">
            {this.filterSuggestions()}
           </div>;
  }
}

FilterSuggestions.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  filter: PropTypes.any,
  parentTemplateId: PropTypes.string,
  templates: PropTypes.array,
  thesauris: PropTypes.array,
  content: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    templates: state.template.uiState.toJS().templates,
    parentTemplateId: state.template.data.toJS()._id,
    thesauris: state.template.uiState.toJS().thesauris
  };
}

export default connect(mapStateToProps)(FilterSuggestions);
