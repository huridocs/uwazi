/* eslint-disable react/no-multi-comp */ import React, { useEffect, useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { differenceBy, isEmpty } from 'lodash';
import { Icon } from 'UI';
import Confirm from 'app/App/Confirm';
import { Translate, actions, I18NApi } from 'app/I18N';
import { IStore } from 'app/istore';
import { LanguageSchema } from 'shared/types/commonTypes';

const SetAsDefaultButton = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: React.MouseEventHandler;
}) => (
  <button type="button" onClick={onClick} className={`btn btn-xs template-remove ${className}`}>
    <Icon prefix="far" icon="star" /> &nbsp;
    <span>
      <Translate>Set as default</Translate>
    </span>
  </button>
);

const TranslationAvailable = () => (
  <div className="translation-available">
    <Translate>Available default translation</Translate>
  </div>
);

const DeleteButton = ({
  onClick,
  className,
}: {
  onClick: React.MouseEventHandler;
  className?: string;
}) => (
  <button className={`btn btn-danger btn-xs ${className}`} onClick={onClick} type="button">
    <Icon icon="trash-alt" /> &nbsp;
    <span>
      <Translate>Delete language</Translate>
    </span>
  </button>
);

const mapStateToProps = (state: IStore) => ({
  languages: state.settings.collection.get('languages'),
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      addLanguage: actions.addLanguage,
      deleteLanguage: actions.deleteLanguage,
      setDefaultLanguage: actions.setDefaultLanguage,
      resetDefaultTranslations: actions.resetDefaultTranslations,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);
type MappedProps = ConnectedProps<typeof connector>;

const LanguageList = ({
  languages,
  setDefaultLanguage,
  deleteLanguage,
  addLanguage,
  resetDefaultTranslations,
}: MappedProps) => {
  const [addingLanguage, setAddingLanguage] = useState<LanguageSchema>();
  const [deletingLanguage, setDeletingLanguage] = useState<LanguageSchema>();
  const [resettingLanguage, setResettingLanguage] = useState<LanguageSchema>();

  const [installedLanguages, setInstalledLanguages] = useState<LanguageSchema[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageSchema[]>([]);

  useEffect(() => {
    I18NApi.getLanguages()
      .then((languagesList: LanguageSchema[]) => {
        const currentLanguages = languages?.toJS() || [];
        setAvailableLanguages(differenceBy(languagesList, currentLanguages, 'key'));
        setInstalledLanguages(currentLanguages);
      })
      .catch(_e => {});
  }, [languages]);

  if (isEmpty(installedLanguages)) {
    return null;
  }

  return (
    <div className="panel panel-default settings-content">
      <div className="panel-heading">
        <Translate>Active Languages</Translate>
      </div>
      <div className="installed-languages">
        {installedLanguages.map((language: LanguageSchema) => (
          <div key={language.key} className="row">
            <div className="col">{`${language.label} (${language.key})`}</div>
            <div className="col">
              <button
                type="button"
                onClick={() => {
                  setResettingLanguage(language);
                }}
                className={`btn btn-xs ${!language.translationAvailable ? 'hid' : ''}`}
              >
                <Icon icon="sync" /> &nbsp;
                <span>
                  <Translate>Reset default translation</Translate>
                </span>
              </button>
            </div>
            <div className="col">
              <SetAsDefaultButton
                className={language.default ? 'btn-success' : ''}
                onClick={!language.default ? () => setDefaultLanguage(language.key) : () => {}}
              />
            </div>
            <div className="col">
              <DeleteButton
                onClick={() => setDeletingLanguage(language)}
                className={language.default ? 'hid' : ''}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="panel-heading">
        <Translate>Available Languages</Translate>
      </div>
      <div className="available-languages">
        {availableLanguages.map(language => (
          <div key={language.key} className="row">
            <div className="col">
              {`${language.label} (${language.key}) `}
              {language.translationAvailable && <TranslationAvailable />}
            </div>
            <div className="col">
              <button
                type="button"
                onClick={() => {
                  setAddingLanguage(language);
                }}
                className="btn btn-success btn-xs template-remove"
              >
                <Icon icon="plus" /> &nbsp;
                <span>
                  <Translate>Add language</Translate>
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {addingLanguage && (
        <Confirm
          accept={() => {
            addLanguage({ ...addingLanguage });
            setAddingLanguage(undefined);
          }}
          cancel={() => {
            setAddingLanguage(undefined);
          }}
          title={
            <>
              <Translate>Confirm add</Translate>&nbsp;{addingLanguage.label}
            </>
          }
          message="This action may take some time while we add the extra language to the entire collection."
          extraConfirm
          type="success"
        />
      )}
      {deletingLanguage && (
        <Confirm
          accept={() => {
            deleteLanguage(deletingLanguage.key);
            setDeletingLanguage(undefined);
          }}
          cancel={() => {
            setDeletingLanguage(undefined);
          }}
          title={
            <>
              <Translate>Confirm delete </Translate>&nbsp;{deletingLanguage.label}
            </>
          }
          message={
            <>
              <Translate>Are you sure you want to delete</Translate>&nbsp; {deletingLanguage.label}
              <Translate> language?</Translate>
              <Translate>
                This action may take some time, can not be undone and will delete all the
                information in that language.
              </Translate>
            </>
          }
          extraConfirm
        />
      )}
      {resettingLanguage && (
        <Confirm
          accept={() => {
            resetDefaultTranslations(resettingLanguage.key);
            setResettingLanguage(undefined);
          }}
          cancel={() => {
            setResettingLanguage(undefined);
          }}
          title={
            <>
              <Translate>Confirm reset translations</Translate>&nbsp;{resettingLanguage.label}
            </>
          }
          message={
            <>
              <Translate>Are you sure you want to reset the translations for</Translate>&nbsp;{' '}
              {resettingLanguage.label}
              <Translate> language?</Translate>
            </>
          }
          extraConfirm
          type="success"
        />
      )}
    </div>
  );
};

export default connector(LanguageList);
