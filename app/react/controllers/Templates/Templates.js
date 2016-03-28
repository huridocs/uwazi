import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import './scss/templates.scss';
import {Link} from 'react-router';

class Templates extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  static emptyState() {
    return {};
  }

  render() {
    return (
      <div className="row">
        <main className="col-sm-12">
          <div className="well template">
            <h1>Templates list</h1>
            <Link to="/templates/new" className="btn btn-success">Create template</Link>
          </div>
        </main>
      </div>
    );
  }
}

Templates.propTypes = {
  templates: PropTypes.array
};


const mapStateToProps = (state) => {
  return {templates: state.templates.toJS()};
};

export default connect(mapStateToProps)(Templates);
