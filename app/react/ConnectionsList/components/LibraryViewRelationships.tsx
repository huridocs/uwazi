import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import PropTypes from 'prop-types';
import { Map, List } from 'immutable';
import { bindActionCreators } from 'redux';
import { Icon } from 'app/UI';
import { Item } from 'app/Layout';
import { Collapsible } from 'app/App/Collapsible';
import * as actions from '../../Relationships/actions/actions';

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
  expanded: boolean
) => (
  <div className="sidepanel-relationship-right">
    {rightRelationships.map((relationship: any) => {
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
        >
          <>
            {entityRelationships.map((rel: any, indexI: number) => (
              <div className="sidepanel-relationship-right-entity" key={indexI}>
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

const createLabelGroups = (hub: any, relationTypes: any[], expanded: boolean) => {
  const template = hub.getIn(['leftRelationship', 'template']);
  return (
    <div key={hub.get('hub')} className="sidepanel-relationship">
      {template && (
        <span className="sidepanel-relationship-left-label">
          {`${relationTypes.find(r => r._id === template).name}(Label)`}
        </span>
      )}
      {createRightRelationshipGroups(hub.get('rightRelationships'), relationTypes, expanded)}
    </div>
  );
};

const LibraryViewRelationshipsComp = ({
  hubs,
  searchResults,
  parentEntity,
  parseResults,
  relationTypes,
  expanded,
}: ComponentProps) => {
  useEffect(() => {
    if (parentEntity) {
      parseResults(searchResults, parentEntity, false);
    }
  }, [searchResults, parentEntity]);
  return (
    <div className="sidepanel-relationships">
      {hubs.map((hub: any) => createLabelGroups(hub, relationTypes, expanded))}
    </div>
  );
};

LibraryViewRelationshipsComp.propTypes = {
  parentEntity: PropTypes.instanceOf(Map),
  hubs: PropTypes.instanceOf(List).isRequired,
  searchResults: PropTypes.instanceOf(Map).isRequired,
  parseResults: PropTypes.func.isRequired,
  relationTypes: PropTypes.instanceOf(Array).isRequired,
  expanded: PropTypes.bool,
};

const LibraryViewRelationships = connector(LibraryViewRelationshipsComp);

export { LibraryViewRelationshipsComp, LibraryViewRelationships };
