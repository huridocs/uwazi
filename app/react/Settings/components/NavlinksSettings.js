import { Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { isClient } from 'app/utils';
import { loadLinks, addLink, sortLink, saveLinks } from 'app/Settings/actions/navlinksActions';
import { Translate } from 'app/I18N';
import validator from 'app/Settings/utils/ValidateNavlinks';
import { DNDHTMLBackend } from 'app/App/DNDHTML5Backend';
import NavlinkForm from './NavlinkForm';
import { SettingsHeader } from './SettingsHeader';
import './styles/menu.scss';

class NavlinksSettings extends Component {
  componentDidMount() {
    this.props.loadLinks(this.props.collection.get('links').toJS());
    this.firstLoad = true;
  }

  // TEST!!!
  componentDidUpdate(previousProps) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return;
    }

    this.focusOnNewElement(previousProps);
  }

  // TEST!!!
  focusOnNewElement(previousProps) {
    const { links } = this.props;
    const previousLinks = previousProps.links;
    const hasNewBlock = links.length > previousLinks.length;
    if (hasNewBlock) {
      this.blockReferences[this.blockReferences.length - 1].focus();
    }
  }

  render() {
    const { collection, links } = this.props;
    const hostname = isClient ? window.location.origin : '';

    const payload = { _id: collection.get('_id'), _rev: collection.get('_rev'), links };

    this.blockReferences = [];

    return (
      <div className="settings-content">
        <div className="NavlinksSettings">
          <Form
            model="settings.navlinksData"
            onSubmit={this.props.saveLinks.bind(this, payload)}
            className="navLinks"
            validators={validator(links)}
          >
            <div className="panel panel-default">
              <SettingsHeader>
                <Translate>Menu</Translate>
              </SettingsHeader>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="alert alert-info">
                    <Icon icon="info-circle" size="2x" />
                    <div className="force-ltr">
                      <Translate>
                        If it is an external URL, use a fully formed URL. Ie. http://www.uwazi.io.
                      </Translate>
                      <br />
                      <Translate translationKey="Navigation menu tool tip part 1">
                        If it is an internal URL within this website, be sure to delete the first
                        part
                      </Translate>{' '}
                      ({hostname}),{' '}
                      <Translate translationKey="Navigation menu tool tip part 2">
                        leaving only a relative URL starting with a slash character. Ie. /some_url.
                      </Translate>
                    </div>
                  </div>
                </li>
                {links.map((link, i) => (
                  <NavlinkForm
                    key={link.localID || link._id}
                    index={i}
                    id={link.localID || link._id}
                    link={link}
                    sortLink={this.props.sortLink}
                    blockReferences={this.blockReferences}
                  />
                ))}
              </ul>
              <div className="settings-footer">
                <div className="btn-cluster">
                  <button
                    type="button"
                    className="btn btn-default"
                    id="main-add-link-button"
                    onClick={this.props.addLink.bind(this, links, 'link')}
                  >
                    <Icon icon="link" />
                    &nbsp;<Translate>Add link</Translate>
                  </button>
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={this.props.addLink.bind(this, links, 'group')}
                  >
                    <Icon icon="caret-square-down" />
                    &nbsp;<Translate>Add group</Translate>
                  </button>
                </div>
                <div className="btn-cluster content-right">
                  <button
                    type="submit"
                    className="btn btn-success btn-extra-padding"
                    disabled={!!this.props.savingNavlinks}
                  >
                    <span className="btn-label">
                      <Translate>Save</Translate>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Form>
        </div>
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
  savingNavlinks: PropTypes.bool,
};

const mapStateToProps = state => {
  const { settings } = state;
  const { collection } = settings;
  const { links } = settings.navlinksData;
  return { links, collection, savingNavlinks: settings.uiState.get('savingNavlinks') };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ loadLinks, addLink, sortLink, saveLinks }, dispatch);
}

export { NavlinksSettings, mapStateToProps };

export default DNDHTMLBackend(connect(mapStateToProps, mapDispatchToProps)(NavlinksSettings));
