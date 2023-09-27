import React, { useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { useForm } from 'react-hook-form';
import { omit } from 'lodash';
import { Icon } from 'UI';
import { isClient } from 'app/utils';
import * as navlinksActions from 'app/Settings/actions/navlinksActions';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { DraggableItem } from 'app/V2/Components/Layouts/DradAndDrop';
import { ItemTypes } from 'app/V2/shared/types';
import { useDnDContext } from 'app/V2/CustomHooks';
import { SettingsHeader } from './SettingsHeader';
import { NavlinkForm } from './NavlinkForm';
import './styles/menu.scss';

interface NavlinksSettingsProps {
  addLink: Function;
  sortLink: Function;
  saveLinks: Function;
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
  loadLinks,
  saveLinks,
  sortLink,
  addLink,
  savingNavlinks,
}: mappedProps) => {
  const dndContext = useDnDContext(ItemTypes.LINK, links);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { links },
    mode: 'onSubmit',
  });

  const hostname = isClient ? window.location.origin : '';

  const payload = {
    _id: collection.get('_id'),
    _rev: collection.get('_rev'),
    links: links.map(li => omit(li, 'id')),
  };
  const formSubmit = async () => {
    saveLinks(payload);
  };

  useEffect(() => {
    loadLinks(collection.get('links')?.toJS());
  }, [collection, loadLinks]);

  useEffect(() => {
    dndContext.updateActiveItems(links);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links]);

  return (
    <div className="settings-content">
      <div className="NavlinksSettings">
        <form onSubmit={handleSubmit(formSubmit)} id="edit-translations">
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
              {dndContext.activeItems.map((link, i) => (
                <DraggableItem
                  item={{ ...link, container: 'root' }}
                  index={i}
                  context={{
                    ...dndContext,
                    sort: sortLink,
                  }}
                  omitIcon
                >
                  <NavlinkForm
                    id={link.id}
                    link={link}
                    index={i}
                    key={link.id}
                    register={register}
                    // @ts-ignore
                    hasError={errors?.settings?.navlinksData?.links?.[i] !== undefined}
                  />
                </DraggableItem>
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
        </form>
      </div>
    </div>
  );
};

const container = connector(NavlinksSettingsComponent);
export { container as NavlinksSettings };
