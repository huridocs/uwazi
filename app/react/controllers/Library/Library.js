import React from 'react';
import API from '../../utils/singleton_api';
import RouteHandler from '../App/RouteHandler';
import Helmet from 'react-helmet';
import {Link} from 'react-router';
import './scss/library.scss';

class Library extends RouteHandler {

  static emptyState() {
    return {newest: [], relevant: [], templates: [], searchResult: [], show: 'newest'};
  }

  static requestState(params = {}, api) {
    return Promise.all([
      api.get('documents/newest'),
      api.get('documents/relevant'),
      api.get('templates')
    ])
    .then((responses) => {
      let newest = responses[0].json.rows;
      let relevant = responses[1].json.rows;
      let templates = responses[2].json.rows;
      return {newest: newest, relevant: relevant, templates: templates};
    });
  }

  search(e) {
    e.preventDefault();

    return API.get('documents/search?searchTerm=' + this.searchField.value)
    .then((response) => {
      this.setState({searchResult: response.json});
      this.showSearchResult();
    });
  }

  showRelevant() {
    this.setState({show: 'relevant'});
  }

  showNewest() {
    this.setState({show: 'newest'});
  }

  showSearchResult() {
    this.setState({show: 'searchResult'});
  }

  render() {
    let documents = this.state[this.state.show] || [];
    return (
      <div>
        <Helmet title='Library' />
        <div className="row panels-layout">
          <div className="col-xs-12 col-sm-7 col-md-8 panels-layout__panel no-padding active">
            <div className="search-form">
              <h1>Search for documents</h1>
              <form className="form-inline" onSubmit={this.search.bind(this)}>
                <div className="form-group">
                  <input className="form-control" placeholder="Search" ref={(ref) => this.searchField = ref}/>
                  &nbsp;
                  <button className="btn btn-primary" type='submit'><i className="fa fa-search"></i> Search</button>
                </div>
              </form>
            </div>
            <div className="panel-content">
              <a href="#" onClick={this.showNewest.bind(this)}
                 className={'tab-button green' + (this.state.show === 'newest' ? ' active' : '')} >
                Recent Documments
              </a>
              <a href="#" onClick={this.showRelevant.bind(this)}
                 className={'tab-button pink' + (this.state.show === 'relevant' ? ' active' : '')} >
                Relevant Documments
              </a>
              <a href="#" onClick={this.showSearchResult.bind(this)}
                 className={'tab-button blue' + (this.state.show === 'searchResult' ? ' active' : '')} >
                Search ({this.state.searchResult.length})
              </a>
              <table className="table table-hover documents">
                <tbody>
                  {documents.map((doc, index) => {
                    let documentViewUrl = '/document/' + doc._id;
                    return <tr key={index}>
                            <td className="document-tittle">{doc.title}</td>
                            <td className="view">
                              <Link to={documentViewUrl}><i className="fa fa-external-link"></i>
                                View
                              </Link>
                            </td>
                           </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-xs-12 col-sm-5 col-md-4 panels-layout__panel">
            <h4 className="text-center">Document metadata</h4>
          </div>
        </div>
      </div>
    );
  }

}

export default Library;
