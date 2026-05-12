/* eslint-disable max-statements */
import React, { useState, useRef, useEffect } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator, useBlocker } from 'react-router';
import { Row, RowSelectionState } from '@tanstack/react-table';
import cloneDeep from 'lodash/cloneDeep.js';
import isEqual from 'lodash/isEqual.js';
import { useSetAtom } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import * as SettingsAPI from '#V2/api/settings/index.js';
import { mergeClientSettings } from '#V2/atoms/mergeClientSettings.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { Button, Table, Sidepanel, ConfirmNavigationModal } from '#app/V2/Components/UI/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { MenuForm } from './components/MenuForm.js';
import { columns } from './components/TableComponents.js';
import { Link, sanitizeIds } from './shared.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

const menuConfigloader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [links] = await SettingsAPI.getLinks(headers);

    const tableRows = (links || []).map(link => {
      const linkWithRowId: Link = { ...link, rowId: link._id! };
      if (link.sublinks) {
        linkWithRowId.subRows = link.sublinks.map((sublink, index) => ({
          ...sublink,
          rowId: `${link._id}-${index}`,
        }));
      }
      return linkWithRowId;
    });
    return tableRows;
  };

const MenuConfig = () => {
  const links = useLoaderData() as Link[];
  const [linkState, setLinkState] = useState(links);
  const prevLinks = useRef(cloneDeep(links));
  const [selectedLinks, setSelectedLinks] = useState<RowSelectionState>({});
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const { notify } = useRequestStatus();
  const revalidator = useRevalidator();
  const [formValues, setFormValues] = useState<Link & { parentId?: string }>();
  const [showModal, setShowModal] = useState(false);
  const setSettings = useSetAtom(settingsAtom);

  const areEqual = isEqual(linkState, prevLinks.current);

  const blocker = useBlocker(!areEqual);

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
    const [settings, error] = await SettingsAPI.saveLinks(linkState.map(sanitizeIds));
    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.message || undefined
      );
      return;
    }

    setSettings(prev => mergeClientSettings(prev, settings));
    await revalidator.revalidate();
    notify('success', t('System', 'Updated', null, false));
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

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker, setShowModal]);

  useEffect(() => {
    prevLinks.current = cloneDeep(links);
    setLinkState(links);
  }, [links]);

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-account">
      <SettingsContent>
        <SettingsContent.Header title="Menu" />
        <SettingsContent.Body>
          <Table
            enableSelections
            dnd={{ enable: true }}
            columns={columns({ edit })}
            data={linkState}
            onSelect={({ selectedRows }) => {
              setSelectedLinks(selectedRows);
            }}
            onSort={({ rows }) => {
              setLinkState(rows);
            }}
            header={
              <Translate className="text-left text-base font-semibold text-ink">Menu</Translate>
            }
          />
        </SettingsContent.Body>
        <SettingsContent.Footer highlighted={Object.keys(selectedLinks).length > 0}>
          {Object.keys(selectedLinks).length > 0 && (
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                onClick={deleteSelected}
                variant="danger"
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
                  variant="success"
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
export { MenuConfig, menuConfigloader };
