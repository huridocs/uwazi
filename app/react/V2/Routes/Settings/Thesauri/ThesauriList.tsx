import React, { useMemo, useState } from 'react';
import { Link, useLoaderData, useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, ConfirmationModal } from '#V2/Components/UI/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { useServices } from '#V2/services/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { ThesauriTable } from './components/ThesauriTable.js';
import type { ThesauriRow } from './components/ThesauriTable.js';

const ThesauriList = () => {
  const revalidator = useRevalidator();
  const thesauri = useLoaderData() as ClientThesaurus[];
  const { thesauri: thesaurusService } = useServices();
  const { notify } = useRequestStatus();
  const templates = useAtomValue(templatesAtom);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedThesauri, setSelectedThesauri] = useState<ThesauriRow[]>([]);

  const currentThesauri = useMemo(
    () =>
      thesauri.map(thesaurus => {
        const templatesUsingIt = templates.filter(templateItem =>
          templateItem.properties?.some(property => property.content === thesaurus._id)
        );

        return {
          ...thesaurus,
          rowId: thesaurus._id!,
          templates: templatesUsingIt,
          disableRowSelection: templatesUsingIt.length > 0,
        };
      }),
    [thesauri, templates]
  );

  const deleteSelectedThesauri = async () => {
    const ids = selectedThesauri.map(item => item._id).filter((id): id is string => Boolean(id));
    const [, error] = await thesaurusService.delete(ids);

    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
    } else {
      notify('success', t('System', 'Thesauri deleted', null, false));
      setSelectedThesauri([]);
    }

    await revalidator.revalidate();
    setShowConfirmationModal(false);
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
        <SettingsContent.Footer highlighted={selectedThesauri.length > 0}>
          {selectedThesauri.length ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setShowConfirmationModal(true)}
                variant="danger"
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

export { ThesauriList };
