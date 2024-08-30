import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { useSetAtom, useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import ThesauriAPI from 'app/V2/api/thesauri';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, ConfirmationModal } from 'app/V2/Components/UI';
import { notificationAtom, templatesAtom } from 'app/V2/atoms';
import { ClientThesaurus, Template } from 'app/apiResponseTypes';
import { ThesauriTable } from './components/ThesauriTable';
import type { ThesauriRow } from './components/ThesauriTable';

const thesauriLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    ThesauriAPI.getThesauri({}, headers);

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
        const templatesUsingIt = templates
          .map(t => {
            const usingIt = t.properties?.some(
              (property: any) => property.content === thesaurus._id
            );
            return usingIt ? t : null;
          })
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
      const requests = selectedThesauri.map(thesaurus =>
        ThesauriAPI.delete({ _id: thesaurus._id.toString() })
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
      revalidator.revalidate();
      setShowConfirmationModal(false);
    }
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-thesauri"
    >
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
