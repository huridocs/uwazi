import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import PropTypes from 'prop-types';
import { Map, List } from 'immutable';
import { bindActionCreators } from 'redux';
import { Icon } from 'app/UI';
import * as actions from '../../Relationships/actions/actions';
import HubRelationshipMetadata from '../../Relationships/components/HubRelationshipMetadata';

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

type ComponentProps = ConnectedProps<typeof connector>;

const createRightRelationshipGroups = (rightRelationships: any, relationTypes: any[]) => (
  <div className="list-group">
    {rightRelationships.map((relationship: any, index: number) => (
      <>
        <div className="list-group-item" key={index}>
          <span className="property-name">
            {' '}
            {(() => {
              const relationshipTemplateId = relationship.get('template');
              const relationType = relationTypes.find(r => r._id === relationshipTemplateId);
              if (relationType) {
                return relationshipTemplateId ? (
                  relationTypes.find(r => r._id === relationshipTemplateId).name
                ) : (
                  <Icon icon="link" />
                );
              }
              return null;
            })()}
          </span>
        </div>
        {(() => {
          return relationship.get('relationships').map((rel: any, indexI: number) => (
            <div className="list-group-item" key={indexI}>
              <div className={`item-document item-${rel.getIn(['entityData', '_id'])}`}>
                <div className="item-info">
                  <div className="item-name">
                    <span>{rel.getIn(['entityData', 'title'])}</span>
                  </div>
                </div>
                <HubRelationshipMetadata relationship={rel} />
              </div>
            </div>
          ));
        })()}
      </>
    ))}
  </div>
);

const createLabelGroups = (hub: any, relationTypes: any[]) => {
  const template = hub.getIn(['leftRelationship', 'template']);
  return (
    <div key={hub.get('hub')} className="list-group-item">
      <span className="property-name">
        {template && <div>{relationTypes.find(r => r._id === template).name}</div>}
      </span>
      {createRightRelationshipGroups(hub.get('rightRelationships'), relationTypes)}
    </div>
  );
};

const LibraryViewRelationshipsComp = ({
  hubs,
  searchResults,
  parentEntity,
  parseResults,
  relationTypes,
}: ComponentProps) => {
  useEffect(() => {
    if (parentEntity) {
      parseResults(searchResults, parentEntity, false);
    }
  }, [searchResults, parentEntity]);
  return (
    <div className="list-group">
      {hubs.map((hub: any) => createLabelGroups(hub, relationTypes))}
    </div>
  );
};

LibraryViewRelationshipsComp.propTypes = {
  parentEntity: PropTypes.instanceOf(Map),
  hubs: PropTypes.instanceOf(List).isRequired,
  searchResults: PropTypes.instanceOf(Map).isRequired,
  parseResults: PropTypes.func.isRequired,
  relationTypes: PropTypes.instanceOf(Array).isRequired,
};

const LibraryViewRelationships = connector(LibraryViewRelationshipsComp);

export { LibraryViewRelationshipsComp, LibraryViewRelationships };
