/* TEST!!! Entire component */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import Doc from 'app/Library/components/Doc';

import DropdownList from 'app/Forms/components/DropdownList';

export class RelationshipsGraphEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hubs: [],
      relationshipTypes: [{_id: null, name: 'Simple relationship'}].concat(props.relationTypes.toJS())
    };

    this.addHub = this.addHub.bind(this);
    this.updateLeftRelationshipType = this.updateLeftRelationshipType.bind(this);
    this.removeHub = this.removeHub.bind(this);
    this.removeRightRelationshipGroup = this.removeRightRelationshipGroup.bind(this);
  }

  componentWillMount() {
    if (!this.state.hubs.length) {
      this.addHub();
    }
  }

  addHub() {
    this.setState({hubs: this.state.hubs.concat([{
      leftRelationship: {_id: this.state.relationshipTypes[0]._id},
      rightRelationships: this.addRightRelationship([])
    }])});
  }

  addRightRelationship(rightRelationships) {
    return [].concat(rightRelationships.concat([{entities: []}]));
  }

  updateLeftRelationshipType(hub) {
    return (value) => {
      this.setState({hubs: this.state.hubs.map(h => {
        if (h === hub) {
          return Object.assign({}, h, {leftRelationship: {_id: value._id}});
        }
        return h;
      })});
    };
  }

  addRightRelationshipType(hub) {
    return (value) => {
      this.setState({hubs: this.state.hubs.map(h => {
        if (h === hub) {
          return Object.assign({}, h, {rightRelationships: h.rightRelationships.concat({_id: value._id, entities: []})});
        }
        return h;
      })});
    };
  }

  updateRightRelationshipType(hub, rightRelationship) {
    return (value) => {
      this.setState({hubs: this.state.hubs.map(h => {
        if (h === hub) {
          let rightRelationships = [].concat(h.rightRelationships);
          if (typeof rightRelationship._id === 'undefined') {
            rightRelationships = this.addRightRelationship(rightRelationships);
          }

          return Object.assign({}, h, {rightRelationships: rightRelationships.map(r => {
            if (r === rightRelationship) {
              return Object.assign({}, r, {_id: value._id});
            }
            return r;
          })});
        }
        return h;
      })});
    };
  }

  removeHub(hub) {
    return () => {
      this.setState({hubs: this.state.hubs.filter(h => h !== hub)});
    };
  }

  removeRightRelationshipGroup(hub, rightRelationship) {
    return () => {
      this.setState({hubs: this.state.hubs.map(h => {
        if (h === hub) {
          const rightRelationships = h.rightRelationships.filter(r => r !== rightRelationship);
          return Object.assign({}, h, {rightRelationships});
        }

        return h;
      })});
    };
  }

  render() {
    const {parentEntity, search} = this.props;

    return (
      <div className="relationships-graph">

        <div style={{width: '50%', marginBottom: '15px'}}>
          <Doc doc={parentEntity} searchParams={search} />
        </div>

        <div>

          {this.state.hubs.map((hub, index) =>
            <div className="relationshipsHub" key={index}>
              <div className="removeHub" style={{width: '4%', float: 'left'}}>
                <i onClick={this.removeHub(hub)} className="fa fa-times-circle-o" style={{fontSize: '20px', cursor: 'pointer'}}></i>
              </div>
              <div className="leftRelationshipType" style={{width: '46%', float: 'left'}}>
                <DropdownList valueField="_id"
                              textField="name"
                              data={this.state.relationshipTypes}
                              value={hub.leftRelationship._id}
                              filter="contains"
                              onChange={this.updateLeftRelationshipType(hub)} />
              </div>
              <div className="rightRelationships" style={{width: '50%', float: 'left'}}>
                {hub.rightRelationships.map((rightRelationship, typeIndex) =>
                  <div className="rightRelationshipsTypeGroup" key={typeIndex}>
                    <div className="rightRelationshipType" style={{width: '92%', float: 'left'}}>
                      <DropdownList valueField="_id"
                                    textField="name"
                                    data={this.state.relationshipTypes}
                                    value={rightRelationship._id}
                                    placeholder="New connection type"
                                    filter="contains"
                                    onChange={this.updateRightRelationshipType(hub, rightRelationship)}/>
                    </div>
                    <div className="removeRightRelationshipGroup text-right" style={{width: '8%', float: 'left'}}>
                      {(() => {
                        if (typeof rightRelationship._id !== 'undefined') {
                          return <i onClick={this.removeRightRelationshipGroup(hub, rightRelationship)}
                                    className="fa fa-times-circle-o" style={{fontSize: '20px', cursor: 'pointer'}}></i>;
                        }

                        return <span>&nbsp;</span>;
                      })()}
                    </div>
                    {rightRelationship.entities.map((entity, entityIndex) =>
                      <div className="rightRelationshipType" style={{width: '92%', float: 'left'}} key={entityIndex}>
                        <Doc doc={parentEntity} searchParams={search} />
                      </div>
                    )}
                    {(() => {
                      if (typeof rightRelationship._id !== 'undefined') {
                        return <div className="rightRelationshipAdd" style={{width: '92%', float: 'left'}}>
                                <button className="btn btn-success" style={{width: '100%'}}>Add entities / documents</button>
                               </div>;
                      }

                      return null;
                    })()}
                    <div style={{float: 'none', clear: 'both', height: '5px'}}></div>
                  </div>
                )}

                <div style={{float: 'none', clear: 'both', height: '1px'}}></div>
              </div>

              <div style={{float: 'none', clear: 'both', height: '1px'}}></div>
            </div>
          )}

          <div>
            <div className="removeHub" style={{width: '4%', float: 'left'}}>&nbsp;</div>
            <div className="leftRelationshipType" style={{width: '48%', float: 'left'}}>
              <button className="btn btn-success" onClick={this.addHub}>New relationships group&nbsp;&nbsp;+</button>
            </div>
            <div style={{float: 'none', clear: 'both', height: '1px'}}></div>
          </div>

          <div style={{float: 'none', clear: 'both', height: '15px'}}></div>

        </div>

      </div>
    );
  }
}

RelationshipsGraphEdit.propTypes = {
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

export default connect(mapStateToProps)(RelationshipsGraphEdit);
