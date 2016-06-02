import React, {Component, PropTypes} from 'react';
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
      title = 'This property has different Thesauri and wont\'t be used together';
    }

    if (typeConflict) {
      title = 'This property has different Type and wont\'t be used together';
    }
    let icon = this.getTypeIcon(propertyMatch.property.type);
    let type = propertyMatch.property.type[0].toUpperCase() + propertyMatch.property.type.slice(1);

    return <div key={index} className={activeClass} title={title}>
            <span>
              <i className="fa fa-file-o"></i> {propertyMatch.template}
            </span>
            <i className="fa fa-angle-right"></i>
            <span className={typeConflict ? 'conflict' : ''}>
              <i className={icon}></i> {type}
            </span>
            {(() => {
              if (hasThesauri && propertyMatch.property.content) {
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
    return this.props.uiState.toJS().thesauris.find((thesauri) => {
      return thesauri._id === thesauriId;
    }).name;
  }

  filterSuggestions(label, type, content, hasThesauri) {
    return this.findSameLabelProperties(label, this.props.uiState.toJS().templates)
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


    return <div className="filter-suggestions col-sm-12">
    <div className={activeClass} title={title}>
            <span>
              <i className="fa fa-file-o"></i> {this.props.data.name}
            </span>
            <i className="fa fa-angle-right"></i>
            <span>
              <i className={icon}></i> {type[0].toUpperCase() + type.slice(1)}
            </span>
            {(() => {
              if (hasThesauri) {
                let thesauri = this.getThesauriName(content);
                return <span>
                        <i className="fa fa-angle-right"></i>
                        <span>
                          <i className="fa fa-book"></i>Thesauri: {thesauri}
                        </span>
                       </span>;
              }
            })()}
            <i className="fa fa-info-circle"></i>
          </div>
            {this.filterSuggestions(label, type, content, hasThesauri)}
           </div>;
  }
}

FilterSuggestions.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  filter: PropTypes.any,
  data: PropTypes.object,
  uiState: PropTypes.object,
  content: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    uiState: state.template.uiState,
    data: state.template.data
  };
}

export default connect(mapStateToProps)(FilterSuggestions);
