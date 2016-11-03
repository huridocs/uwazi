import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import t from '../I18N/t';

export class TemplateLabel extends Component {
  render() {
    const templates = this.props.templates.toJS();
    let typeIndex;
    let icon = 'fa-file-text-o';
    let name = templates.reduce((result, template, index) => {
      if (template._id === this.props.template) {
        if (template.isEntity) {
          icon = 'fa-bank';
        }
        typeIndex = 'item-type item-type-' + index;
        return template.name;
      }
      return result;
    }, '');

    return (
      <span className={typeIndex}>
        <i className={`item-type__icon fa ${icon}`}></i>
        <span className="item-type__name">{t(this.props.template, name)}</span>
      </span>
    );
  }
}

TemplateLabel.propTypes = {
  templates: PropTypes.object,
  template: PropTypes.string
};

const mapStateToProps = ({templates}) => {
  return {templates};
};

export default connect(mapStateToProps)(TemplateLabel);
