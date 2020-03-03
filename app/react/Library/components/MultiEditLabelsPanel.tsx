import { EntitySchema } from 'api/entities/entityType';
import { MultiSelectTristate } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { IImmutable } from 'shared/types/Immutable';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';
import { MultiEditOpts, MultiEditState, StoreState } from '../actions/multiEditActions';
import { translateOptions } from 'app/Metadata/components/MetadataFormFields';

const defaultProps = {
  formKey: 'library.sidepanel.multipleEdit',
  multipleEdit: {} as MultiEditState,
  multiEditThesaurus: undefined as IImmutable<ThesaurusSchema> | undefined,
  opts: {} as MultiEditOpts,
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
    const { multiEditThesaurus, multipleEdit, selectedDocuments } = this.props;
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
        <div className="sidepanel-body">
          {!multiEditThesaurus && <label>Wrong thesaurus!</label>}
          {multiEditThesaurus && !Object.keys(multipleEdit).length && (
            <label>No fields of thesaurus!</label>
          )}
          {multiEditThesaurus &&
            Object.keys(multipleEdit).length &&
            Object.keys(multipleEdit).map(p => (
              <div className="form-group" key={p}>
                <MultiSelectTristate
                  model={`library.sidepanel.multipleEdit.${p}`}
                  optionsValue="id"
                  options={translateOptions(multiEditThesaurus)}
                  prefix={`library.sidepanel.multipleEdit.${p}`}
                  sort
                  placeholder={`${t('System', 'Search', null, false)} '${multiEditThesaurus.get(
                    'name'
                  )}'`}
                />
              </div>
            ))}
        </div>
        <div className="sidepanel-footer">{this.renderListButtons(canBePublished)}</div>
      </SidePanel>
    );
  }
}

export const selectMultiEditThesaurus = createSelector(
  (state: StoreState) =>
    state.thesauris.find(
      thes => thes.get('_id') === state.library.sidepanel.multiEditOpts.get('thesaurus')
    ),
  thes => thes
);

export const mapStateToProps = (state: StoreState) => ({
  selectedDocuments: state.library.ui.get('selectedDocuments'),
  multipleEdit: state.library.sidepanel.multipleEdit,
  multiEditThesaurus: selectMultiEditThesaurus(state),
  opts: state.library.sidepanel.multiEditOpts.toJS(),
});

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      resetForm: metadataActions.resetReduxForm,
      multipleUpdate: metadataActions.multipleUpdate,
      unselectAllDocuments,
    },
    wrapDispatch(dispatch, 'library')
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiEditLabelsPanel);
