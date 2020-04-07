import { t } from 'app/I18N';
import I18NLink from 'app/I18N/components/I18NLink';
import { IStore } from 'app/istore';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IImmutable } from 'shared/types/Immutable';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';

const defaultProps = {
  quickLabelThesaurus: undefined as IImmutable<ThesaurusSchema> | undefined,
};

export type QuickLabelHeaderProps = typeof defaultProps;

export class QuickLabelHeaderBase extends Component<QuickLabelHeaderProps> {
  static defaultProps = defaultProps;

  render() {
    const { quickLabelThesaurus } = this.props;
    const thesaurusName = quickLabelThesaurus ? quickLabelThesaurus.get('name') : '';
    return (
      <div className="content-header">
        {!thesaurusName && (
          <div className="content-header-title">
            <h1>
              {t('System', 'Ooops... please go')}
              &nbsp;
              <I18NLink className="btn btn-default" to="/settings/dictionaries">
                <Icon icon="arrow-left" />
                &nbsp;
                <span className="btn-label">{t('System', 'Back to thesauri')}</span>
              </I18NLink>
            </h1>
          </div>
        )}
        {thesaurusName && (
          <div className="content-header-title">
            <I18NLink
              className="btn btn-default"
              to={`/settings/dictionaries/cockpit/${quickLabelThesaurus?.get('_id')}`}
            >
              <Icon icon="arrow-left" />
              &nbsp;
              <span className="btn-label">{t('System', 'Back to thesaurus')}</span>
            </I18NLink>
            <h1>
              <span className="large">
                {t('System', 'Quick labeling for')}&nbsp;<b>{thesaurusName}</b>
              </span>
            </h1>
          </div>
        )}
      </div>
    );
  }
}

export const selectquickLabelThesaurus = createSelector(
  (state: IStore) =>
    state.thesauris.find(
      thes => thes!.get('_id') === state.library.sidepanel.quickLabelState.get('thesaurus')
    ),
  thes => thes
);

export const mapStateToProps = (state: IStore) => ({
  quickLabelThesaurus: selectquickLabelThesaurus(state),
});

export const QuickLabelHeader = connect(mapStateToProps)(QuickLabelHeaderBase);
