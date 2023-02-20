import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Icon } from 'UI';
import { withContext } from 'app/componentWrappers';
import { I18NLink, t } from 'app/I18N';
import { IStore, OneUpState } from 'app/istore';
import { switchOneUpEntity, toggleOneUpFullEdit } from 'app/Review/actions/actions';
import { selectIsPristine, selectOneUpState } from '../common';

const defaultProps = {
  isPristine: true,
  oneUpState: {} as OneUpState,
  switchOneUpEntity: (_delta: number, _save: boolean) => {},
  mainContext: { confirm: (_props: {}) => {} },
};

type OneUpTitleBarProps = typeof defaultProps;

class OneUpTitleBarBase extends Component<OneUpTitleBarProps> {
  static defaultProps = defaultProps;

  backToThesaurus() {
    const { oneUpState, isPristine } = this.props;
    if (oneUpState.reviewThesaurusName) {
      return (
        <I18NLink
          to={`/settings/dictionaries/cockpit/${oneUpState.reviewThesaurusId}`}
          className="btn btn-default"
          confirmTitle={isPristine ? '' : 'Confirm discard changes'}
          confirmMessage={
            isPristine
              ? ''
              : 'There are unsaved changes. Are you sure you want to discard them and navigate away?'
          }
        >
          <Icon icon="arrow-left" />
          <span className="btn-label">
            {t('System', 'Back to')} <span>{`'${oneUpState.reviewThesaurusName}'`}</span>
          </span>
        </I18NLink>
      );
    }
    return null;
  }

  navButtons() {
    const { oneUpState, isPristine } = this.props;
    const prevClass = oneUpState.indexInDocs > 0 ? '' : ' btn-disabled';
    const nextClass = oneUpState.indexInDocs < oneUpState.totalDocs - 1 ? '' : ' btn-disabled';
    const navAction = isPristine
      ? (delta: number) => () => this.props.switchOneUpEntity(delta, false)
      : (delta: number) => () =>
          this.props.mainContext.confirm({
            accept: () => this.props.switchOneUpEntity(delta, false),
            title: 'Confirm discard changes',
            message:
              'There are unsaved changes. Are you sure you want to discard them and switch to a different document?',
          });
    return (
      <span>
        <button type="button" onClick={navAction(-1)} className={`btn btn-default${prevClass}`}>
          <Icon icon="arrow-left" />
        </button>
        <button type="button" onClick={navAction(+1)} className={`btn btn-default${nextClass}`}>
          <Icon icon="arrow-right" />
        </button>
      </span>
    );
  }

  render() {
    const { oneUpState } = this.props;

    return (
      <div className="content-header-title">
        {this.backToThesaurus()}
        {oneUpState.reviewThesaurusValues && oneUpState.reviewThesaurusValues.length === 1 ? (
          <span className="large">
            <span className="space8" />
            {t('System', 'Documents including suggestion:')}{' '}
            <b>{`'${oneUpState.reviewThesaurusValues[0]}'`}</b>
            <span className="separator" />
          </span>
        ) : (
          <span className="large">
            <span className="space8" />
            {t('System', 'Documents for custom filter')}
            <span className="separator" />
          </span>
        )}
        {oneUpState.totalDocs ? (
          <div>
            {t('System', 'Document')} <span>{oneUpState.indexInDocs + 1}</span> {t('System', 'of')}{' '}
            <span>
              {oneUpState.totalDocs >= oneUpState.maxTotalDocs
                ? `>${oneUpState.totalDocs - 1}`
                : `${oneUpState.totalDocs}`}
            </span>
            <span className="space8" />
          </div>
        ) : (
          t('System', 'No Documents found')
        )}
        {this.navButtons()}
      </div>
    );
  }
}

const mapStateToProps = (state: IStore) => ({
  isPristine: selectIsPristine(state),
  oneUpState: selectOneUpState(state) ?? ({} as OneUpState),
});

function mapDispatchToProps(dispatch: Dispatch<IStore>) {
  return bindActionCreators(
    {
      switchOneUpEntity,
      toggleOneUpFullEdit,
    },
    dispatch
  );
}

export { OneUpTitleBarBase };
export type { OneUpTitleBarProps };
export const OneUpTitleBar = connect(
  mapStateToProps,
  mapDispatchToProps
)(withContext(OneUpTitleBarBase));
