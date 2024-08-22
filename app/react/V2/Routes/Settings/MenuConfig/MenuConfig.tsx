/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useMemo } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator, useBlocker } from 'react-router-dom';
import { Row, RowSelectionState } from '@tanstack/react-table';
import { useSetAtom } from 'jotai';
import { isEqual } from 'lodash';
import { Translate } from 'app/I18N';
import * as SettingsAPI from 'app/V2/api/settings';
import { ConfirmNavigationModal } from 'app/V2/Components/Forms';
import { ClientSettingsLinkSchema, ClientSublink } from 'app/apiResponseTypes';
import { notificationAtom } from 'app/V2/atoms';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { Button, Table, Sidepanel } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import uniqueID from 'shared/uniqueID';
import { MenuForm } from './components/MenuForm';

import { columns } from './components/TableComponents';

type Link = Omit<ClientSettingsLinkSchema, 'sublinks'> & {
  rowId?: string;
  subRows?: (ClientSublink & { rowId?: string })[];
};

const createRowId = () => `tmp_${uniqueID()}`;

const menuConfigloader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    (await SettingsAPI.getLinks(headers)).map(link => {
      const tableLinks: Link = { ...link, rowId: link._id! };
      if (link.sublinks) {
        tableLinks.subRows = link.sublinks.map((sublink, index) => ({
          ...sublink,
          rowId: `${link._id}-${index}`,
        }));
      }
      return tableLinks;
    });

const MenuConfig = () => {
  const links = useLoaderData() as Link[];
  const [linkState, setLinkState] = useState(links);
  const [selectedLinks, setSelectedLinks] = useState<RowSelectionState>({});
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const setNotifications = useSetAtom(notificationAtom);
  const revalidator = useRevalidator();
  const [formValues, setFormValues] = useState<Link & { parentId?: string }>();
  const [showModal, setShowModal] = useState(false);
  const setSettings = useSetAtom(settingsAtom);

  const areEqual = isEqual(links, linkState);

  const sanitizeIds = (_link: Link): ClientSettingsLinkSchema => {
    const { rowId: _deletedRowId, ...link } = { ..._link };
    const sanitizedLink: ClientSettingsLinkSchema = link;
    if (link._id?.startsWith('tmp_')) {
      delete sanitizedLink._id;
    }
    if (link.subRows) {
      const sublinks =
        link.subRows.map(sublink => {
          const { _id, rowId: _deletedSubrowId, ...rest } = sublink;
          return rest;
        }) || [];
      sanitizedLink.sublinks = sublinks;
    }
    delete link.subRows;
    return sanitizedLink;
  };

  const blocker = useBlocker(!areEqual);

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker, setShowModal]);

  const edit = (row: Row<Link>) => {
    const parent = row.getParentRow();
    const link = row.original;
    setFormValues({ ...link, parentId: parent?.id });
    setIsSidepanelOpen(true);
  };

  const addLink = () => {
    setFormValues({ title: '', type: 'link', url: '' });
    setIsSidepanelOpen(true);
  };

  const addGroup = () => {
    setFormValues({ title: '', type: 'group', subRows: [] });
    setIsSidepanelOpen(true);
  };

  const save = async () => {
    const settings = await SettingsAPI.saveLinks(linkState.map(sanitizeIds));
    setSettings(settings);
    revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Updated</Translate>,
    });
  };

  const deleteSelected = () => {
    let newLinks = linkState.filter(link => !(link.rowId && link.rowId in selectedLinks));

    newLinks = newLinks.map(link => {
      if (link.subRows) {
        link.subRows = link.subRows.filter(
          sublink => !(sublink.rowId && sublink.rowId in selectedLinks)
        );
      }
      return link;
    });

    setLinkState(newLinks);
  };

  const formSubmit = (values: Link[]) => {
    setLinkState(values);
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
          <Table
            enableSelections
            dnd={{ enable: true }}
            columns={columns({ edit })}
            data={linkState}
            onChange={({ rows, selectedRows }) => {
              setLinkState(rows);
              setSelectedLinks(selectedRows);
            }}
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Menu
              </Translate>
            }
          />
        </SettingsContent.Body>
        <SettingsContent.Footer
          className={Object.keys(selectedLinks).length ? 'bg-primary-50' : ''}
        >
          {Object.keys(selectedLinks).length > 0 && (
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                onClick={deleteSelected}
                color="error"
                data-testid="menu-delete-link"
              >
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate>&nbsp;{Object.keys(selectedLinks).length}&nbsp;
              <Translate>of</Translate>&nbsp;
              {linkState.reduce(
                (acc, link) => acc + (link.type === 'group' ? (link.subRows?.length || 1) + 1 : 1),
                0
              )}
            </div>
          )}
          {Object.keys(selectedLinks).length === 0 && (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button type="button" onClick={addLink} data-testid="menu-add-link">
                  <Translate>Add link</Translate>
                </Button>
                <Button type="button" onClick={addGroup} data-testid="menu-add-group">
                  <Translate>Add group</Translate>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={save}
                  color="success"
                  disabled={areEqual}
                  data-testid="menu-save"
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
        size="medium"
        withOverlay
      >
        <MenuForm
          submit={formSubmit}
          closePanel={() => setIsSidepanelOpen(false)}
          linkToEdit={formValues}
          links={linkState}
        />
      </Sidepanel>
      {showModal && (
        <ConfirmNavigationModal setShowModal={setShowModal} onConfirm={blocker.proceed} />
      )}
    </div>
  );
};

export type { Link };
export { MenuConfig, menuConfigloader, createRowId };
