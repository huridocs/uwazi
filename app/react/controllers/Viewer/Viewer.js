import React from 'react';
import API from '../../utils/singleton_api';
import RouteHandler from '../App/RouteHandler';
import './scss/viewer.scss';
import DocumentMetadata from '../../components/DocumentMetadata/DocumentMetadata.js';
import {events} from '../../utils/index';
import Loader from '../../components/Elements/Loader.js';

import Document from '../../components/Document/Document';

class Viewer extends RouteHandler {

  static requestState(params = {}, api) {
    let document;
    let references;

    return Promise.all([
      api.get('documents?_id=' + params.documentId),
      api.get('references?sourceDocument=' + params.documentId)
    ])
    .then((responses) => {
      document = responses[0].json.rows[0];
      references = responses[1].json.rows;
      return api.get('templates?key=' + document.value.template);
    })
    .then((response) => {
      return {value: document.value, references: references, template: response.json.rows[0]};
    });
  }

  static emptyState() {
    return {
      value: {pages: [], css: [], metadata: {}, file: {}},
      references: [],
      template: {value: {}},
      showmenu: false,
      showpanel: false,
      showReferenceLink: false,
      textSelectedTop: 0
    };
  }

  toggleMenu() {
    this.setState({showmenu: !this.state.showmenu});
  }

  togglePanel() {
    this.setState({showpanel: !this.state.showpanel});
  }

  closeMenu() {
    this.setState({showmenu: false});
  }

  toggleModal() {
    this.document.toggleModal();
  }

  saveReference(reference) {
    return API.post('references', reference)
    .then((response) => {
      reference._id = response.json.id;
      this.document.addReference({value: reference});
      this.document.closeModal();
      events.emit('alert', 'success', 'Reference created.');
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.documentId === this.props.params.documentId) {
      return false;
    }

    this.setState(Viewer.emptyState());
    return Viewer.requestState(nextProps.params, API)
    .then((state) => {
      this.setState(state);
    });
  }

  render() {
    return (
        <div className="row panels-layout viewer__pages">
          <main className={'col-xs-12 col-sm-8 panels-layout__panel no-padding ' + (this.state.showpanel ? '' : 'active')}>
              {(() => {
                if (!this.state.value.pages.length) {
                  return <Loader/>;
                }
              })()}
              <Document
                ref={(ref) => this.document = ref}
                onCreateReference={this.saveReference.bind(this)}
                document={this.state.value}
                references={this.state.references}
              />
          </main>
          <aside className={'col-xs-12 col-sm-4 panels-layout__panel no-padding ' + (this.state.showpanel ? 'active' : '')}>
            <div className="panel-content">
              <ul className="panel-tools">
                <li>
                  <a href="#" className=""><i className="fa fa-bookmark-o"></i></a>
                </li>
                <li>
                  <a href="#" className=""><i className="fa fa-search"></i></a>
                </li>
                <li>
                  <a href="#" className=""><i className="glyphicon glyphicon-text-size"></i></a>
                </li>
                <li>
                  <a href="#" className=""><i className="fa fa-cloud-download"></i></a>
                </li>
              </ul>
              <DocumentMetadata metadata={this.state.value.metadata} template={this.state.template}/>
            </div>
          </aside>
        </div>
    );
  }
}

export default Viewer;
