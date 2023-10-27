/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';

import { Translate } from 'app/I18N';
import * as SettingsAPI from 'app/V2/api/settings';

import { ClientSettingsLinkSchema } from 'app/apiResponseTypes';
import { notificationAtom } from 'app/V2/atoms';

import { Button, Table, Sidepanel } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';

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
  const [linkToEdit, setLinkToEdit] = useState<ClientSettingsLinkSchema | undefined>();

  const edit = (row: Row<ClientSettingsLinkSchema>) => {
    setLinkToEdit(row.original);
    setIsSidepanelOpen(true);
  };

  const addLink = () => {
    setLinkToEdit({ title: '', type: 'link', url: '' });
    setIsSidepanelOpen(true);
  };

  const addGroup = () => {
    setLinkToEdit({ title: '', type: 'group', sublinks: [] });
    setIsSidepanelOpen(true);
  };

  const deleteSelected = async () => {
    const newLinks = links?.filter(
      link => !selectedLinks.map(selected => selected.original).includes(link)
    );

    await SettingsAPI.saveLinks(newLinks);
    revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Updated</Translate>,
    });
  };

  const formSubmit = async (formValues: ClientSettingsLinkSchema & { groupId?: string }) => {
    const { groupId, ...linkData } = formValues;

    if (linkData.type === 'group') {
      linkData.sublinks = [];
      links?.push(linkData);
    } else {
      const group = links?.find(_link => _link._id === groupId);
      if (group) {
        group.sublinks?.push(linkData);
      } else {
        links.push(linkData);
      }
    }

    await SettingsAPI.saveLinks(links);
    revalidator.revalidate();
    setIsSidepanelOpen(false);
    setNotifications({
      type: 'success',
      text: <Translate>Updated</Translate>,
    });
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
            data={links || []}
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
            <div className="flex gap-2">
              <Button type="button" onClick={addLink}>
                <Translate>Add link</Translate>
              </Button>
              <Button type="button" onClick={addGroup}>
                <Translate>Add group</Translate>
              </Button>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={
          <Translate className="uppercase">
            {`${linkToEdit?.title === '' ? 'New' : 'Edit'} ${
              linkToEdit?.type === 'group' ? 'Group' : 'Link'
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
          link={linkToEdit}
          links={links}
        />
      </Sidepanel>
    </div>
  );
};

export { MenuConfig, menuConfigloader };
