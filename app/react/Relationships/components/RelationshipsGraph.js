import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Sticky from 'react-sticky-el';
import Doc from 'app/Library/components/Doc';
import Item from 'app/Layout/Item';
import {t} from 'app/I18N';

import {fromJS} from 'immutable';

// -------------------
import DropdownList from 'app/Forms/components/DropdownList';
import RelationshipsGraphEdit from './RelationshipsGraphEdit';
// -------------------

export class RelationshipsGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {collapsed: true};
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
  }

  getRelationshipPosition(type) {
    const posIndex = this.props.relationTypes.findIndex(r => r.get('_id') === type);
    const numberOfConnectionColors = 19;
    return posIndex % (numberOfConnectionColors - 1);
  }

  getAmountOfTypes(connections) {
    let previousConnectionType = '';
    return connections.get('rows').reduce((_amount, _connection) => {
      return _connection.get('connections').reduce((_innerAmount, relationship) => {
        const newType = previousConnectionType !== relationship.get('context');
        previousConnectionType = relationship.get('context');
        return newType ? _innerAmount + 1 : _innerAmount;
      }, _amount);
    }, 0);
  }

  prepareData() {
    const {connections} = this.props;

    const getAmountOfTypes = this.getAmountOfTypes(connections);

    let previousConnectionType = '';
    let currentType = 0;

    const relationships = connections.get('rows').reduce((results, _connection) => {
      const connection = _connection.toJS();
      const entityConnections = connection.connections;
      const entity = Object.assign({}, connection);
      delete entity.connections;

      entityConnections.forEach(relationship => {
        const asPrevious = previousConnectionType === relationship.context;
        if (!asPrevious) {
          currentType += 1;
        }

        results.push(Object.assign({
          relationship: Object.assign(relationship, {typePostition: this.getRelationshipPosition(relationship.context)}),
          lastOfType: currentType === getAmountOfTypes,
          asPrevious
        }, entity));
        previousConnectionType = relationship.context;
      });

      return results;
    }, []);

    return relationships;
  }

  toggleCollapsed() {
    this.setState({collapsed: !this.state.collapsed});
  }

  render() {
    // TEMP
    const a = 1;
    if (a === 1) {
      return <RelationshipsGraphEdit />;
    }

    const {collapsed} = this.state;
    const {parentEntity, search} = this.props;
    const relationships = this.prepareData();

    let itemConnection = null;

    if (relationships.length) {
      itemConnection = <div className="item-connection">
        <figure className="hub"></figure>
        <div className="connection-data">
          <p className="connection-type connection-type-18">{t('System', 'Relationships')}</p>
        </div>
      </div>;
    }

    // TEST!!!
    // newSimpleRelationship
    const relationshipTypes = [
      {_id: null, label: 'Simple relationship'},
      {_id: 'abc123', label: 'New relationship type'}
    ];

    const newSimpleRelationship = <div className="group-row">

                    <Sticky scrollElement=".entity-viewer" boundaryElement=".group-row" hideOnBoundaryHit={false}>
                      <div className="source">
                        <div className="item-connection">
                          <figure className="hub"></figure>
                          <div className="connection-data">
                            <DropdownList valueField="_id"
                                          textField="label"
                                          data={relationshipTypes}
                                          defaultValue={relationshipTypes[0]}
                                          filter="contains" />
                          </div>
                        </div>
                      </div>
                    </Sticky>

                    <div className="target-connections">
                      <div className={`connection last-of-type`}>
                        <div className="item-document connection-data item item-status item-default">
                          <DropdownList valueField="_id"
                                        textField="label"
                                        data={relationshipTypes}
                                        defaultValue={relationshipTypes[1]}
                                        filter="contains" />
                        </div>
                      </div>
                    </div>
                   </div>;
    // New Hub
    const newHub = <div className="group-row">

                    <Sticky scrollElement=".entity-viewer" boundaryElement=".group-row" hideOnBoundaryHit={false}>
                      <div className="source">
                        <div className="item-connection">
                          <figure className="hub"></figure>
                          <div className="connection-data">
                            <p className="connection-type connection-type-18">New relationships group</p>
                          </div>
                        </div>
                      </div>
                    </Sticky>

                    <div className="target-connections">
                      <div className={`connection last-of-type`}>
                      </div>
                    </div>
                   </div>;
    // -------

    return (
      <div className="relationships-graph">
        <div className="expand-section">
          <button onClick={this.toggleCollapsed} className="btn btn-default">
            <i className={`fa fa-${collapsed ? 'expand' : 'compress'}`}></i>
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        <div className="group-wrapper">
          <div className={`group ${collapsed ? 'group-collapse' : ''}`}>
            <div className="group-row">

              <Sticky scrollElement=".entity-viewer" boundaryElement=".group-row" hideOnBoundaryHit={false}>
                <div className="source">
                  <Doc doc={parentEntity} searchParams={search} />
                  {itemConnection}
                </div>
              </Sticky>

              <div className="target-connections">
                {relationships.map((entity, index) => {
                  return (
                    <div className={`connection${entity.asPrevious ? ' as-previous' : ''}${entity.lastOfType ? ' last-of-type' : ''}`}
                      key={index}>
                      <Item
                        className='connection-data'
                        doc={fromJS(entity.relationship)}
                        templates={this.props.relationTypes}
                        titleProperty={'label'}
                      />
                      <Doc doc={fromJS(entity)} searchParams={search} />
                    </div>
                  );
                })}
              </div>
            </div>
            {newSimpleRelationship}
            {newHub}
          </div>
        </div>
      </div>
    );
  }
}

RelationshipsGraph.propTypes = {
  parentEntity: PropTypes.object,
  connections: PropTypes.object,
  search: PropTypes.object,
  relationTypes: PropTypes.object
};

export function mapStateToProps({entityView, connectionsList, relationTypes}) {
  return {
    parentEntity: entityView.entity,
    connections: connectionsList.searchResults,
    search: connectionsList.sort,
    relationTypes
  };
}

export default connect(mapStateToProps)(RelationshipsGraph);
