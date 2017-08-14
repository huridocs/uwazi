import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Form} from 'react-redux-form';
import {isClient} from 'app/utils';

import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {loadLinks, addLink, sortLink, saveLinks} from 'app/Settings/actions/navlinksActions';
import {t} from 'app/I18N';
import validator from 'app/Settings/utils/ValidateNavlinks';
import NavlinkForm from './NavlinkForm';


export class NavlinksSettings extends Component {

  componentWillMount() {
    this.props.loadLinks(this.props.collection.get('links').toJS());
  }

  render() {
    const {collection, links} = this.props;
    const nameGroupClass = 'template-name';
    const hostname = isClient ? window.location.origin : '';

    const payload = {_id: collection.get('_id'), _rev: collection.get('_rev'), links};

    return (
      <div className="NavlinksSettings">
        <Form model="settings.navlinksData"
              onSubmit={this.props.saveLinks.bind(this, payload)}
              className="navLinks"
              validators={validator(links)}>

          <div className="panel panel-default">

            <div className="panel-heading">
              <div className={nameGroupClass}>
                {t('System', 'Menu')}
              </div>
            </div>
            <ul className="list-group">
              <li className="list-group-item">
                <div className="alert alert-info">
                  <i className="fa fa-info-circle"></i>
                  <div>
                    Use only relative URLs (starting with a /) and not fully formed URLs like http://www.google.com.<br />
                    If you copied a page universal URL, be sure to delete the first part ({hostname}).
                  </div>
                </div>
              </li>
              {links.map((link, i) => {
                return (
                  <NavlinkForm key={link.localID || link._id}
                               index={i}
                               id={link.localID || link._id}
                               link={link}
                               sortLink={this.props.sortLink} />
                );
              })}
            </ul>
            <div className="settings-footer">
              <a className="btn btn-primary"
                 onClick={this.props.addLink.bind(this, links)}>
                <i className="fa fa-plus"></i>
                <span className="btn-label">{t('System', 'Add link')}</span>
              </a>
              <button type="submit"
                      className="btn btn-success"
                      disabled={!!this.props.savingNavlinks}>
                <i className="fa fa-save"/>
                <span className="btn-label">{t('System', 'Save')}</span>
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

NavlinksSettings.propTypes = {
  collection: PropTypes.object,
  links: PropTypes.array,
  loadLinks: PropTypes.func.isRequired,
  addLink: PropTypes.func.isRequired,
  sortLink: PropTypes.func.isRequired,
  saveLinks: PropTypes.func.isRequired,
  savingNavlinks: PropTypes.bool
};

export const mapStateToProps = (state) => {
  const {settings} = state;
  const {collection} = settings;
  const links = settings.navlinksData.links;
  return {links, collection, savingNavlinks: settings.uiState.get('savingNavlinks')};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadLinks, addLink, sortLink, saveLinks}, dispatch);
}

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(NavlinksSettings)
);
