import React from 'react';
import API from '../../utils/singleton_api';
import RouteHandler from '../App/RouteHandler';
import Helmet from 'react-helmet';
import {events} from '../../utils/index';
import '../App/scss/elements/_item.scss';

import SearchBar from '../../components/Elements/SearchBar.js';
import {Link} from 'react-router';

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

  static renderTools() {
    return <SearchBar/>;
  }

  componentDidMount() {
    events.on('search', this.search.bind(this));
  }

  componentWillUnmount() {
    events.off('search', this.search.bind(this));
  }

  search(searchTerm) {
    return API.get('documents/search?searchTerm=' + searchTerm)
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

  renderDocument(doc, index) {
    let documentViewUrl = '/document/' + doc._id;
    return (
      <li key={index} className="col-sm-4">
              <div className="item item1">
                <i className="fa fa-expand"></i>
                <i className="fa fa-close"></i><Link to={documentViewUrl} className="item-name">{doc.title}</Link>
                <div className="item-metadata"><span className="label label-default">
                <i className="fa fa-calendar"></i>March 14</span><span className="label label-default">
                <i className="fa fa-tag"></i>Decision</span>
                </div>
                <div className="item-snippets"><span> <i className="fa fa-search"></i> 3 matches</span>
                  <p>
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae <b>africa</b>
                    aut velit autem pariatur commodi. Voluptates perspiciatis nihil <b>africa</b>
                    consequuntur fugit eum recusandae dolor, aliquid tempora sint aliquam <b>africa</b>."
                  </p>
                </div>
                <div className="item-preview">
                  <div className="row">
                    <div className="col-sm-4">
                      <h4>Metadata 1</h4>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                    </div>
                    <div className="col-sm-4">
                      <h4>Metadata 2</h4>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                    </div>
                    <div className="col-sm-4">
                      <h4>Metadata 3</h4>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                      <p>Text</p>
                    </div>
                    <div className="col-sm-6">
                      <div className="btn btn-default btn-close"><i className="fa fa-close"></i>Close preview</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="btn btn-success btn-open">View document<i className="fa fa-arrow-right"></i></div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
    );
  }

  render() {
    let documents = this.state[this.state.show] || [];
    return (
      <div>
        <Helmet title='Library' />
        <div className="row panels-layout">
          <main className="col-xs-12 col-sm-9 panels-layout__panel active">
            <div className="panel-content">
                <div className="row">
                  <p id="documents-counter" className="col-sm-5">1-12 of 39 documents</p>
                  <p className="col-sm-7 sort-by">
                    Sort by
                    <span className="filter active">A-Z<i className="fa fa-caret-down"></i></span>
                    <span className="filter">Upload date</span>
                    <span className="filter">Relevance</span>
                  </p>
                </div>
              <div className="item-group row">
                  {documents.map(this.renderDocument)}
              </div>
            </div>
          </main>
          <aside className="col-xs-12 col-sm-3 panels-layout__panel">
            <div className="panel-content">
              <div className="search">
                <div className="search__button--apply__filters">
                  <a className="btn btn-success btn-block"><i className="fa fa-chevron-left"></i>Apply filters</a>
                </div>
                <ul className="search__filter search__filter--radiobutton">
                  <li>Document type (Radio button)</li>
                  <li className="is-active"><i className="fa fa-check"></i>
                    <label>All documents</label>
                  </li>
                  <li> <i className="fa"></i>
                    <label>Decisions</label>
                  </li>
                  <li> <i className="fa"></i>
                    <label>Rulings</label>
                  </li>
                  <li> <i className="fa"></i>
                    <label>Judgements</label>
                  </li>
                </ul>
                <ul className="search__filter search__filter--short__text">
                  <li>Document title (Short text)</li>
                  <li className="wide">
                    <div className="input-group">
                      <input type="text" placeholder="Document title" className="form-control"/>
                      <span className="input-group-addon"><i className="fa fa-search"></i></span>
                    </div>
                  </li>
                </ul>
                <ul className="search__filter search__filter--multiple__selection">
                  <li>Multiple selection (Check box)</li>
                  <li className="is-active"><i className="fa fa-check"></i>
                    <label>Option 1</label>
                  </li>
                  <li> <i className="fa"></i>
                    <label>Option 2</label>
                  </li>
                  <li> <i className="fa"></i>
                    <label>Option 3</label>
                  </li>
                  <li> <i className="fa"></i>
                    <label>Option 4</label>
                  </li>
                </ul>
                <ul className="search__filter search__filter--single__selection">
                  <li>YES/NO (Single selection)</li>
                  <li className="wide"><i className="fa"></i>
                    <label>Search only awesome documents</label>
                  </li>
                </ul>
                <ul className="search__filter search__filter--list">
                  <li>Country (Long list)</li>
                  <li className="wide">
                    <div className="input-group">
                      <input type="text" placeholder="Search country" className="form-control"/>
                      <span className="input-group-addon"><i className="fa fa-search"></i></span>
                    </div>
                    <ol>
                      <li><i className="fa"></i>Argentina</li>
                      <li><i className="fa"></i>Australia</li>
                      <li><i className="fa"></i>Austria</li>
                      <li><i className="fa"></i>Belgium</li>
                      <li><i className="fa"></i>Brazil</li>
                      <li><i className="fa"></i>Bulgaria</li>
                      <li><i className="fa"></i>Canada</li>
                      <li><i className="fa"></i>China</li>
                      <li><i className="fa"></i>Colombia</li>
                      <li><i className="fa"></i>Costa Rica</li>
                      <li><i className="fa"></i>Czech Republic</li>
                      <li><i className="fa"></i>Denmark</li>
                      <li><i className="fa"></i>Finland</li>
                      <li><i className="fa"></i>France</li>
                      <li><i className="fa"></i>Germany</li>
                      <li><i className="fa"></i>Greece</li>
                      <li><i className="fa"></i>Hong Kong</li>
                      <li><i className="fa"></i>Hungary</li>
                      <li><i className="fa"></i>Iceland</li>
                      <li><i className="fa"></i>India</li>
                      <li><i className="fa"></i>Iran</li>
                      <li><i className="fa"></i>Ireland</li>
                      <li><i className="fa"></i>Italy</li>
                      <li><i className="fa"></i>Japan</li>
                      <li><i className="fa"></i>Malaysia</li>
                      <li><i className="fa"></i>Mexico</li>
                      <li><i className="fa"></i>Netherlands</li>
                      <li><i className="fa"></i>New Zealand</li>
                      <li><i className="fa"></i>Pakistan</li>
                      <li><i className="fa"></i>Poland</li>
                      <li><i className="fa"></i>Portugal</li>
                      <li><i className="fa"></i>Romania</li>
                      <li><i className="fa"></i>Russia</li>
                      <li><i className="fa"></i>Singapore</li>
                      <li><i className="fa"></i>South Africa</li>
                      <li><i className="fa"></i>Spain</li>
                      <li><i className="fa"></i>Sweden</li>
                      <li><i className="fa"></i>Switzerland</li>
                      <li><i className="fa"></i>Thailand</li>
                      <li><i className="fa"></i>United Kingdom</li>
                      <li><i className="fa"></i>United States</li>
                    </ol>
                  </li>
                </ul>
                <ul className="search__filter search__filter--date">
                  <li>Date</li>
                  <li className="wide"><i className="fa fa-calendar"></i>
                    <input type="text" placeholder="From"/>
                    <input type="text" placeholder="To"/>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

}


export default Library;
