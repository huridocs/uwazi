/** @format */
import { t } from 'app/I18N';
import { switchOneUpEntity } from 'app/Review/actions/actions';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Icon } from 'UI';
import { StoreState, selectIsPristine } from '../common';

const defaultProps = {
  isPristine: true,
  switchOneUpEntity: (_delta: number, _save: boolean) => {},
};

export type OneUpEntityButtonsProps = typeof defaultProps;

export class OneUpEntityButtonsBase extends Component<OneUpEntityButtonsProps> {
  static defaultProps = defaultProps;

  render() {
    const { isPristine } = this.props;

    return (
      <div className="content-footer">
        <button
          type="button"
          onClick={() => this.props.switchOneUpEntity(0, false)}
          className={
            !isPristine
              ? 'cancel-edit-metadata btn btn-default btn-danger'
              : 'btn btn-default btn-disabled'
          }
        >
          <Icon icon="undo" />
          <span className="btn-label">{t('System', 'Discard changes')}</span>
        </button>
        <button
          type="button"
          onClick={() => this.props.switchOneUpEntity(0, true)}
          className={!isPristine ? 'save-metadata btn btn-default' : 'btn btn-default btn-disabled'}
        >
          <Icon icon="save" />
          <span className="btn-label">{t('System', 'Save document')}</span>
        </button>
        <button
          type="button"
          onClick={() => this.props.switchOneUpEntity(+1, true)}
          className={
            !isPristine
              ? 'save-and-next btn btn-default btn-success'
              : 'btn btn-default btn-disabled'
          }
        >
          <Icon icon="save" />
          <span className="btn-label">{t('System', 'Save and go to next')}</span>
        </button>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  isPristine: selectIsPristine(state),
});

function mapDispatchToProps(dispatch: Dispatch<StoreState>) {
  return bindActionCreators(
    {
      switchOneUpEntity,
    },
    dispatch
  );
}

export const OneUpEntityButtons = connect(
  mapStateToProps,
  mapDispatchToProps
)(OneUpEntityButtonsBase);
