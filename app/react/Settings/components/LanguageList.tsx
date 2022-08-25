/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { differenceBy } from 'lodash';
import { Icon } from 'UI';
import { Translate, actions } from 'app/I18N';
import Tip from 'app/Layout/Tip';
import { IStore } from 'app/istore';
import { LanguageSchema } from 'shared/types/commonTypes';
import { getLanguages } from './LanguagesAPI';

const DefaultLanguage = () => (
  <span>
    <Translate>Default language</Translate>
    <Tip position="right">
      <Translate translationKey="Default language description">
        This language will be used as default translation when adding new languages, and the default
        language for the site when no other language has been selected.
      </Translate>
    </Tip>
  </span>
);

const SetAsDefaultButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="btn btn-success btn-xs template-remove">
    <Icon prefix="far" icon="star" />
    &nbsp;
    <span>
      <Translate>Set as default</Translate>
    </span>
  </button>
);

const TranslationAvailable = () => <Translate>Available default translation</Translate>;

const DeleteButton = ({ onClick, disabled }) => (
  <button
    disabled={disabled}
    className="btn btn-danger btn-xs template-remove"
    onClick={onClick}
    type="button"
  >
    <Icon icon="trash-alt" />
    &nbsp;
    <span>
      <Translate>Delete language</Translate>
    </span>
  </button>
);
const mapStateToProps = (state: IStore & { locale: string }) => {
  const { settings, locale } = state;
  return { languages: settings.collection.get('languages'), locale };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      addLanguage: actions.addLanguage,
      deleteLanguage: actions.deleteLanguage,
      setDefaultLanguage: actions.setDefaultLanguage,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);
type MappedProps = ConnectedProps<typeof connector>;

const LanguageList = ({
  languages,
  locale,
  setDefaultLanguage,
  deleteLanguage,
  addLanguage,
}: MappedProps) => {
  const currentLanguages: LanguageSchema[] = languages?.toJS();
  const [availableLanguages, setAvailableLanguages] = useState<LanguageSchema[]>([]);

  useEffect(() => {
    getLanguages()
      .then((languagesList: LanguageSchema[]) => {
        const filteredLanguagesList = differenceBy(languagesList, currentLanguages, 'key');
        setAvailableLanguages(filteredLanguagesList);
      })
      .catch(_e => {});
  }, [languages]);

  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <Translate>Active Languages</Translate>
      </div>
      <ul className="list-group document-types">
        {currentLanguages.map((language: LanguageSchema) => (
          <li key={language.key} className="list-group-item">
            <span className="force-ltr">{`${language.label} (${language.key})`}</span>
            {language.default && <DefaultLanguage />}
            <div className="list-group-item-actions">
              {!language.default && (
                <>
                  <SetAsDefaultButton onClick={() => setDefaultLanguage(language)} />
                  <DeleteButton
                    onClick={() => deleteLanguage(language)}
                    disabled={language.key === locale}
                  />
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="panel-heading">
        <Translate>Available Languages</Translate>
      </div>
      <ul className="list-group document-types">
        {availableLanguages.map(language => (
          <li key={language.key} className="list-group-item">
            <span className="force-ltr">
              {`${language.label} (${language.key}) `}
              {language.translationAvailable && <TranslationAvailable />}
            </span>
            <div className="list-group-item-actions">
              &nbsp;
              <button
                type="button"
                onClick={addLanguage(language)}
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
        ))}
      </ul>
    </div>
  );
};

export default connector(LanguageList);
