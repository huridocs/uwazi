import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { useSetAtom, useAtomValue } from 'jotai';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../api/V2/api/thesauri.js' ... Remove this comment to see the full error message
import * as ThesauriAPI from 'api/V2/api/thesauri.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Layouts/Se... Remove this comment to see the full error message
import { SettingsContent } from '../../V2/Components/Layouts/SettingsContent.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, ConfirmationModal } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/atoms.js' or its corr... Remove this comment to see the full error message
import { notificationAtom, templatesAtom } from '../../V2/atoms.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientThesaurus, Template } from '../../apiResponseTypes.js';
import { ThesauriTable } from './components/ThesauriTable';
import type { ThesauriRow } from './components/ThesauriTable';

const thesauriLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    ThesauriAPI.get({}, headers);

const ThesauriList = () => {
  const revalidator = useRevalidator();
  const thesauri = useLoaderData() as ClientThesaurus[];
  const setNotifications = useSetAtom(notificationAtom);
  const templates = useAtomValue(templatesAtom);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentThesauri, setCurrentThesauri] = useState<ThesauriRow[]>([]);
  const [selectedThesauri, setSelectedThesauri] = useState<ThesauriRow[]>([]);

  useMemo(() => {
    setCurrentThesauri(
      thesauri.map(thesaurus => {
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        const templatesUsingIt = templates
          // @ts-expect-error TS(7006): Parameter 't' implicitly has an 'any' type.
          .map(t => {
            const usingIt = t.properties?.some(
              (property: any) => property.content === thesaurus._id
            );
            return usingIt ? t : null;
          })
          // @ts-expect-error TS(7006): Parameter 't' implicitly has an 'any' type.
          .filter(t => t) as Template[];
        return {
          ...thesaurus,
          rowId: thesaurus._id,
          templates: templatesUsingIt,
          disableRowSelection: Boolean(templatesUsingIt.length),
        } as ThesauriRow;
      })
    );
  }, [thesauri, templates]);

  const deleteSelectedThesauri = async () => {
    try {
      const requests = selectedThesauri.map(async thesaurus =>
        // @ts-expect-error TS(2339): Property '_id' does not exist on type 'ThesauriRow... Remove this comment to see the full error message
        ThesauriAPI.deleteThesauri({ _id: thesaurus._id })
      );
      await Promise.all(requests);
      setNotifications({
        type: 'success',
        text: <Translate>Thesauri deleted</Translate>,
      });
    } catch (e) {
      setNotifications({
        type: 'error',
        text: e.message,
      });
    } finally {
      await revalidator.revalidate();
      setShowConfirmationModal(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-thesauri">
      <SettingsContent>
        <SettingsContent.Header title="Thesauri" />
        <SettingsContent.Body>
          <div data-testid="thesauri">
            <ThesauriTable
              currentThesauri={currentThesauri}
              setSelectedThesauri={setSelectedThesauri}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50" highlighted>
          {selectedThesauri.length ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setShowConfirmationModal(true)}
                color="error"
                data-testid="thesaurus-delete-link"
              >
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedThesauri.length} <Translate>of</Translate>{' '}
              {thesauri.length}
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Link to="/settings/thesauri/new">
                  <Button type="button">
                    <Translate>Add thesaurus</Translate>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      {showConfirmationModal && (
        <ConfirmationModal
          size="lg"
          header={<Translate>Delete</Translate>}
          warningText={<Translate>Are you sure you want to delete this item?</Translate>}
          body={
            <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
              {selectedThesauri.map(item => (
                // @ts-expect-error TS(2339): Property 'name' does not exist on type 'ThesauriRo... Remove this comment to see the full error message
                <li key={item.name}>{item.name}</li>
              ))}
            </ul>
          }
          onAcceptClick={deleteSelectedThesauri}
          onCancelClick={() => setShowConfirmationModal(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { ThesauriList, thesauriLoader };
