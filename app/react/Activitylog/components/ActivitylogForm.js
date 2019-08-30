import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { LocalForm, Control } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { Map } from 'immutable';
import { MultiSelect, DateRange } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import * as actions from '../actions/activitylogActions';

class ActivitylogForm extends Component {
  constructor(props) {
    super(props);
    this.state = { query: {}, noMore: false };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.loadMore = this.loadMore.bind(this);
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

    this.setState({ query });
    submit(query);
  }

  loadMore() {
    const { searchResults, searchMore, moreResultsAvailable } = this.props;
    const { query } = this.state;

    if (moreResultsAvailable) {
      searchMore(Object.assign({}, query, { page: searchResults.get('page') + 1 }));
    }
  }

  render() {
    const { children, moreResultsAvailable } = this.props;

    return (
      <div>
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

        {children}

        <div className="text-center">
          <button
            type="button"
            className={`btn btn-default btn-load-more ${moreResultsAvailable ? '' : 'disabled'}`}
            onClick={() => { this.loadMore(); }}
          >
            {t('System', 'x more')}
          </button>
        </div>
      </div>
    );
  }
}

ActivitylogForm.defaultProps = {
  children: null,
};

ActivitylogForm.propTypes = {
  children: PropTypes.node,
  submit: PropTypes.func.isRequired,
  searchMore: PropTypes.func.isRequired,
  searchResults: PropTypes.instanceOf(Map).isRequired,
  moreResultsAvailable: PropTypes.bool.isRequired,
};

export function mapStateToProps({ activitylog }) {
  const searchResults = activitylog.search;
  const moreResultsAvailable = searchResults.size && (searchResults.get('page') * searchResults.get('pageSize')) < searchResults.get('totalRows');
  return { searchResults, moreResultsAvailable };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: actions.activitylogSearch, searchMore: actions.activitylogSearchMore }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ActivitylogForm);
