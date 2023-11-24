/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState, useMemo } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator, useBlocker } from 'react-router-dom';

import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';

import { Translate } from 'app/I18N';
import { isEqual } from 'lodash';
import * as SettingsAPI from 'app/V2/api/settings';
import { ConfirmNavigationModal } from 'app/V2/Components/Forms';

import { ClientSettingsLinkSchema } from 'app/apiResponseTypes';
import { notificationAtom } from 'app/V2/atoms';

import { Button, Table, Sidepanel } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import uniqueID from 'shared/uniqueID';
import { MenuForm } from './components/MenuForm';

import { columns } from './components/TableComponents';

const menuConfigloader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    SettingsAPI.getLinks(headers);

const MenuConfig = () => {
  const links = useLoaderData() as ClientSettingsLinkSchema[];
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();
  const [selectedLinks, setSelectedLinks] = useState<Row<ClientSettingsLinkSchema>[]>([]);
  const [formValues, setFormValues] = useState<ClientSettingsLinkSchema & { groupId?: string }>(
    {} as ClientSettingsLinkSchema & { groupId?: string }
  );
  const [linkChanges, setLinkChanges] = useState<ClientSettingsLinkSchema[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const linksWIthid = links?.map(link => {
      const subLinks =
        (link.sublinks || []).length > 0
          ? { sublinks: link.sublinks?.map(sublink => ({ ...sublink, _id: `tmp_${uniqueID()}` })) }
          : {};
      return { ...link, ...subLinks };
    });
    setLinkChanges(linksWIthid);
  }, [links]);
  const sanitizeIds = (link: ClientSettingsLinkSchema) => {
    if (link._id?.startsWith('tmp_')) {
      delete link._id;
    }
    if (link.sublinks) {
      link.sublinks = link.sublinks.map(sublink => {
        const { _id, ...rest } = sublink;
        return rest;
      });
    }
    return link;
  };

  const blocker = useBlocker(
    !isEqual(
      links,
      linkChanges.map(l => sanitizeIds(l))
    )
  );

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker, setShowModal]);

  const edit = (row: Row<ClientSettingsLinkSchema>) => {
    const parent = row.getParentRow();

    const link = row.original;
    setFormValues({ ...link, groupId: parent?.original._id });
    setIsSidepanelOpen(true);
  };

  const addLink = () => {
    setFormValues({ _id: `tmp_${uniqueID()}`, title: '', type: 'link', url: '' });
    setIsSidepanelOpen(true);
  };

  const addGroup = () => {
    setFormValues({ _id: `tmp_${uniqueID()}`, title: '', type: 'group', sublinks: [] });
    setIsSidepanelOpen(true);
  };

  const save = async () => {
    await SettingsAPI.saveLinks(linkChanges.map(sanitizeIds));
    revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Updated</Translate>,
    });
  };

  const deleteSelected = async () => {
    let newLinks = linkChanges.filter(
      link => !selectedLinks.find(selected => selected.original._id === link._id)
    );

    newLinks = newLinks.map(link => {
      if (link.sublinks) {
        link.sublinks = link.sublinks.filter(
          sublink => !selectedLinks.find(selected => selected.original._id === sublink._id)
        );
      }
      return link;
    });

    setLinkChanges(newLinks);
  };

  const formSubmit = async (values: ClientSettingsLinkSchema[]) => {
    setLinkChanges(values);
    setIsSidepanelOpen(false);
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-account"
    >
      <SettingsContent>
        <SettingsContent.Header title="Menu" />
        <SettingsContent.Body>
          <Table<ClientSettingsLinkSchema>
            enableSelection
            draggableRows
            columns={columns({ edit })}
            data={linkChanges}
            onChange={data => {
              setLinkChanges(data);
            }}
            title={<Translate>Menu</Translate>}
            subRowsKey="sublinks"
            onSelection={setSelectedLinks}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className={selectedLinks.length ? 'bg-primary-50' : ''}>
          {selectedLinks.length > 0 && (
            <div className="flex items-center gap-2">
              <Button type="button" onClick={deleteSelected} color="error">
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedLinks.length} <Translate>of</Translate>{' '}
              {links?.reduce(
                (acc, link) => acc + (link.type === 'group' ? (link.sublinks?.length || 1) + 1 : 1),
                0
              )}
            </div>
          )}
          {selectedLinks.length === 0 && (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button type="button" onClick={addLink}>
                  <Translate>Add link</Translate>
                </Button>
                <Button type="button" onClick={addGroup}>
                  <Translate>Add group</Translate>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={save}
                  color="success"
                  disabled={links === linkChanges}
                >
                  <Translate>Save</Translate>
                </Button>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={
          <Translate className="uppercase">
            {`${formValues?.title === '' ? 'New' : 'Edit'} ${
              formValues?.type === 'group' ? 'Group' : 'Link'
            }`}
          </Translate>
        }
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
        size="large"
        withOverlay
      >
        <MenuForm
          submit={formSubmit}
          closePanel={() => setIsSidepanelOpen(false)}
          link={formValues}
          links={linkChanges}
        />
      </Sidepanel>
      {showModal && (
        <ConfirmNavigationModal setShowModal={setShowModal} onConfirm={blocker.proceed} />
      )}
    </div>
  );
};

export { MenuConfig, menuConfigloader };
