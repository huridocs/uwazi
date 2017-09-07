import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import t from '../I18N/t';
import {createSelector} from 'reselect';

const getTemplateInfo = createSelector(
  (s) => s.templates,
  (s, p) => p.template,
  (templates, currentTemplate) => {
    let typeIndex;
    let name = templates.reduce((result, template, index) => {
      if (template.get('_id') === currentTemplate) {
        typeIndex = 'item-type item-type-' + index;
        return template.get('name');
      }
      return result;
    }, '');

    return {name, typeIndex};
  }
);

export class TemplateLabel extends Component {
  render() {
    return (
      <span className={this.props.typeIndex}>
        <span className="item-type__name">{t(this.props.template, this.props.name)}</span>
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
