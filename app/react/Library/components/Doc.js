import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import {t, I18NLink} from 'app/I18N';

import {Item} from 'app/Layout';
import {is} from 'immutable';

export class Doc extends Component {

  deleteConnection(e, connection) {
    e.stopPropagation();
    const {_id, sourceType} = connection;
    this.props.deleteConnection({_id, sourceType});
  }

  getConnections(connections) {
    return (
      <div>
        {connections.map((connection, index) =>
          <div key={index} className="item-connection">
            <div>
              <i className="fa fa-exchange"></i>
              <span>
                {t(connection.context, connection.label)}
                {connection.type === 'metadata' ? ' ' + t('System', 'in') + '...' : ''}
              </span>
            </div>
            <NeedAuthorization>
              <ShowIf if={connection.sourceType !== 'metadata'}>
                <button className="btn btn-transparent btn-danger btn-xs" onClick={e => this.deleteConnection(e, connection)}>
                  <i className="fa fa-trash"></i>
                </button>
              </ShowIf>
            </NeedAuthorization>
          </div>
        )}
      </div>
    );
  }

  shouldComponentUpdate(nextProps) {
    return !is(this.props.doc, nextProps.doc) ||
           this.props.active !== nextProps.active ||
           this.props.searchParams && nextProps.searchParams && this.props.searchParams.sort !== nextProps.searchParams.sort;
  }

  onClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.doc, this.props.active);
    }
  }

  render() {
    const doc = this.props.doc.toJS();
    const {sharedId, type} = doc;
    let documentViewUrl = `/${type}/${sharedId}`;

    let itemConnections = null;
    if (doc.connections && doc.connections.length) {
      itemConnections = this.getConnections(doc.connections);
    }

    const buttons = <I18NLink to={documentViewUrl} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
                      <span className="itemShortcut-arrow">
                        <i className="fa fa-file-text-o"></i>
                       </span>
                    </I18NLink>;

    return <Item onClick={this.onClick.bind(this)}
                 active={this.props.active}
                 doc={this.props.doc}
                 searchParams={this.props.searchParams}
                 deleteConnection={this.props.deleteConnection}
                 itemHeader={itemConnections}
                 buttons={buttons}/>;
  }
}

Doc.propTypes = {
  doc: PropTypes.object,
  searchParams: PropTypes.object,
  active: PropTypes.bool,
  authorized: PropTypes.bool,
  deleteConnection: PropTypes.func,
  onClick: PropTypes.func
};

export function mapStateToProps({library, user}, ownProps) {
  return {
    active: !!library.ui.get('selectedDocuments').find((doc) => doc.get('_id') === ownProps.doc.get('_id'))
  };
}

export default connect(mapStateToProps)(Doc);
