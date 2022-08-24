import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { actions, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { elasticLanguages, availableLanguages as languagesList } from 'shared/languagesList';
import Warning from '../../Layout/Warning';
import Tip from '../../Layout/Tip';

class Languages extends Component {
  static defaultLanguage() {
    return (
      <span>
        <Translate>Default language</Translate>
        <Tip position="right">
          <Translate translationKey="Default language description">
            This language will be used as default translation when adding new languages, and the
            default language for the site when no other language has been selected.
          </Translate>
        </Tip>
      </span>
    );
  }

  static notSupportedLanguage() {
    return (
      <Warning>
        <Translate>
          Some adavanced search features may not be available for this language.
        </Translate>
      </Warning>
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
        <span>
          <Translate>Set as default</Translate>
        </span>
      </button>
    );
  }

  setDefault(language) {
    this.props.setDefaultLanguage(language.key);
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
        <span>
          <Translate>Delete language</Translate>
        </span>
      </button>
    );
  }

  deleteLanguage(language) {
    this.context.confirm({
      accept: () => this.props.deleteLanguage(language.key),
      title: (
        <>
          <Translate>Confirm delete </Translate> {language.label}
        </>
      ),
      message: (
        <>
          <Translate>Are you sure you want to delete</Translate>&nbsp;
          {language.label} <Translate> language? </Translate>
          <Translate>
            This action may take some time, can not be undone and will delete all the information in
            that language.
          </Translate>
        </>
      ),
      extraConfirm: true,
    });
  }

  addLanguage({ key, label, localized_label: localizedLabel, rtl }) {
    this.context.confirm({
      accept: () => this.props.addLanguage({ key, label, localized_label: localizedLabel, rtl }),
      title: (
        <>
          <Translate>Confirm add</Translate>&nbsp;{label}
        </>
      ),
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
      <div className="settings-content without-footer">
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Active Languages</Translate>
          </div>
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
          <div className="panel-heading">
            <Translate>Available Languages</Translate>
          </div>
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
                      <span>
                        <Translate>Add language</Translate>
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
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

export { Languages };
export default connect(mapStateToProps, mapDispatchToProps)(Languages);
