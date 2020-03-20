import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { COLORS } from 'app/utils/colors';
import t from '../I18N/t';

const getTemplateInfo = createSelector(
  s => s.templates,
  (_s, p) => p.template,
  (templates, currentTemplate) => {
    let styleProps;
    const name = templates.reduce((result, template, index) => {
      if (template.get('_id') === currentTemplate) {
        styleProps = template.get('color')
          ? { className: 'btn-color', style: { backgroundColor: template.get('color') } }
          : { className: `btn-color btn-color-${index % COLORS.length}` };
        return template.get('name');
      }
      return result;
    }, '');

    return { name, styleProps };
  }
);

export class TemplateLabel extends Component {
  render() {
    const { name, template, className, style } = this.props;
    return (
      <span className={className} style={style}>
        {template && t(template, name)}
      </span>
    );
  }
}

TemplateLabel.defaultProps = {
  className: 'btn-color',
  style: undefined,
};

TemplateLabel.propTypes = {
  template: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.shape({ backgroundColor: PropTypes.string }),
};

const mapStateToProps = (state, props) => {
  const template = getTemplateInfo(state, props);
  return {
    name: template.name,
    template: props.template,
    ...template.styleProps,
  };
};

export default connect(mapStateToProps)(TemplateLabel);
