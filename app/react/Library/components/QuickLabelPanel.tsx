import React, { Component } from 'react';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { withContext } from 'app/componentWrappers';
import { t, Translate } from 'app/I18N';
import { Notice } from 'app/Thesauri/Notice';
import { IStore, QuickLabelState, QuickLabelMetadata } from 'app/istore';
import SidePanel from 'app/Layout/SidePanel';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { translateOptions } from 'app/Metadata/components/MetadataFormFields';
import { wrapDispatch } from 'app/Multireducer';
import { MultiSelectTristate } from 'app/ReactReduxForms';
import { StateSelector } from 'app/Review/components/StateSelector';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';
import {
  maybeSaveQuickLabels,
  selectedDocumentsChanged,
  toggleQuickLabelAutoSave,
} from '../actions/quickLabelActions';

const defaultProps = {
  formKey: 'library.sidepanel.quickLabelMetadata',
  quickLabelMetadata: {} as QuickLabelMetadata,
  quickLabelThesaurus: undefined as IImmutable<ThesaurusSchema> | undefined,
  opts: {} as QuickLabelState,
  selectedDocuments: Immutable.fromJS([]) as IImmutable<EntitySchema[]>,
  templates: Immutable.fromJS([]) as IImmutable<TemplateSchema[]>,
  unselectAllDocuments: () => {},
  toggleQuickLabelAutoSave: () => {},
  selectedDocumentsChanged: () => {},
  maybeSaveQuickLabels: (_force: boolean) => {},
  multipleUpdate: (_o: IImmutable<EntitySchema[]>, _diff: EntitySchema) => {},
  mainContext: { confirm: (_props: {}) => {} },
};

export type QuickLabelPanelProps = typeof defaultProps;
export const selectIsPristine = createSelector(
  (state: IStore) => state.library.sidepanel.quickLabelMetadataForm.$form.pristine,
  value => value
);

export class QuickLabelPanelBase extends Component<QuickLabelPanelProps> {
  static defaultProps = defaultProps;

  constructor(props: QuickLabelPanelProps) {
    super(props);
    this.publish = this.publish.bind(this);
  }

  publish() {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.multipleUpdate(this.props.selectedDocuments, { published: true });
      },
      title: 'Confirm',
      message: 'Confirm publish multiple items',
      type: 'success',
    });
  }

  renderAutoSaveToggle() {
    const { opts } = this.props;
    return (
      <button
        type="button"
        onClick={() => this.props.toggleQuickLabelAutoSave()}
        className={`btn btn-default btn-header btn-toggle-${opts.autoSave ? 'on' : 'off'}`}
      >
        <Icon icon={opts.autoSave ? 'toggle-on' : 'toggle-off'} />
        <span className="btn-label">
          <Translate>Auto-save</Translate>
        </span>
      </button>
    );
  }

  renderButtons(canBePublished: boolean) {
    return (
      // @ts-expect-error
      <StateSelector isPristine={selectIsPristine}>
        {({ isPristine }: { isPristine: boolean }) => {
          const btnClass = isPristine ? 'btn btn-default btn-disabled' : 'btn btn-default';
          return (
            <>
              {canBePublished && isPristine && (
                <button type="button" className="publish btn btn-success" onClick={this.publish}>
                  <Icon icon="paper-plane" />
                  <span className="btn-label">
                    <Translate>Publish</Translate>
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => this.props.selectedDocumentsChanged()}
                className={`cancel-edit-metadata ${!isPristine ? 'btn-danger' : ''} ${btnClass}`}
              >
                <Icon icon="undo" />
                <span className="btn-label">
                  <Translate>Discard changes</Translate>
                </span>
              </button>
              <button
                type="button"
                onClick={() => this.props.maybeSaveQuickLabels(true)}
                className={`save-metadata ${btnClass}`}
              >
                <Icon icon="save" />
                <span className="btn-label">
                  <Translate>Save document(s)</Translate>
                </span>
              </button>
            </>
          );
        }}
      </StateSelector>
    );
  }

  renderProp(propName: string) {
    const { quickLabelThesaurus, templates } = this.props;
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
            model={`library.sidepanel.quickLabelMetadata.${propName}`}
            optionsValue="id"
            options={translateOptions(quickLabelThesaurus)}
            prefix={`library.sidepanel.quickLabelMetadata.${propName}`}
            sort
            placeholder={`${t('System', 'Search', null, false)} '${quickLabelThesaurus!.get(
              'name'
            )}'`}
          />
        </ul>
      </div>
    );
  }

  static renderNotice() {
    return (
      <Notice title="Label your collection">
        <div>
          <div>
            <Translate translationKey="Label your collection note">
              Note: Make the sample set of documents for each topic diverse and representative. For
              example, use various methods to find sample documents and don't just search for the
              term "education" to find documents for the topic "Education".
            </Translate>
            <br />
            <br />
            <Translate>
              Return to the thesaurus page when you finished labeling to start learning.
            </Translate>
          </div>
        </div>
      </Notice>
    );
  }

  renderSidePanelBody() {
    const { quickLabelThesaurus, quickLabelMetadata } = this.props;
    let content;
    if (!quickLabelThesaurus) {
      content = (
        <div>
          {QuickLabelPanelBase.renderNotice()}
          <label className="errormsg">
            <Translate>
              Oops! We couldn't find the thesaurus you're trying to edit. Try navigating back to
              this page through Settings.
            </Translate>
          </label>
        </div>
      );
    } else if (!Object.keys(quickLabelMetadata).length) {
      content = (
        <div>
          {QuickLabelPanelBase.renderNotice()}
          <label className="errormsg">
            <Translate>
              Nothing to see here! The selected documents are not using the selected thesaurus
            </Translate>
            &nbsp;
            <b>{quickLabelThesaurus.get('name')}</b>.{' '}
            <Translate>Try selecting other documents.</Translate>
          </label>
        </div>
      );
    } else {
      content = (
        <div>
          {QuickLabelPanelBase.renderNotice()}
          {Object.keys(quickLabelMetadata)
            .sort()
            .map(p => this.renderProp(p))}
        </div>
      );
    }

    return content;
  }

  render() {
    const { selectedDocuments } = this.props;
    const canBePublished = this.props.selectedDocuments.reduce((previousCan, entity) => {
      const isEntity = !entity!.get('file');
      return (
        !!previousCan &&
        (!!entity!.get('processed') || isEntity) &&
        !entity!.get('published') &&
        !!entity!.get('template')
      );
    }, true);

    return (
      <SidePanel open={selectedDocuments.size > 0} className="quick-label">
        <div className="sidepanel-header">
          <Icon icon="check" />{' '}
          <span>
            {selectedDocuments.size} <Translate>selected</Translate>
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
        <div className="sidepanel-body">{this.renderSidePanelBody()}</div>
        <div className="sidepanel-footer">{this.renderButtons(canBePublished)}</div>
      </SidePanel>
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
  selectedDocuments: state.library.ui.get('selectedDocuments'),
  quickLabelMetadata: state.library.sidepanel.quickLabelMetadata,
  quickLabelThesaurus: selectquickLabelThesaurus(state),
  opts: state.library.sidepanel.quickLabelState.toJS(),
  templates: createSelector(
    (s: IStore) => s.templates,
    tmpls => tmpls
  )(state),
});

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      unselectAllDocuments,
      toggleQuickLabelAutoSave,
      selectedDocumentsChanged,
      maybeSaveQuickLabels,
      multipleUpdate: metadataActions.multipleUpdate,
    },
    wrapDispatch(dispatch, 'library')
  );
}

export const QuickLabelPanel = connect(
  mapStateToProps,
  mapDispatchToProps
)(withContext(QuickLabelPanelBase));
