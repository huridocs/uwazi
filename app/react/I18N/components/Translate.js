import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions } from 'app/I18N';

const parseMarkdownItalicMarker = line => {
  const matches = line.match(/\*(?<italic>.*)\*/);
  if (matches === null) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{line}</>;
  }
  const parts = matches.input.split(matches[0]);
  return (
    <>
      {parts[0]}
      <i>{matches.groups.italic}</i>
      {parts[1]}
    </>
  );
};

class Translate extends Component {
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
    const lines = this.props.children.split('\n');
    return (
      <span
        onClick={this.onClick}
        className={this.props.i18nmode ? 'translation active' : 'translation'}
      >
        {lines.map((line, index) => {
          const parsedLine = parseMarkdownItalicMarker(line);
          return (
            <>
              {parsedLine}
              {index < lines.length - 1 && <br />}
            </>
          );
        })}
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

const mapStateToProps = (state, props) => {
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

export { mapStateToProps, Translate };
export default connect(mapStateToProps, mapDispatchToProps)(Translate);
