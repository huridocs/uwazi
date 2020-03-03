import { EntitySchema } from 'api/entities/entityType';
import { t } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { translateOptions } from 'app/Metadata/components/MetadataFormFields';
import { wrapDispatch } from 'app/Multireducer';
import { MultiSelectTristate } from 'app/ReactReduxForms';
import { StateSelector } from 'app/Review/components/StateSelector';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';
import {
  maybeSaveMultiEdit,
  MultiEditOpts,
  MultiEditState,
  selectedDocumentsChanged,
  StoreState,
  toggleAutoSaveMode,
} from '../actions/multiEditActions';

const defaultProps = {
  formKey: 'library.sidepanel.multipleEdit',
  multipleEdit: {} as MultiEditState,
  multiEditThesaurus: undefined as IImmutable<ThesaurusSchema> | undefined,
  opts: {} as MultiEditOpts,
  selectedDocuments: Immutable.fromJS([]) as IImmutable<EntitySchema[]>,
  templates: Immutable.fromJS([]) as IImmutable<TemplateSchema[]>,
  unselectAllDocuments: () => {},
  toggleAutoSaveMode: () => {},
  selectedDocumentsChanged: () => {},
  maybeSaveMultiEdit: () => {},
  multipleUpdate: (_o: IImmutable<EntitySchema[]>, _diff: EntitySchema) => {},
};

export type MultiEditLabelsPanelProps = typeof defaultProps;

export const selectIsPristine = createSelector(
  (state: StoreState) => state.library.sidepanel.multipleEditForm.$form.pristine,
  value => value
);

export class MultiEditLabelsPanel extends Component<MultiEditLabelsPanelProps> {
  static defaultProps = defaultProps;

  static contextTypes = {
    confirm: PropTypes.func,
  };

  constructor(props: MultiEditLabelsPanelProps) {
    super(props);
    this.publish = this.publish.bind(this);
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

  renderAutoSaveToggle() {
    const { opts } = this.props;
    return (
      <button
        type="button"
        onClick={() => this.props.toggleAutoSaveMode()}
        className={`btn btn-default btn-header btn-toggle-${opts.autoSave ? 'on' : 'off'}`}
      >
        <Icon icon={opts.autoSave ? 'toggle-on' : 'toggle-off'} />
        <span className="btn-label">{t('System', 'Auto-save')}</span>
      </button>
    );
  }

  renderEditingButtons() {
    return (
      <React.Fragment>
        <button
          type="button"
          onClick={() => this.props.selectedDocumentsChanged()}
          className="cancel-edit-metadata btn btn-primary"
        >
          <Icon icon="times" />
          <span className="btn-label">{t('System', 'Discard')}</span>
        </button>
      </React.Fragment>
    );
  }

  renderButtons(canBePublished: boolean) {
    return (
      <StateSelector isPristine={selectIsPristine}>
        {({ isPristine }: { isPristine: boolean }) => {
          const btnClass = isPristine ? 'btn btn-default btn-disabled' : 'btn btn-default';
          return (
            <React.Fragment>
              {canBePublished && isPristine && (
                <button type="button" className="publish btn btn-success" onClick={this.publish}>
                  <Icon icon="paper-plane" />
                  <span className="btn-label">{t('System', 'Publish')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => this.props.selectedDocumentsChanged()}
                className={`cancel-edit-metadata ${!isPristine ? 'btn-danger' : ''} ${btnClass}`}
              >
                <Icon icon="undo" />
                <span className="btn-label">{t('System', 'Discard changes')}</span>
              </button>
              <button
                type="button"
                onClick={() => this.props.maybeSaveMultiEdit()}
                className={`save-metadata ${btnClass}`}
              >
                <Icon icon="save" />
                <span className="btn-label">{t('System', 'Save document(s)')}</span>
              </button>
            </React.Fragment>
          );
        }}
      </StateSelector>
    );
  }

  renderProp(propName: string) {
    const { multiEditThesaurus, templates } = this.props;
    const prop = templates
      .map(tmpl => tmpl?.get('properties')?.find(p => p?.get('name') === propName))
      .filter(p => !!p);
    return (
      <div className="form-group" key={propName}>
        <ul className="search__filter is-active">
          <li className="title">
            <label>{t('System', prop.size ? prop.get(0)?.get('label') : propName)}</label>
          </li>
          <li className="wide" />
          <MultiSelectTristate
            model={`library.sidepanel.multipleEdit.${propName}`}
            optionsValue="id"
            options={translateOptions(multiEditThesaurus)}
            prefix={`library.sidepanel.multipleEdit.${propName}`}
            sort
            placeholder={`${t('System', 'Search', null, false)} '${multiEditThesaurus!.get(
              'name'
            )}'`}
          />
        </ul>
      </div>
    );
  }

  render() {
    const { multiEditThesaurus, multipleEdit, selectedDocuments } = this.props;
    const canBePublished = this.props.selectedDocuments.reduce((previousCan, entity) => {
      const isEntity = !entity!.get('file');
      return (
        !!previousCan &&
        (entity!.get('processed') || isEntity) &&
        !entity!.get('published') &&
        !!entity!.get('template')
      );
    }, true);

    return (
      <SidePanel open={selectedDocuments.size > 0} className="multi-edit">
        <div className="sidepanel-header">
          <Icon icon="check" />{' '}
          <span>
            {selectedDocuments.size} {t('System', 'selected')}
          </span>
          {this.renderAutoSaveToggle()}
          <button
            type="button"
            className="closeSidepanel close-modal"
            onClick={() => this.props.unselectAllDocuments()}
          >
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body">
          {!multiEditThesaurus && (
            <label className="errormsg">
              {
                "Oops! We couldn't find the thesaurus you're trying to edit. Try navigating back to this page through Settings."
              }
            </label>
          )}
          {multiEditThesaurus && !Object.keys(multipleEdit).length && (
            <label className="errormsg">
              Nothing to see here! The selected documents are not using the selected thesaurus&nbsp;
              <b>{multiEditThesaurus.get('name')}</b>. Try selecting other documents.
            </label>
          )}
          {multiEditThesaurus &&
            Object.keys(multipleEdit).length > 0 &&
            Object.keys(multipleEdit)
              .sort()
              .map(p => this.renderProp(p))}
        </div>
        <div className="sidepanel-footer">{this.renderButtons(canBePublished)}</div>
      </SidePanel>
    );
  }
}

export const selectMultiEditThesaurus = createSelector(
  (state: StoreState) =>
    state.thesauris.find(
      thes => thes!.get('_id') === state.library.sidepanel.multiEditOpts.get('thesaurus')
    ),
  thes => thes
);

export const mapStateToProps = (state: StoreState) => ({
  selectedDocuments: state.library.ui.get('selectedDocuments'),
  multipleEdit: state.library.sidepanel.multipleEdit,
  multiEditThesaurus: selectMultiEditThesaurus(state),
  opts: state.library.sidepanel.multiEditOpts.toJS(),
  templates: createSelector(
    (s: StoreState) => s.templates,
    tmpls => tmpls
  )(state),
});

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      unselectAllDocuments,
      toggleAutoSaveMode,
      selectedDocumentsChanged,
      maybeSaveMultiEdit,
      multipleUpdate: metadataActions.multipleUpdate,
    },
    wrapDispatch(dispatch, 'library')
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiEditLabelsPanel);
