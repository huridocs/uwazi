import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import {TemplateLabel, Icon} from 'app/Layout';
import {I18NLink} from 'app/I18N';
import {advancedSort} from 'app/utils/advancedSort';

export class ReferencesGroup extends Component {

  toggleGroup() {
    this.setState({expanded: !this.state.expanded});
  }

  componentWillMount() {
    this.setState({expanded: false});
  }

  render() {
    const {connectionType, connectionLabel, templateLabel} = this.props.group;
    const refs = advancedSort(this.props.group.refs, {property: 'connectedDocumentTitle'});
    const groupClassName = this.state.expanded ? 'is-expanded' : 'is-collapsed';

    return (
      <div className="item-group">
        <button className={`item-group-header ${groupClassName}`} onClick={this.toggleGroup.bind(this)}>
          <div className="title">
            <i className={`fa ${this.state.expanded ? 'fa-caret-up' : 'fa-caret-down'}`}></i>&nbsp;
            <ShowIf if={connectionType === 'metadata'}>
              <span className="itemGroup-title">{connectionLabel} in {templateLabel}</span>
            </ShowIf>
            <ShowIf if={connectionType === 'connection'}>
              <span className="itemGroup-title">{connectionLabel}</span>
            </ShowIf>
            <span className="multiselectItem-results">{refs.length}</span>
          </div>
        </button>

        {refs.map((reference, index) => {
          if (!this.state.expanded) {
            return false;
          }

          return (
            <div key={index} className='item'>
              <div className="item-info">
                <div className="item-name">
                  <Icon className="item-icon item-icon-center" data={reference.connectedDocumentIcon} />
                  {reference.connectedDocumentTitle}
                  {(() => {
                    if (reference.text) {
                      return <div className="item-snippet">
                        {reference.text}
                      </div>;
                    }
                  })()}
                </div>
              </div>
              <div className="item-actions">
                <div className="item-label-group">
                  <TemplateLabel template={reference.connectedDocumentTemplate}/>
                  &nbsp;&nbsp;
                  <ShowIf if={!reference.connectedDocumentPublished}>
                    <span className="label label-warning">
                      <i className="fa fa-warning"></i> Unpublished
                    </span>
                  </ShowIf>
                </div>
                <div className="item-shortcut-group">
                  <NeedAuthorization>
                    <ShowIf if={reference.sourceType !== 'metadata'}>
                      <a className="item-shortcut" onClick={this.props.deleteReference.bind(this, reference)}>
                        <i className="fa fa-trash"></i>
                      </a>
                    </ShowIf>
                  </NeedAuthorization>
                  &nbsp;
                  <I18NLink
                    to={`/${reference.connectedDocumentType}/${reference.connectedDocument}`}
                    onClick={e => e.stopPropagation()}
                    className="item-shortcut">
                    <span className="itemShortcut-arrow">
                      <i className="fa fa-external-link"></i>
                    </span>
                  </I18NLink>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

ReferencesGroup.propTypes = {
  group: PropTypes.object,
  deleteReference: PropTypes.func
};

export default connect()(ReferencesGroup);
