/* eslint-disable react/no-multi-comp */ import React, { useEffect, useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { differenceBy } from 'lodash';
import { Icon } from 'UI';
import Confirm from 'app/App/Confirm';
import { Translate, actions } from 'app/I18N';
import { IStore } from 'app/istore';
import { LanguageSchema } from 'shared/types/commonTypes';
import { getLanguages } from './LanguagesAPI';

const SetAsDefaultButton = ({
  className,
  onClick,
}: {
  className: string;
  onClick?: React.MouseEventHandler;
}) => (
  <button type="button" onClick={onClick} className={`btn btn-xs template-remove ${className}`}>
    <Icon prefix="far" icon="star" /> &nbsp;
    <span>
      <Translate>Set as default</Translate>
    </span>
  </button>
);

const TranslationAvailable = () => <Translate>Available default translation</Translate>;

const DeleteButton = ({ onClick }: { onClick: React.MouseEventHandler }) => (
  <button className="btn btn-danger btn-xs template-remove" onClick={onClick} type="button">
    <Icon icon="trash-alt" /> &nbsp;
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
  const [addingLanguage, setAddingLanguage] = useState<LanguageSchema>();
  const [deletingLanguage, setDeletingLanguage] = useState<LanguageSchema>();

  useEffect(() => {
    getLanguages()
      .then((languagesList: LanguageSchema[]) => {
        const filteredLanguagesList = differenceBy(languagesList, currentLanguages, 'key');
        setAvailableLanguages(filteredLanguagesList);
      })
      .catch(_e => {});
  }, [languages]);

  const confirmLanguageAddition = (language: LanguageSchema) => (
    <Confirm
      accept={() => {
        addLanguage({ ...language });
        setAddingLanguage(undefined);
      }}
      cancel={() => {
        setAddingLanguage(undefined);
      }}
      title={
        <>
          <Translate>Confirm add</Translate>&nbsp;{language.label}
        </>
      }
      message="This action may take some time while we add the extra language to the entire collection."
      extraConfirm
      type="success"
    />
  );

  const confirmLanguageDeletion = (language: LanguageSchema) => (
    <Confirm
      accept={() => {
        deleteLanguage(language.key);
        setDeletingLanguage(undefined);
      }}
      cancel={() => {
        setDeletingLanguage(undefined);
      }}
      title={
        <>
          <Translate>Confirm delete </Translate>&nbsp;{language.label}
        </>
      }
      message={
        <>
          <Translate>Are you sure you want to delete</Translate>&nbsp; {language.label}
          <Translate> language?</Translate>
          <Translate>
            This action may take some time, can not be undone and will delete all the information in
            that language.
          </Translate>
        </>
      }
      extraConfirm
    />
  );
  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <Translate>Active Languages</Translate>
      </div>
      <ul className="list-group document-types">
        {currentLanguages.map((language: LanguageSchema) => (
          <li key={language.key} className="list-group-item">
            <span className="force-ltr">{`${language.label} (${language.key})`}</span>
            {language.default}
            <div className="list-group-item-actions">
              {language.default && <SetAsDefaultButton className="btn-success" />}
              {!language.default && (
                <>
                  <SetAsDefaultButton className="" onClick={() => setDefaultLanguage(language)} />
                  <DeleteButton onClick={() => setDeletingLanguage(language)} />
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
          </li>
        ))}
      </ul>
      {addingLanguage && confirmLanguageAddition(addingLanguage)}
      {deletingLanguage && confirmLanguageDeletion(deletingLanguage)}
    </div>
  );
};

export default connector(LanguageList);
