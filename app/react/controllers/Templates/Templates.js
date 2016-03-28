import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as templatesActions from './templatesActions';
import './scss/templates.scss';
import {Link} from 'react-router';

class Templates extends Component {

  constructor(props) {
    super(props);
    props.fetchTemplates();
  }

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
            {this.props.templates.map((template, index) => {
              return <div className="well" key={index}>{template.value.name}</div>;
            })}
          </div>
        </main>
      </div>
    );
  }
}

Templates.propTypes = {
  templates: PropTypes.array,
  fetchTemplates: PropTypes.func
};


function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

const mapStateToProps = (state) => {
  return {templates: state.templates};
};

export default connect(mapStateToProps, mapDispatchToProps)(Templates);
