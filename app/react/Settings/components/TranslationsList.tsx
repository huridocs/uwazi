/* eslint-disable react/no-multi-comp */
import React from 'react';
import { fromJS } from 'immutable';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { difference } from 'lodash';
import { Icon } from 'UI';
import { I18NLink, t, Translate } from 'app/I18N';
import { ClientTranslationSchema, IStore } from 'app/istore';
import { advancedSort } from 'app/utils/advancedSort';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { IImmutable } from 'shared/types/Immutable';
import { TranslationContext } from 'shared/translationType';

const TranslationCtx = ({ context }: { context: TranslationContext }) => (
  <>
    <div>
      {context.type && (
        <span className="item-type item-type-empty">
          <span className="item-type__name">
            <Translate>{context.type}</Translate>
          </span>
        </span>
      )}
      {context.label && (
        <I18NLink to={`/settings/translations/edit/${encodeURIComponent(context.id!)}`}>
          {/* expected translations ['User Interface'] */}
          <Translate>{context.label}</Translate>
        </I18NLink>
      )}
    </div>
    <div className="list-group-item-actions">
      <I18NLink
        to={`/settings/translations/edit/${encodeURIComponent(context.id!)}`}
        className="btn btn-default btn-xs"
      >
        <Icon icon="language" /> <Translate>Translate</Translate>
      </I18NLink>
    </div>
  </>
);

const mapStateToProps = (state: IStore) => ({
  translations: state.translations,
  languages: state.settings.collection.get('languages'),
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) => bindActionCreators({ notify }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);
type MappedProps = ConnectedProps<typeof connector>;

const TranslationsList = ({ languages, translations }: MappedProps) => {
  const defaultLanguage = languages!.find(lang => lang!.get('default') === true).get('key');
  const trans: IImmutable<ClientTranslationSchema[]> = translations || fromJS([]);

  const defaultTranslationContexts = trans
    .find(translation => translation!.get('locale') === defaultLanguage)!
    .get('contexts')!
    .toJS();

  const contexts: TranslationContext[] = advancedSort(
    defaultTranslationContexts.map((c: TranslationContext) => ({
      ...c,
      sort: `${c.type || ''} + ${c.label}`,
    })),
    { property: 'sort' }
  );

  const uiContexts = contexts.filter(ctx => ctx.type === 'Uwazi UI');
  const contentContexts = difference(contexts, uiContexts);

  return (
    <div className="settings-content without-footer">
      <div className="TranslationsList panel panel-default">
        <div className="panel-heading">
          {' '}
          <I18NLink to="settings/" className="only-mobile">
            <Icon icon="arrow-left" directionAware />
            <span className="btn-label">
              <Translate>Back</Translate>
            </span>
          </I18NLink>
          <Translate>Translations</Translate>
        </div>
        <h5>
          <Translate>System translations</Translate>
        </h5>
        <ul className="list-group relation-types">
          {uiContexts.map(context => (
            <li key={context._id?.toString()} className="list-group-item">
              <TranslationCtx context={context} />
            </li>
          ))}
        </ul>
        {contentContexts.length > 0 && (
          <>
            <h5>
              <Translate>Content translations</Translate>
            </h5>
            <ul className="list-group relation-types">
              {contentContexts.map(context => (
                <li key={context._id?.toString()} className="list-group-item">
                  <TranslationCtx context={context} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default connector(TranslationsList);
