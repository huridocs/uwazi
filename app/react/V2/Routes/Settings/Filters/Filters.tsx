import React, { useState } from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { ClientTemplateSchema } from 'app/istore';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import * as settingsAPI from 'V2/api/settings';
import * as templatesAPI from 'V2/api/templates';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Button, Table } from 'app/V2/Components/UI';
import { createColumns, AddTemplatesModal } from './components';

type LoaderData = {
  filters: ClientSettingsFilterSchema[] | undefined;
  templates: ClientTemplateSchema[];
};

const filterAvailableTemplates = (
  templates: ClientTemplateSchema[],
  filters?: ClientSettingsFilterSchema[]
) => {
  const usedTemplatesIds: string[] = [];

  filters?.forEach(filter => {
    if (filter.items) {
      filter.items.forEach(item => {
        usedTemplatesIds.push(item.id!);
      });
    }
    if (filter.id) {
      usedTemplatesIds.push(filter.id);
    }
  });

  return templates.filter(template => !usedTemplatesIds.includes(template._id));
};

const filtersLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<LoaderData> =>
  async () => {
    const { filters } = await settingsAPI.get(headers);
    const templates = await templatesAPI.get(headers);
    const filteredTemplates = filterAvailableTemplates(templates, filters);

    return { filters, templates: filteredTemplates };
  };

const Filters = () => {
  const loaderData = useLoaderData() as LoaderData;
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilers] = useState(loaderData.filters);
  const [templates, setTemplates] = useState(loaderData.templates);
  const [selectedFilter, setSelectedFilter] = useState<Row<ClientSettingsFilterSchema>[]>([]);

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Filters" />

        <SettingsContent.Body>
          <div className="p-4 mb-4 rounded-md border border-gray-50 shadow-sm bg-primary-100 text-primary-700">
            <div className="flex gap-2 items-center w-full text-base font-semibold">
              <div className="w-5 h-5">
                <CheckCircleIcon />
              </div>
              <Translate>Filters configuration</Translate>
            </div>
            <div className="force-ltr">
              <Translate translationKey="Filters configuration description">
                By default, users can filter the entities in the library based on the types you have
                defined. However, you can configure how these entity types will be displayed:
              </Translate>
              <br />
              <ul className="list-disc list-inside">
                <li>
                  <Translate translationKey="Filters configuration">
                    drag and drop each entity type into the window in order to configure their order
                  </Translate>
                </li>
                <li>
                  <Translate translationKey="Filters configuration example">
                    Select &quot;Add group&quot; below to group filters under a label e.g
                    (&quot;Documents &quot;or &quot;People&quot;)
                  </Translate>
                </li>
              </ul>
            </div>
          </div>

          <Table<ClientSettingsFilterSchema>
            draggableRows
            enableSelection
            subRowsKey="items"
            onChange={updatedFilters => {
              setFilers(updatedFilters);
            }}
            onSelection={selected => {
              setSelectedFilter(selected);
            }}
            columns={createColumns()}
            data={filters || []}
            title={<Translate>Custom Uploads</Translate>}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2 justify-start items-center">
          {selectedFilter.length ? (
            <Button styling="solid" color="error" onClick={() => {}}>
              <Translate>Delete</Translate>
            </Button>
          ) : (
            <>
              <Button styling="solid" color="primary" onClick={() => setShowModal(true)}>
                <Translate>Add entity type</Translate>
              </Button>
              <Button styling="solid" color="primary" onClick={() => {}}>
                <Translate>Add group</Translate>
              </Button>
            </>
          )}
        </SettingsContent.Footer>
      </SettingsContent>

      {showModal && (
        <AddTemplatesModal
          templates={templates}
          onCancel={() => setShowModal(false)}
          onAdd={templateIds => {
            console.log(templateIds);
          }}
        />
      )}
    </div>
  );
};

export { Filters, filtersLoader };
