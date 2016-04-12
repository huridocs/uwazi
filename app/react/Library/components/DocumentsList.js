import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import 'app/Library/scss/DocumentsList.scss';

export class DocumentsList extends Component {

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
    let documents = this.props.documents;
    return (
      <div className="row panels-layout">
        <main className="col-xs-12 col-sm-9">
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
        </main>
        <aside className="col-xs-12 col-sm-3">
          <div className="search">
            <div className="search__button--apply__filters">
              <a className="btn btn-success btn-block">Apply filters<i className="fa fa-chevron-left"></i></a>
            </div>
            <ul className="search__filter search__filter--radiobutton">
              <li>Document type (Radio button)</li>
              <li className="is-active">
                <input type="radio"/>
                <label>All documents</label>
              </li>
              <li>
                <input type="radio"/>
                <label>Decisions</label>
              </li>
              <li>
                <input type="radio"/>
                <label>Rulings</label>
              </li>
              <li>
                <input type="radio"/>
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
              <li className="is-active">
                <input type="checkbox"/>
                <label>Option 1</label>
              </li>
              <li>
                <input type="checkbox"/>
                <label>Option 2</label>
              </li>
              <li>
                <input type="checkbox"/>
                <label>Option 3</label>
              </li>
              <li>
                <input type="checkbox"/>
                <label>Option 4</label>
              </li>
            </ul>
            <ul className="search__filter search__filter--single__selection">
              <li>YES/NO (Single selection)</li>
              <li className="wide">
                <input type="checkbox"/>
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
                  <li>
                    <input type="checkbox"/>Argentina
                  </li>
                  <li>
                    <input type="checkbox"/>Australia
                  </li>
                  <li>
                    <input type="checkbox"/>Austria
                  </li>
                  <li>
                    <input type="checkbox"/>Belgium
                  </li>
                  <li>
                    <input type="checkbox"/>Brazil
                  </li>
                  <li>
                    <input type="checkbox"/>Bulgaria
                  </li>
                  <li>
                    <input type="checkbox"/>Canada
                  </li>
                  <li>
                    <input type="checkbox"/>China
                  </li>
                  <li>
                    <input type="checkbox"/>Colombia
                  </li>
                  <li>
                    <input type="checkbox"/>Costa Rica
                  </li>
                  <li>
                    <input type="checkbox"/>Czech Republic
                  </li>
                  <li>
                    <input type="checkbox"/>Denmark
                  </li>
                  <li>
                    <input type="checkbox"/>Finland
                  </li>
                  <li>
                    <input type="checkbox"/>France
                  </li>
                  <li>
                    <input type="checkbox"/>Germany
                  </li>
                  <li>
                    <input type="checkbox"/>Greece
                  </li>
                  <li>
                    <input type="checkbox"/>Hong Kong
                  </li>
                  <li>
                    <input type="checkbox"/>Hungary
                  </li>
                  <li>
                    <input type="checkbox"/>Iceland
                  </li>
                  <li>
                    <input type="checkbox"/>India
                  </li>
                  <li>
                    <input type="checkbox"/>Iran
                  </li>
                  <li>
                    <input type="checkbox"/>Ireland
                  </li>
                  <li>
                    <input type="checkbox"/>Italy
                  </li>
                  <li>
                    <input type="checkbox"/>Japan
                  </li>
                  <li>
                    <input type="checkbox"/>Malaysia
                  </li>
                  <li>
                    <input type="checkbox"/>Mexico
                  </li>
                  <li>
                    <input type="checkbox"/>Netherlands
                  </li>
                  <li>
                    <input type="checkbox"/>New Zealand
                  </li>
                  <li>
                    <input type="checkbox"/>Pakistan
                  </li>
                  <li>
                    <input type="checkbox"/>Poland
                  </li>
                  <li>
                    <input type="checkbox"/>Portugal
                  </li>
                  <li>
                    <input type="checkbox"/>Romania
                  </li>
                  <li>
                    <input type="checkbox"/>Russia
                  </li>
                  <li>
                    <input type="checkbox"/>Singapore
                  </li>
                  <li>
                    <input type="checkbox"/>South Africa
                  </li>
                  <li>
                    <input type="checkbox"/>Spain
                  </li>
                  <li>
                    <input type="checkbox"/>Sweden
                  </li>
                  <li>
                    <input type="checkbox"/>Switzerland
                  </li>
                  <li>
                    <input type="checkbox"/>Thailand
                  </li>
                  <li>
                    <input type="checkbox"/>United Kingdom
                  </li>
                  <li>
                    <input type="checkbox"/>United States
                  </li>
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
        </aside>
      </div>
    );
  }
}

DocumentsList.propTypes = {
  documents: PropTypes.array.isRequired
};

export function mapStateToProps(state) {
  return {
    documents: state.library.documents.toJS()
  };
}

export default connect(mapStateToProps)(DocumentsList);
