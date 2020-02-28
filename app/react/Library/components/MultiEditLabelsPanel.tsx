import { EntitySchema } from 'api/entities/entityType';
import { t } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import * as metadataActions from 'app/Metadata/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IImmutable } from 'shared/types/Immutable';
import { Icon } from 'UI';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';

const defaultProps = {
  storeKey: 'library',
  formKey: 'library.sidepanel.multiEditLabel',
  unselectAllDocuments: () => {},
  resetForm: (_s: string) => {},
  revertMultiEditLabels: () => {},
  applyMultiEditLabels: () => {},
  selectedDocuments: Immutable.fromJS([]) as IImmutable<EntitySchema[]>,
  multipleUpdate: (_o: IImmutable<EntitySchema[]>, _diff: EntitySchema) => {},
};

export type MultiEditLabelsPanelProps = typeof defaultProps;

export class MultiEditLabelsPanel extends Component<MultiEditLabelsPanelProps> {
  static defaultProps = defaultProps;

  static contextTypes = {
    confirm: PropTypes.func,
  };

  constructor(props: MultiEditLabelsPanelProps) {
    super(props);
    this.close = this.close.bind(this);
    this.publish = this.publish.bind(this);
  }

  close() {
    this.props.unselectAllDocuments();
    this.props.resetForm(this.props.formKey);
  }

  publish() {
    this.context.confirm({
      accept: () => {
        this.props.multipleUpdate(this.props.selectedDocuments, { published: true });
      },
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Confirm publish multiple items', null, false),
      type: 'success',
    });
  }

  cancel() {
    this.context.confirm({
      accept: () => {
        this.props.resetForm(this.props.formKey);
      },
      title: t('System', 'Confirm', null, false),
      message: t('System', 'Discard changes', null, false),
    });
  }

  renderEditingButtons() {
    return (
      <React.Fragment>
        <button
          type="button"
          onClick={this.cancel}
          className="cancel-edit-metadata btn btn-primary"
        >
          <Icon icon="times" />
          <span className="btn-label">{t('System', 'Discard')}</span>
        </button>
      </React.Fragment>
    );
  }

  renderListButtons(canBePublished: boolean) {
    return (
      <React.Fragment>
        {canBePublished && (
          <button type="button" className="publish btn btn-success" onClick={this.publish}>
            <Icon icon="paper-plane" />
            <span className="btn-label">{t('System', 'Publish')}</span>
          </button>
        )}
      </React.Fragment>
    );
  }

  render() {
    const { selectedDocuments } = this.props;
    const canBePublished = this.props.selectedDocuments.reduce((previousCan, entity) => {
      const isEntity = !entity.get('file');
      return (
        previousCan &&
        (entity.get('processed') || isEntity) &&
        !entity.get('published') &&
        !!entity.get('template')
      );
    }, true);

    return (
      <SidePanel open={selectedDocuments.size > 0} className="multi-edit">
        <div className="sidepanel-header">
          <Icon icon="check" />{' '}
          <span>
            {selectedDocuments.size} {t('System', 'selected')}
          </span>
          <button type="button" className="closeSidepanel close-modal" onClick={this.close}>
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body"></div>
        <div className="sidepanel-footer">{this.renderListButtons(canBePublished)}</div>
      </SidePanel>
    );
  }
}

export const mapStateToProps = (state: any, props: MultiEditLabelsPanelProps) => ({
  selectedDocuments: state[props.storeKey].ui.get('selectedDocuments'),
});

function mapDispatchToProps(dispatch: any, props: MultiEditLabelsPanelProps) {
  return bindActionCreators(
    {
      resetForm: metadataActions.resetReduxForm,
      multipleUpdate: metadataActions.multipleUpdate,
      unselectAllDocuments,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiEditLabelsPanel);
