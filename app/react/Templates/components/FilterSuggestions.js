import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

export class FilterSuggestions extends Component {

  formatNames(matches) {
    return matches.reduce((names, match) => {
      names.push(match.template);
      return names;
    }, [])
    .join(', ').replace(/(,) (\w* *\w*$)/, ' and $2');
  }

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


  renderPerfectMatch(matches) {
    return <p className="text-primary">
      <i className="fa fa-thumbs-o-up" aria-hidden="true"></i>&nbsp;
      This property will be used as filter in addition to the same property in <strong>{this.formatNames(matches)}</strong>.
    </p>;
  }

  renderDifferentTypeMatch(matches) {
    let otherType = matches[0].property.type;
    return <p className="text-warning">
      <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>&nbsp;
      This property has the same label as other in <strong>{this.formatNames(matches)}</strong>,
      but not the same type ({otherType}) and won&#39;t be used together for filtering.
    </p>;
  }

  renderDifferentContentMatch(matches) {
    let otherThesauri = this.props.thesauris.find((thesauri) => {
      return thesauri._id === matches[0].property.content;
    }).name;
    return <p className="text-warning">
      <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>&nbsp;
      This property has the same label and type as other in <strong>{this.formatNames(matches)}</strong>,
      but not the same thesauri ({otherThesauri}) and won&#39;t be used together for filtering.
    </p>;
  }

  filterSuggestions() {
    if (!this.props.filter) {
      return;
    }
    let label = this.props.label;
    let type = this.props.type;
    let content = this.props.content;

    let filterMatches = this.findSameLabelProperties(label, this.props.templates, this.props.parentTemplateId);

    let perfectMatches = filterMatches.filter((match) => match.property.type === type && match.property.content === content);

    if (perfectMatches.length) {
      return this.renderPerfectMatch(perfectMatches);
    }

    let differentType = filterMatches.filter((match) => match.property.type !== type);
    if (differentType.length) {
      return this.renderDifferentTypeMatch(differentType);
    }

    let differentContent = filterMatches.filter((match) => match.property.type === type && match.property.content !== content);
    if (differentContent.length) {
      return this.renderDifferentContentMatch(differentContent);
    }
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
