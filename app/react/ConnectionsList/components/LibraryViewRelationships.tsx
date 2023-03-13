import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Map } from 'immutable';
import { bindActionCreators, Dispatch } from 'redux';
import { generateID } from 'shared/IDGenerator';
import { Icon } from 'app/UI';
import { Item } from 'app/Layout';
import { Collapsible } from 'app/App/Collapsible';
import { StickyHeader } from 'app/App/StickyHeader';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import LoadMoreRelationshipsButton from 'app/Relationships/components/LoadMoreRelationshipsButton';
import { IStore } from 'app/istore';
import * as actions from '../../Relationships/actions/actions';

interface LibraryViewRelationshipsProps {
  expanded: boolean;
}

function mapStateToProps(state: IStore) {
  const { relationships, library } = state;
  return {
    parentEntity: library.ui.get('selectedDocuments').get(0),
    searchResults: relationships.list.searchResults,
    hubs: relationships.hubs,
    relationTypes: actions.selectRelationTypes(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch<{}>) {
  return bindActionCreators(
    {
      selectConnection: actions.selectConnection,
      parseResults: actions.parseResults,
    },
    dispatch
  );
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type ComponentProps = ConnectedProps<typeof connector> & LibraryViewRelationshipsProps;

const createRightRelationshipGroups = (
  rightRelationships: any,
  props: ComponentProps,
  expanded: boolean,
  key: string
) => {
  const { relationTypes, selectConnection } = props;
  return (
    <div className="sidepanel-relationship-right">
      {rightRelationships.map((relationship: Map<any, any>, index: number) => {
        let header;
        const relationshipTemplateId = relationship.get('template');
        const relationType = relationTypes.find(r => r._id === relationshipTemplateId);
        if (relationType) {
          header = relationshipTemplateId ? (
            relationTypes.find(r => r._id === relationshipTemplateId)?.name
          ) : (
            <Icon icon="link" />
          );
        }

        const entityRelationships = relationship.get('relationships');
        return (
          <Collapsible
            header={header}
            className="sidepanel-relationship-collapsible"
            headerInfo={`(${entityRelationships.size})`}
            collapse={!expanded}
            key={key + index.toString()}
          >
            <>
              {entityRelationships.map((rel: any, entityRelationshipsIndex: number) => (
                <div
                  className="sidepanel-relationship-right-entity"
                  key={index.toString() + entityRelationshipsIndex.toString()}
                  onClick={() => selectConnection(rel.get('entityData'))}
                >
                  <Item
                    active={false}
                    doc={rel.get('entityData')}
                    className="item-collapsed"
                    noMetadata
                  />
                </div>
              ))}
            </>
          </Collapsible>
        );
      })}
    </div>
  );
};

const renderLabel = (template: any, relationTypes: any) =>
  template ? (
    <span className="sidepanel-relationship-left-label">
      {`${relationTypes.find((r: any) => r._id === template).name}`}
    </span>
  ) : (
    <span className="sidepanel-relationship-left-label">
      <Icon icon="link" />
    </span>
  );

const createLabelGroups = (props: ComponentProps, hub: any, key: string) => {
  const { relationTypes, expanded } = props;
  const template = hub.getIn(['leftRelationship', 'template']);
  return (
    <StickyHeader
      scrollElementSelector=".scrollable"
      stickyElementSelector=".sidepanel-relationship-left-label"
      key={key}
    >
      <div className="sidepanel-relationship">
        {renderLabel(template, relationTypes)}
        {createRightRelationshipGroups(hub.get('rightRelationships'), props, expanded, key)}
      </div>
    </StickyHeader>
  );
};

const LibraryViewRelationshipsComp = (props: ComponentProps) => {
  const { hubs, searchResults, parentEntity, parseResults } = props;
  const rowsSize = searchResults.get('rows').size;
  const key = (parentEntity && parentEntity.get('_id'))?.toString() || generateID(6, 6);

  useEffect(() => {
    if (parentEntity && rowsSize > 0) {
      parseResults(searchResults, parentEntity, false);
    }
  }, [searchResults, rowsSize, parentEntity, parseResults]);

  return (
    <>
      <div className="sidepanel-relationships">
        {hubs.map((hub: any) => createLabelGroups(props, hub, key))}
      </div>
      <LoadMoreRelationshipsButton />
      <RelationshipMetadata />
    </>
  );
};

LibraryViewRelationshipsComp.defaultProps = {
  expanded: true,
};

const LibraryViewRelationships = connector(LibraryViewRelationshipsComp);

export { LibraryViewRelationshipsComp, LibraryViewRelationships };
