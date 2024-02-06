// eslint-disable-line max-lines

import { EntitySchema } from 'shared/types/entityType';
import ShowIf from 'app/App/ShowIf';
import { ConnectionsGroups } from 'app/ConnectionsList';
import { connectionsChanged, deleteConnection } from 'app/ConnectionsList/actions/actions';
import { showTab } from 'app/Entities/actions/uiActions';
import { t } from 'app/I18N';
import { IStore, OneUpState } from 'app/istore';
import SidePanel from 'app/Layout/SidePanel';
import { MetadataForm } from 'app/Metadata';
import { toggleOneUpLoadConnections } from 'app/Review/actions/actions';
import { StateSelector } from 'app/Review/components/StateSelector';
import Immutable from 'immutable';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';
import { Action, bindActionCreators, Dispatch } from 'redux';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { Icon } from 'UI';
import { selectEntity, selectIsPristine, selectMlThesauri, selectOneUpState } from '../common';

const defaultProps = {
  entity: {} as EntitySchema,
  connectionsGroups: Immutable.fromJS([]) as IImmutable<any[]>,
  templates: Immutable.fromJS([]) as IImmutable<TemplateSchema[]>,
  mlThesauri: [] as string[],
  oneUpState: {} as OneUpState,
  tab: 'info',
  panelOpen: true,
  selectedConnection: false,
  closePanel: () => {},
  showTab: (_tab: string) => ({}) as Action,
  connectionsChanged: () => {},
  deleteConnection: (_reference: any) => {},
  toggleOneUpLoadConnections: () => {},
};

export type OneUpSidePanelProps = typeof defaultProps;

class OneUpSidePanelBase extends Component<OneUpSidePanelProps> {
  static defaultProps = defaultProps;

  mlProps() {
    const { entity, mlThesauri, templates } = this.props;
    const template: IImmutable<TemplateSchema> =
      templates.find(tmpl => tmpl!.get('_id') === entity.template) ?? Immutable.fromJS({});
    const properties: IImmutable<PropertySchema[]> =
      template.get('properties') ?? Immutable.fromJS([]);
    return properties
      .filter(p => mlThesauri.includes(p!.get('content') ?? ''))
      .map(p => p!.get('name'))
      .toJS() as string[];
  }

  render() {
    const { entity, tab, selectedConnection, connectionsGroups, oneUpState, panelOpen } =
      this.props;
    const selectedTab = tab ?? 'info';

    const summary = connectionsGroups.reduce(
      (summaryData, g: any) => {
        g.get('templates').forEach((tmpl: any) => {
          summaryData!.totalConnections += tmpl.get('count'); // eslint-disable-line no-param-reassign
        });
        return summaryData!;
      },
      { totalConnections: 0 }
    );

    return (
      <SidePanel
        className={`entity-connections entity-${this.props.tab}`}
        open={panelOpen && !selectedConnection}
      >
        <div className="sidepanel-header content-header-tabs">
          <div className="blank" />
          <Tabs
            selectedTab={selectedTab}
            handleSelect={tabName => {
              this.props.showTab(tabName);
            }}
          >
            <ul className="nav nav-tabs">
              <li>
                <TabLink to="info" component="div">
                  <Icon icon="info-circle" />
                  <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                </TabLink>
              </li>
              <li>
                <TabLink to="connections" component="div">
                  <Icon icon="exchange-alt" />
                  <span className="connectionsNumber">{summary.totalConnections}</span>
                  <span className="tab-link-tooltip">{t('System', 'Relationships')}</span>
                </TabLink>
              </li>
            </ul>
          </Tabs>
          <button
            type="button"
            className="closeSidepanel close-modal"
            onClick={this.props.closePanel}
          >
            <Icon icon="times" />
          </button>
        </div>
        <div className="sidepanel-body">
          <Tabs selectedTab={selectedTab}>
            <TabContent for={selectedTab === 'connections' ? selectedTab : 'none'}>
              <ConnectionsGroups />
            </TabContent>
            <TabContent for={selectedTab === 'info' ? selectedTab : 'none'}>
              <MetadataForm
                id="sidePanelMetadataForm"
                model="entityView.entityForm"
                templateId={entity.template?.toString() ?? ''}
                showSubset={this.mlProps()}
                version="OneUp"
              />
            </TabContent>
          </Tabs>
        </div>
        <ShowIf if={selectedTab === 'connections'}>
          {/* @ts-expect-error */}
          <StateSelector isPristine={selectIsPristine}>
            {({ isPristine }: { isPristine: boolean }) => (
              <div className="sidepanel-footer">
                <button
                  type="button"
                  onClick={() => this.props.toggleOneUpLoadConnections()}
                  className={isPristine ? 'btn btn-default' : 'btn btn-default btn-disabled'}
                >
                  <Icon icon={oneUpState.loadConnections ? 'times' : 'undo'} />
                  <span className="btn-label">
                    {t(
                      'System',
                      oneUpState.loadConnections ? 'Hide Connections' : 'Load Connections'
                    )}
                  </span>
                </button>
              </div>
            )}
          </StateSelector>
        </ShowIf>
      </SidePanel>
    );
  }
}

const mapStateToProps = (state: IStore) => ({
  entity: selectEntity(state),
  connectionsGroups: state.relationships.list.connectionsGroups,
  selectedConnection: Boolean(
    state.relationships.connection && state.relationships.connection.get('_id')
  ),
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
      showTab,
      toggleOneUpLoadConnections,
    },
    dispatch
  );
}

export const OneUpSidePanel = connect(mapStateToProps, mapDispatchToProps)(OneUpSidePanelBase);
export { OneUpSidePanelBase };
