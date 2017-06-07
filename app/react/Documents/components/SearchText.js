import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {t} from 'app/I18N';
import {Field, LocalForm} from 'react-redux-form';

export class SearchText extends Component {
  search() {}
  resetSearch() {}

  render() {
    const {snippets} = this.props;
    return (
      <div>
        <div className={'search-box'}>
          <LocalForm model={'searchText'} onSubmit={this.search.bind(this)} autoComplete="off">
            <div className={'input-group'}>
              <Field model={'.searchTerm'}>
                <i className="fa fa-search"></i>
                <input
                  type="text"
                  placeholder={t('System', 'Search')}
                  className="form-control"
                  autoComplete="off"
                />
                <i className="fa fa-close" onClick={this.resetSearch.bind(this)}></i>
              </Field>
            </div>
          </LocalForm>
        </div>

        <ul>
          {snippets.map((snippet, index) => {
            return <li key={index} dangerouslySetInnerHTML={{__html: snippet}}></li>;
          })}
        </ul>
      </div>
    );
  }
}

SearchText.propTypes = {
  snippets: PropTypes.object
};

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchText);
