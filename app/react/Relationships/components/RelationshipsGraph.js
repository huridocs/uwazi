// TEST!!!
import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Doc from 'app/Library/components/Doc';

import {fromJS} from 'immutable';

// import {switchView as switchViewAction} from '../actions/actions';

export class RelationshipsGraph extends Component {
  constructor(props) {
    super(props);
  }

  prepareData() {
    const {connections} = this.props;

    const relationships = connections.get('rows').reduce((results, _connection) => {
      const connection = _connection.toJS();
      const entityConnections = connection.connections;
      const entity = Object.assign({}, connection);
      delete entity.connections;

      entityConnections.forEach(relationship => {
        results.push(Object.assign({
          relationship
        }, entity));
      });

      return results;
    }, []);

    return relationships;
  }

  render() {
    const {search} = this.props;
    const relationships = this.prepareData();

    return (
      <div className="relationships-graph">
        <div className="group-wrapper">
          <div className="group group-collapse">
            <div className="group-row">

              <div className="source">
                <div>Item</div>
                <div className="item-connection">
                  <figure className="hub"></figure>
                  <div className="connection-data">
                    <p className="connection-type connection-type-0"><span>Relationships</span></p>
                  </div>
                </div>
              </div>

              <div className="target-connections">
                {relationships.map((entity, index) => {
                  return (
                    <div className="connection" key={index}>
                      <div className="connection-data ">
                        <p className="connection-type"><span>{entity.relationship.label}</span></p>
                      </div>
                      <Doc doc={fromJS(entity)} searchParams={search} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

RelationshipsGraph.propTypes = {
  connections: PropTypes.object,
  search: PropTypes.object
};

export function mapStateToProps({connectionsList}) {
  return {
    connections: connectionsList.searchResults,
    search: connectionsList.sort
  };
}

// function mapDispatchToProps(dispatch) {
//   return bindActionCreators({
//     switchView: switchViewAction
//   }, dispatch);
// }

export default connect(mapStateToProps)(RelationshipsGraph);
