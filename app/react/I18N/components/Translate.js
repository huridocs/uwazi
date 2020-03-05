import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions } from 'app/I18N';

export class Translate extends Component {
  static resetCachedTranslation() {
    Translate.translation = null;
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    if (this.props.i18nmode) {
      e.stopPropagation();
      e.preventDefault();
      this.props.edit(this.props.context, this.props.translationKey);
    }
  }

  render() {
    return (
      <span
        onClick={this.onClick}
        className={this.props.i18nmode ? 'translation active' : 'translation'}
      >
        {this.props.children}
      </span>
    );
  }
}

Translate.defaultProps = {
  i18nmode: false,
  context: 'System',
  edit: false,
  translationKey: '',
};

Translate.propTypes = {
  translationKey: PropTypes.string,
  context: PropTypes.string,
  edit: PropTypes.func,
  i18nmode: PropTypes.bool,
  children: PropTypes.string.isRequired,
};

export const mapStateToProps = (state, props) => {
  if (!Translate.translation || Translate.translation.locale !== state.locale) {
    const translations = state.translations.toJS();
    Translate.translation = translations.find(t => t.locale === state.locale) || { contexts: [] };
  }
  const _ctx = props.context || 'System';
  const key = props.translationKey || props.children;
  const context = Translate.translation.contexts.find(ctx => ctx.id === _ctx) || { values: {} };
  const canEditThisValue = _ctx === 'System' || !!context.values[props.children];
  return {
    translationKey: key,
    children: context.values[key] || props.children,
    i18nmode: state.inlineEdit.get('inlineEdit') && canEditThisValue,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ edit: actions.inlineEditTranslation }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Translate);
