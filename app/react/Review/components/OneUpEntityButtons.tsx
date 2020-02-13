/** @format */
import { t } from 'app/I18N';
import { switchOneUpEntity, reviewAndPublish } from 'app/Review/actions/actions';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Icon } from 'UI';
import { StoreState, selectIsPristine } from '../common';

const defaultProps = {
  isPristine: true,
  isLast: false,
  thesaurusName: '',
  switchOneUpEntity: (_delta: number, _save: boolean) => {},
  reviewAndPublish: (_refName: string) => {},
};

export type OneUpEntityButtonsProps = typeof defaultProps;

export class OneUpEntityButtonsBase extends Component<OneUpEntityButtonsProps> {
  static defaultProps = defaultProps;

  render() {
    const { isPristine } = this.props;
    const btnClass = isPristine ? 'btn btn-default btn-disabled' : 'btn btn-default';
    return (
      <div className="content-footer">
        <button
          type="button"
          onClick={() => this.props.switchOneUpEntity(0, false)}
          className={`cancel-edit-metadata ${!isPristine ? 'btn-danger' : ''} ${btnClass}`}
        >
          <Icon icon="undo" />
          <span className="btn-label">{t('System', 'Discard changes')}</span>
        </button>
        <button
          type="button"
          onClick={() => this.props.switchOneUpEntity(0, true)}
          className={`save-metadata ${btnClass}`}
        >
          <Icon icon="save" />
          <span className="btn-label">{t('System', 'Save document')}</span>
        </button>
        {this.renderNextButton(isPristine, btnClass)}
      </div>
    );
  }

  renderNextButton(isPristine: boolean, btnClass: string) {
    let retVal;

    if (this.props.isLast) {
      retVal = (
        <button
          type="button"
          onClick={() => this.props.reviewAndPublish(this.props.thesaurusName)}
          className={`save-and-next ${!isPristine ? 'btn-success' : ''} ${btnClass}`}
        >
          <Icon icon="save-and-next" />
          <span className="btn-label">{t('System', 'Review & Publish')}</span>
        </button>
      );
    } else {
      retVal = (
        <button
          type="button"
          onClick={() => this.props.switchOneUpEntity(+1, true)}
          className={`save-and-next ${!isPristine ? 'btn-success' : ''} ${btnClass}`}
        >
          <Icon icon="save-and-next" />
          <span className="btn-label">{t('System', 'Save and go to next')}</span>
        </button>
      );
    }

    return retVal;
  }
}

const mapStateToProps = (state: StoreState) => ({
  isPristine: selectIsPristine(state),
});

function mapDispatchToProps(dispatch: Dispatch<StoreState>) {
  return bindActionCreators(
    {
      switchOneUpEntity,
      reviewAndPublish,
    },
    dispatch
  );
}

export const OneUpEntityButtons = connect(
  mapStateToProps,
  mapDispatchToProps
)(OneUpEntityButtonsBase);
