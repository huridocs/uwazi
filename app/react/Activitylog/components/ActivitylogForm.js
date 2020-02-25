import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { LocalForm, Control } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { Map } from 'immutable';
import { DateRange } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import * as actions from '../actions/activitylogActions';

class ActivitylogForm extends Component {
  constructor(props) {
    super(props);
    this.state = { query: {} };
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
    const { searchResults, searchMore } = this.props;

    if (searchResults.get('remainingRows')) {
      const { query } = this.state;
      const lastResultTime = searchResults.getIn(['rows', -1, 'time']);
      searchMore(Object.assign({}, query, { before: lastResultTime }));
    }
  }

  render() {
    const { children, searchResults } = this.props;

    return (
      <div>
        <div className="activity-log-form">
          <LocalForm onSubmit={this.handleSubmit}>
            <div className="form-group col-sm-12 col-md-6 col-lg-2">
              <label htmlFor="find">User</label>
              <Control.text className="form-control" model=".username" id="username" />
            </div>
            <div className="form-group col-sm-12 col-md-6 col-lg-4">
              <label htmlFor="find">Find</label>
              <Control.text
                className="form-control"
                model=".find"
                id="find"
                placeholder="by ids, methods, keywords, etc."
              />
            </div>
            <div className="form-group col-sm-12 col-lg-6">
              <label htmlFor="time">Time</label>
              <DateRange
                className="form-control"
                model=".time"
                id="time"
                format="YYYY-MM-DD"
                useTimezone
              />
            </div>
            <div className="form-group col-sm-12">
              <input type="submit" className="btn btn-success" value="Search" />
            </div>
          </LocalForm>
        </div>

        {children}

        <div className="text-center">
          <button
            type="button"
            className={`btn btn-default btn-load-more ${
              searchResults.get('remainingRows') ? '' : 'disabled'
            }`}
            onClick={() => {
              this.loadMore();
            }}
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
};

export const mapStateToProps = ({ activitylog }) => ({ searchResults: activitylog.search });

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { submit: actions.activitylogSearch, searchMore: actions.activitylogSearchMore },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(ActivitylogForm);
