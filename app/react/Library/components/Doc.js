import React, { Component } from 'react';
import { is, Map } from 'immutable';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { NeedAuthorization } from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import { t } from 'app/I18N';
import UploadEntityStatus from 'app/Library/components/UploadEntityStatus';
import ViewDocButton from 'app/Library/components/ViewDocButton';
import { Icon } from 'UI';

import { Item } from 'app/Layout';
import helpers from 'app/Documents/helpers';

export class Doc extends Component {
  shouldComponentUpdate(nextProps) {
    return (
      !is(this.props.doc, nextProps.doc) ||
      !is(this.props.targetReference, nextProps.targetReference) ||
      this.props.additionalText !== nextProps.additionalText ||
      this.props.active !== nextProps.active ||
      (this.props.searchParams &&
        nextProps.searchParams &&
        this.props.searchParams.sort !== nextProps.searchParams.sort)
    );
  }

  onClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.doc, this.props.active);
    }
  }

  getConnections(connections) {
    return (
      <div>
        {connections.map((connection, index) => (
          <div key={index} className="item-connection">
            <div>
              <Icon icon="exchange-alt" />
              <span>
                {t(connection.context, connection.label)}
                {connection.type === 'metadata' ? ` ${t('System', 'in')}...` : ''}
              </span>
            </div>
            <NeedAuthorization roles={['admin', 'editor']}>
              <ShowIf if={connection.sourceType !== 'metadata'}>
                <button
                  className="btn btn-default btn-hover-danger btn-xs"
                  onClick={e => this.deleteConnection(e, connection)}
                  type="button"
                >
                  <Icon icon="trash-alt" />
                </button>
              </ShowIf>
            </NeedAuthorization>
          </div>
        ))}
      </div>
    );
  }

  deleteConnection(e, connection) {
    e.stopPropagation();
    const { _id, sourceType } = connection;
    this.props.deleteConnection({ _id, sourceType });
  }

  render() {
    const { className, additionalText, targetReference } = this.props;
    const doc = helpers.performantDocToJSWithoutRelations(this.props.doc);
    const { sharedId, file, processed } = doc;

    let itemConnections = null;
    if (doc.connections && doc.connections.length) {
      itemConnections = this.getConnections(doc.connections);
    }

    const buttons = (
      <div>
        <ViewDocButton
          file={file}
          sharedId={sharedId}
          processed={processed}
          storeKey={this.props.storeKey}
          targetReference={targetReference}
        />
      </div>
    );

    return (
      <Item
        onClick={this.onClick.bind(this)}
        onSnippetClick={this.props.onSnippetClick}
        active={this.props.active}
        doc={this.props.doc}
        additionalText={additionalText}
        searchParams={this.props.searchParams}
        deleteConnection={this.props.deleteConnection}
        itemHeader={itemConnections}
        buttons={buttons}
        labels={<UploadEntityStatus doc={this.props.doc} />}
        className={className}
      />
    );
  }
}

Doc.defaultProps = {
  targetReference: null,
};

Doc.propTypes = {
  doc: PropTypes.object,
  searchParams: PropTypes.object,
  active: PropTypes.bool,
  authorized: PropTypes.bool,
  deleteConnection: PropTypes.func,
  onSnippetClick: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
  additionalText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  storeKey: PropTypes.string,
  targetReference: PropTypes.instanceOf(Map),
};

export function mapStateToProps(state, ownProps) {
  const active = ownProps.storeKey
    ? !!state[ownProps.storeKey].ui
        .get('selectedDocuments')
        .find(doc => doc.get('_id') === ownProps.doc.get('_id'))
    : false;
  return {
    active,
  };
}

export default connect(mapStateToProps)(Doc);
