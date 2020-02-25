import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { t, actions } from 'app/I18N';
import { Icon } from 'UI';
import { languages as elasticLanguages, allLanguages as languagesList } from 'shared/languagesList';
import Warning from '../../Layout/Warning';
import Tip from '../../Layout/Tip';

export class Languages extends Component {
  static defaultLanguage() {
    return (
      <span>
        {t('System', 'Default language')}
        <Tip>
          This language will be used as default translation when adding new languages, and the
          default language for the site when no other language has been selected.
        </Tip>
      </span>
    );
  }

  static notSupportedLanguage() {
    return (
      <Warning>Some adavanced search features may not be available for this language.</Warning>
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      languageToDelete: {},
      languageToAdd: {},
    };
  }

  setAsDeafultButton(language) {
    return (
      <button
        type="button"
        onClick={this.setDefault.bind(this, language)}
        className="btn btn-success btn-xs template-remove"
      >
        <Icon prefix="far" icon="star" />
        &nbsp;
        <span>{t('System', 'Set as default')}</span>
      </button>
    );
  }

  deleteButton(language) {
    return (
      <button
        disabled={language.key === this.props.locale}
        className="btn btn-danger btn-xs template-remove"
        onClick={this.deleteLanguage.bind(this, language)}
        type="button"
      >
        <Icon icon="trash-alt" />
        &nbsp;
        <span>{t('System', 'Delete language')}</span>
      </button>
    );
  }

  setDefault(language) {
    this.props.setDefaultLanguage(language.key);
  }

  deleteLanguage(language) {
    this.context.confirm({
      accept: () => this.props.deleteLanguage(language.key),
      title: `Confirm delete ${language.label}`,
      message: `Are you sure you want to delete ${language.label} language?
      This action may take some time, can not be undone and will delete all the information in that language.`,
      extraConfirm: true,
    });
  }

  addLanguage(language) {
    this.context.confirm({
      accept: () => this.props.addLanguage(language),
      title: `Confirm add ${language.label}`,
      message:
        'This action may take some time while we add the extra language to the entire collection.',
      extraConfirm: true,
      type: 'success',
    });
  }

  render() {
    const currentLanguages = this.props.languages.toJS();
    const currentLanguagesIsos = currentLanguages.map(l => l.key);
    const elasticSupportedIsos = Object.keys(elasticLanguages).map(
      k => elasticLanguages[k].ISO639_1
    );
    const filteredLanguagesList = languagesList.filter(l => !currentLanguagesIsos.includes(l.key));
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Active Languages')}</div>
        <ul className="list-group document-types">
          {currentLanguages.map((language, index) => (
            <li key={index} className="list-group-item">
              <span className="force-ltr">{`${language.label} (${language.key})`}</span>
              {language.default ? Languages.defaultLanguage() : ''}
              <div className="list-group-item-actions">
                {!language.default ? this.setAsDeafultButton(language) : ''}
                {!language.default ? this.deleteButton(language) : ''}
              </div>
            </li>
          ))}
        </ul>
        <div className="panel-heading">{t('System', 'Available Languages')}</div>
        <ul className="list-group document-types">
          {filteredLanguagesList.map((language, index) => {
            const notSupported = !elasticSupportedIsos.includes(language.key);
            return (
              <li key={index} className="list-group-item">
                <span className="force-ltr">
                  {`${language.label} (${language.key}) `}
                  {notSupported ? Languages.notSupportedLanguage() : ''}
                </span>
                <div className="list-group-item-actions">
                  &nbsp;
                  <button
                    type="button"
                    onClick={this.addLanguage.bind(this, language)}
                    className="btn btn-success btn-xs template-remove"
                  >
                    <Icon icon="plus" />
                    &nbsp;
                    <span>{t('System', 'Add language')}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

Languages.contextTypes = {
  confirm: PropTypes.func,
};

Languages.propTypes = {
  languages: PropTypes.object,
  locale: PropTypes.string.isRequired,
  addLanguage: PropTypes.func.isRequired,
  deleteLanguage: PropTypes.func.isRequired,
  setDefaultLanguage: PropTypes.func.isRequired,
};

export function mapStateToProps(state) {
  const { settings, locale } = state;
  return { languages: settings.collection.get('languages'), locale };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      addLanguage: actions.addLanguage,
      deleteLanguage: actions.deleteLanguage,
      setDefaultLanguage: actions.setDefaultLanguage,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(Languages);
