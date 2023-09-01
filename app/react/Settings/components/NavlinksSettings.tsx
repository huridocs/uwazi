import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Form } from 'react-redux-form';
import { Icon } from 'UI';
import { isClient } from 'app/utils';
import * as navlinksActions from 'app/Settings/actions/navlinksActions';
import { Translate } from 'app/I18N';
import validator from 'app/Settings/utils/ValidateNavlinks';
import { IStore } from 'app/istore';
import { ItemTypes } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';
import { SettingsHeader } from './SettingsHeader';
import { NavlinkForm } from './NavlinkForm';
import './styles/menu.scss';

// NavlinksSettings.propTypes = {
//   collection: PropTypes.object,
//   links: PropTypes.array,
//   loadLinks: PropTypes.func.isRequired,
//   addLink: PropTypes.func.isRequired,
//   sortLink: PropTypes.func.isRequired,
//   saveLinks: PropTypes.func.isRequired,
//   savingNavlinks: PropTypes.bool,
// };

interface NavlinksSettingsProps {
  loadLinks: Function;
  addLink: Function;
  sortLink: Function;
  saveLinks: Function;
  useDrop: Function;
}

const mapStateToProps = ({ settings }: IStore) => {
  const { collection } = settings;
  const { links = [] } = settings.navlinksData || {};
  return { links, collection, savingNavlinks: settings.uiState?.get('savingNavlinks') };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      loadLinks: navlinksActions.loadLinks,
      addLink: navlinksActions.addLink,
      sortLink: navlinksActions.sortLink,
      saveLinks: navlinksActions.saveLinks,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & NavlinksSettingsProps;

const NavlinksSettingsComponent = ({
  collection,
  links,
  saveLinks,
  sortLink,
  addLink,
  loadLinks,
  savingNavlinks,
  useDrop,
}: mappedProps) => {
  // componentDidMount() {
  //   this.props.loadLinks(this.props.collection.get('links').toJS());
  //   this.firstLoad = true;
  // }

  // // TEST!!!
  // componentDidUpdate(previousProps) {
  //   if (this.firstLoad) {
  //     this.firstLoad = false;
  //     return;
  //   }

  //   this.focusOnNewElement(previousProps);
  // }

  // // TEST!!!
  // focusOnNewElement(previousProps) {
  //   const { links } = this.props;
  //   const previousLinks = previousProps.links;
  //   const hasNewBlock = links.length > previousLinks.length;
  //   if (hasNewBlock) {
  //     this.blockReferences[this.blockReferences.length - 1].focus();
  //   }
  // }

  // const [, drop] = useDrop(() => ({
  //   accept: ItemTypes.LINK,
  //   drop: () => sortLink(),
  // }));

  const hostname = isClient ? window.location.origin : '';

  const payload = { _id: collection.get('_id'), _rev: collection.get('_rev'), links };

  const blockReferences: any[] = [];

  return (
    <div className="settings-content">
      <div className="NavlinksSettings">
        <Form
          model="settings.navlinksData"
          onSubmit={() => saveLinks(payload)}
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
                      If it is an internal URL within this website, be sure to delete the first part
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
                  linkIndex={i}
                  id={link.localID || link._id}
                  link={link}
                  sortLink={sortLink}
                  blockReferences={blockReferences}
                  index={i.toString()}
                  key={link.localID || link._id}
                />
              ))}
            </ul>
            <div className="settings-footer">
              <div className="btn-cluster">
                <button
                  type="button"
                  className="btn btn-default"
                  id="main-add-link-button"
                  onClick={() => addLink(links, 'link')}
                >
                  <Icon icon="link" />
                  &nbsp;<Translate>Add link</Translate>
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={() => addLink(links, 'group')}
                >
                  <Icon icon="caret-square-down" />
                  &nbsp;<Translate>Add group</Translate>
                </button>
              </div>
              <div className="btn-cluster content-right">
                <button
                  type="submit"
                  className="btn btn-success btn-extra-padding"
                  disabled={!!savingNavlinks}
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
};

const container = connector(withDnD(NavlinksSettingsComponent));
export { container as NavlinksSettings };
