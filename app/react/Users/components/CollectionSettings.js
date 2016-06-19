import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

export class CollectionSettings extends Component {
  render() {
    return <div className="panel panel-default">
            <div className="panel-heading">Collection settings</div>
            <div className="panel-body">
              <form>
                <div className="form-group">
                  <label htmlFor="collection_name">Name</label>
                  <input type="text" className="form-control"/>
                </div>
                <button type="submit" className="btn btn-success">Update</button>
              </form>
            </div>
          </div>;
  }
}

CollectionSettings.propTypes = {
};


export default connect()(CollectionSettings);
