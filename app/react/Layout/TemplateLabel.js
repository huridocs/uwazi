import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import t from '../I18N/t';

const NUM_COLORS = 18;

const getTemplateInfo = createSelector(
  s => s.templates,
  (s, p) => p.template,
  (templates, currentTemplate) => {
    let typeIndex;
    const name = templates.reduce((result, template, index) => {
      if (template.get('_id') === currentTemplate) {
        typeIndex = `btn-color btn-color-${index % NUM_COLORS}`;
        return template.get('name');
      }
      return result;
    }, '');

    return { name, typeIndex };
  }
);

export class TemplateLabel extends Component {
  render() {
    return (
      <span className={this.props.typeIndex}>
        {t(this.props.template, this.props.name)}
      </span>
    );
  }
}

TemplateLabel.propTypes = {
  template: PropTypes.string,
  name: PropTypes.string,
  typeIndex: PropTypes.string
};

const mapStateToProps = (state, props) => {
  const template = getTemplateInfo(state, props);
  return {
    name: template.name,
    typeIndex: template.typeIndex,
    template: props.template
  };
};

export default connect(mapStateToProps)(TemplateLabel);
