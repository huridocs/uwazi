// eslint-disable-line max-lines
import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { TabContent, Tabs } from 'react-tabs-redux';
import { bindActionCreators, Dispatch } from 'redux';
import Immutable from 'immutable';
import Footer from 'app/App/Footer';
import ShowIf from 'app/App/ShowIf';
import { withContext } from 'app/componentWrappers';
import { AttachmentsList } from 'app/Attachments';
import { FileList } from 'app/Attachments/components/FileList';
import { CreateConnectionPanel } from 'app/Connections';
import { ConnectionsList } from 'app/ConnectionsList';
import { connectionsChanged, deleteConnection } from 'app/ConnectionsList/actions/actions';
import ContextMenu from 'app/ContextMenu';
import { ShowSidepanelMenu } from 'app/Entities/components/ShowSidepanelMenu';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, IStore, OneUpState } from 'app/istore';
import { Icon as PropertyIcon, TemplateLabel } from 'app/Layout';
import Tip from 'app/Layout/Tip';
import { MetadataForm, ShowMetadata } from 'app/Metadata';
import { RelationshipsFormButtons } from 'app/Relationships';
import AddEntitiesPanel from 'app/Relationships/components/AddEntities';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import { toggleOneUpFullEdit } from 'app/Review/actions/actions';
import { OneUpEntityButtons } from 'app/Review/components/OneUpEntityButtons';
import { OneUpSidePanel } from 'app/Review/components/OneUpSidePanel';
import { OneUpTitleBar } from 'app/Review/components/OneUpTitleBar';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { Icon } from 'UI';
import { selectEntity, selectMlThesauri, selectOneUpState } from '../common';

const defaultProps = {
  entity: {} as ClientEntitySchema,
  relationships: Immutable.fromJS([]) as IImmutable<any>,
  templates: Immutable.fromJS([]) as IImmutable<TemplateSchema[]>,
  mlThesauri: [] as string[],
  oneUpState: {} as OneUpState,
  tab: 'info',
  connectionsChanged: () => {},
  deleteConnection: (_reference: any) => {},
  toggleOneUpFullEdit: () => {},
  mainContext: { confirm: (_props: {}) => {} },
};

type OneUpEntityViewerProps = typeof defaultProps;

interface OneUpEntityViewerState {
  panelOpen: boolean;
}

class OneUpEntityViewerBase extends Component<OneUpEntityViewerProps, OneUpEntityViewerState> {
  static defaultProps = defaultProps;

  constructor(props: OneUpEntityViewerProps, context: any) {
    super(props, context);
    this.state = {
      panelOpen: true,
    };
    this.closePanel = this.closePanel.bind(this);
    this.openPanel = this.openPanel.bind(this);
    this.deleteConnection = this.deleteConnection.bind(this);
  }

  deleteConnection(reference: any) {
    if (reference.sourceType !== 'metadata') {
      this.props.mainContext.confirm({
        accept: () => {
          this.props.deleteConnection(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?',
      });
    }
  }

  closePanel() {
    this.setState({ panelOpen: false });
  }

  openPanel() {
    this.setState({ panelOpen: true });
  }

  nonMlProps() {
    const { entity, mlThesauri, templates } = this.props;
    const template: IImmutable<TemplateSchema> =
      templates.find(tmpl => tmpl!.get('_id') === entity.template) ?? Immutable.fromJS({});
    const properties: IImmutable<PropertySchema[]> =
      template.get('properties') ?? Immutable.fromJS([]);
    return properties
      .filter(p => !mlThesauri.includes(p!.get('content') ?? ''))
      .map(p => p!.get('name'))
      .toJS();
  }

  renderFullEditToggle() {
    const { oneUpState } = this.props;
    let onClick = () => this.props.toggleOneUpFullEdit();
    if (!oneUpState.fullEdit) {
      onClick = () =>
        this.props.mainContext.confirm({
          accept: () => this.props.toggleOneUpFullEdit(),
          title: 'Keep this in mind if you want to edit:',
          message:
            "Changes can't be undone after saving. Changing text fields may invalidate the suggestions.",
        });
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          oneUpState.fullEdit ? 'btn btn-default btn-toggle-on' : 'btn btn-default btn-toggle-off'
        }
      >
        <Icon icon={oneUpState.fullEdit ? 'toggle-on' : 'toggle-off'} />
        <span className="btn-label">
          <Translate>Full edit mode</Translate>
        </span>
      </button>
    );
  }

  render() {
    const { entity, tab, relationships, oneUpState, mainContext } = this.props;
    const { panelOpen } = this.state;
    const selectedTab = tab ?? 'info';

    return (
      <div className="row flex">
        <Helmet>
          <title>{entity.title ? entity.title : 'Entity'}</title>
        </Helmet>
        <div className="content-holder">
          <main className="content-main">
            <div className="content-header content-header-entity">
              <OneUpTitleBar mainContext={mainContext} />
              {this.renderFullEditToggle()}
            </div>
            <div className="entity-viewer">
              <Tabs selectedTab={selectedTab}>
                <TabContent
                  for={
                    selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none'
                  }
                >
                  <div className="entity-metadata">
                    <ShowIf if={oneUpState.fullEdit}>
                      <MetadataForm
                        id="fullEditMetadataForm"
                        model="entityView.entityForm"
                        templateId={entity.template?.toString() ?? ''}
                        showSubset={[...this.nonMlProps(), 'title']}
                        version="OneUp"
                      />
                    </ShowIf>
                    <ShowIf if={!oneUpState.fullEdit}>
                      <div>
                        <div className="content-header-title">
                          <PropertyIcon
                            className="item-icon item-icon-center"
                            data={entity.icon}
                            size="sm"
                          />
                          <h1 className="item-name">{entity.title}</h1>
                          <TemplateLabel template={entity.template?.toString() ?? ''} />
                          {entity.published ? (
                            ''
                          ) : (
                            <Tip icon="eye-slash">
                              <Translate>This entity is not public.</Translate>
                            </Tip>
                          )}
                        </div>
                        <ShowMetadata
                          relationships={relationships}
                          entity={entity}
                          showTitle={false}
                          showType={false}
                          showSubset={this.nonMlProps()}
                        />
                        <FileList
                          files={entity.documents}
                          entity={entity}
                          mainContext={mainContext}
                        />
                        <AttachmentsList
                          attachments={entity.attachments}
                          parentId={entity._id}
                          parentSharedId={entity.sharedId}
                          isDocumentAttachments={Boolean(entity.file)}
                          entityView
                          processed={entity.processed}
                        />
                      </div>
                    </ShowIf>
                  </div>
                </TabContent>
                <TabContent for="connections">
                  <ConnectionsList
                    deleteConnection={this.deleteConnection}
                    searchCentered
                    hideFooter
                  />
                </TabContent>
              </Tabs>
            </div>
            <ShowIf if={selectedTab === 'connections'}>
              <div className="content-footer">
                <RelationshipsFormButtons />
              </div>
            </ShowIf>
            <ShowIf if={selectedTab !== 'connections'}>
              <OneUpEntityButtons
                isLast={oneUpState.indexInDocs === oneUpState.totalDocs - 1}
                thesaurusName={oneUpState.reviewThesaurusValues[0]}
              />
            </ShowIf>
            <ContextMenu
              align="bottom"
              overrideShow
              show={!panelOpen}
              className="show-info-sidepanel-context-menu"
            >
              <ShowSidepanelMenu
                className="show-info-sidepanel-menu"
                panelIsOpen={panelOpen}
                openPanel={this.openPanel}
              />
            </ContextMenu>
          </main>
          <OneUpSidePanel panelOpen={panelOpen} closePanel={this.closePanel} />
          <CreateConnectionPanel
            className="entity-create-connection-panel"
            containerId={entity.sharedId}
            onCreate={this.props.connectionsChanged}
          />
          <AddEntitiesPanel />
          <RelationshipMetadata />
        </div>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = (state: IStore) => ({
  entity: selectEntity(state),
  relationships: state.entityView.entity.get('relationships'),
  tab: state.entityView.uiState.get('tab'),
  oneUpState: selectOneUpState(state) ?? ({} as OneUpState),
  templates: state.templates,
  mlThesauri: selectMlThesauri(state),
});

function mapDispatchToProps(dispatch: Dispatch<IStore>) {
  return bindActionCreators(
    {
      connectionsChanged,
      deleteConnection,
      toggleOneUpFullEdit,
    },
    dispatch
  );
}

export type { OneUpEntityViewerProps, OneUpEntityViewerState };
export { OneUpEntityViewerBase };
export const OneUpEntityViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(withContext(OneUpEntityViewerBase));
