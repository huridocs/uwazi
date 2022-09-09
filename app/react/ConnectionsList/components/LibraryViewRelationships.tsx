import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import PropTypes from 'prop-types';
import { Map, List } from 'immutable';
import { bindActionCreators } from 'redux';
import { Icon } from 'app/UI';
import { Item } from 'app/Layout';
import { Collapsible } from 'app/App/Collapsible';
import { StickyHeader } from 'app/App/StickyHeader';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import * as actions from '../../Relationships/actions/actions';
import LoadMoreRelationshipsButton from 'app/Relationships/components/LoadMoreRelationshipsButton';

interface LibraryViewRelationshipsProps {
  expanded: boolean;
}

function mapStateToProps(state: any) {
  const { relationships, library } = state;
  return {
    parentEntity: library.ui.getIn(['selectedDocuments', 0]),
    searchResults: relationships.list.searchResults,
    search: relationships.list.sort,
    hubs: relationships.hubs,
    relationTypes: actions.selectRelationTypes(state),
  };
}

function mapDispatchToProps(dispatch: any) {
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
  relationTypes: any[],
  selectConnection: Function,
  expanded: boolean
) => (
  <div className="sidepanel-relationship-right">
    {rightRelationships.map((relationship: any, relationshipIndex: number) => {
      let header;
      const relationshipTemplateId = relationship.get('template');
      const relationType = relationTypes.find(r => r._id === relationshipTemplateId);
      if (relationType) {
        header = relationshipTemplateId ? (
          relationTypes.find(r => r._id === relationshipTemplateId).name
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
          key={relationshipIndex}
        >
          <>
            {entityRelationships.map((rel: any, entityRelationshipsIndex: number) => (
              <div
                className="sidepanel-relationship-right-entity"
                key={entityRelationshipsIndex}
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

const createLabelGroups = (
  hub: any,
  relationTypes: any[],
  selectConnection: Function,
  expanded: boolean,
  index: number
) => {
  const template = hub.getIn(['leftRelationship', 'template']);
  return (
    <StickyHeader
      scrollElementSelector=".scrollable"
      stickyElementSelector=".sidepanel-relationship-left-label"
    >
      <div className="sidepanel-relationship" key={index}>
        {template && (
          <span className="sidepanel-relationship-left-label">
            {`${relationTypes.find(r => r._id === template).name}`}
          </span>
        )}
        {createRightRelationshipGroups(
          hub.get('rightRelationships'),
          relationTypes,
          selectConnection,
          expanded
        )}
      </div>
    </StickyHeader>
  );
};

const LibraryViewRelationshipsComp = (props: ComponentProps) => {
  const {
    hubs,
    searchResults,
    parentEntity,
    parseResults,
    relationTypes,
    expanded,
    selectConnection,
  } = props;
  useEffect(() => {
    if (parentEntity) {
      parseResults(searchResults, parentEntity, false);
    }
  }, [searchResults, parentEntity]);
  return (
    <>
      <div className="sidepanel-relationships">
        {hubs.map((hub: any, index: number) =>
          createLabelGroups(hub, relationTypes, selectConnection, expanded, index)
        )}
      </div>
      <LoadMoreRelationshipsButton />
      <RelationshipMetadata />
    </>
  );
};

LibraryViewRelationshipsComp.propTypes = {
  selectConnection: PropTypes.func.isRequired,
  parentEntity: PropTypes.instanceOf(Map),
  hubs: PropTypes.instanceOf(List).isRequired,
  searchResults: PropTypes.instanceOf(Map).isRequired,
  parseResults: PropTypes.func.isRequired,
  relationTypes: PropTypes.instanceOf(Array).isRequired,
  expanded: PropTypes.bool,
};

const LibraryViewRelationships = connector(LibraryViewRelationshipsComp);

export { LibraryViewRelationshipsComp, LibraryViewRelationships };
