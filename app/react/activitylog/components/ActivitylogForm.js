import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { LocalForm, Control } from 'react-redux-form';
import { activitylogSearch } from 'app/activitylog/actions/activitylogActions';
import { bindActionCreators } from 'redux';
import { MultiSelect, DateRange } from 'app/ReactReduxForms';

class ActivitylogForm extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.methodOptions = [
      { label: 'POST', value: 'POST' },
      { label: 'GET', value: 'GET' },
      { label: 'PUT', value: 'PUT' },
      { label: 'DELETE', value: 'DELETE' },
    ];
  }

  handleSubmit(values) {
    const { submit } = this.props;
    const query = Object.keys(values).reduce((_query, key) => {
      if (values[key]) {
        return Object.assign(_query, { [key]: values[key] });
      }
      return _query;
    }, {});
    submit(query);
  }

  render() {
    return (
      <div className="activity-log-form">
        <LocalForm onSubmit={this.handleSubmit} >
          <div className="form-group col-lg-4">
            <label htmlFor="limit">Limit</label>
            <Control.text className="form-control" model=".limit" id="limit" />
          </div>
          <div className="form-group col-lg-4">
            <label htmlFor="url">Url</label>
            <Control.text className="form-control" model=".url" id="url" />
          </div>
          <div className="form-group col-lg-4">
            <label htmlFor="url">User</label>
            <Control.text className="form-control" model=".username" id="username" />
          </div>
          <div className="form-group col-lg-4">
            <label htmlFor="method">Method</label>
            <MultiSelect model=".method" options={this.methodOptions} />
          </div>
          <div className="form-group col-lg-4">
            <label htmlFor="time">Time</label>
            <DateRange className="form-control" model=".time" id="time" showTimeSelect format="dd/MM/yyyy HH:mm"/>
          </div>
          <div className="col-lg-4">
            <div className="form-group">
              <label htmlFor="url">Query</label>
              <Control.text className="form-control" model=".query" id="query" />
            </div>
            <div className="form-group">
              <label htmlFor="url">Body</label>
              <Control.text className="form-control" model=".body" id="body" />
            </div>
          </div>
          <div className="col-lg-12"><input type="submit" className="btn btn-success" value="Search"/></div>
        </LocalForm>
      </div>
    );
  }
}

ActivitylogForm.propTypes = {
  submit: PropTypes.func.isRequired
};

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: activitylogSearch }, dispatch);
}

export default connect(null, mapDispatchToProps)(ActivitylogForm);
