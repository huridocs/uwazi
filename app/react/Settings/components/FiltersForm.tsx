/* eslint-disable max-statements */
import React, { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { TrashIcon } from '@heroicons/react/20/solid';
import { flatMapDeep, omit } from 'lodash';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { t, Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { Button } from 'app/V2/Components/UI';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify as notifyAction } from 'app/Notifications/actions/notificationsActions';
import {
  DragSource,
  Container,
  addSubject$,
  removeSubject$,
} from 'app/V2/Components/Layouts/DradAndDrop/';

import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { IStore } from 'app/istore';
import ID from 'shared/uniqueID';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { SettingsHeader } from './SettingsHeader';

const mapStateToProps = ({ settings, templates }: IStore) => ({
  settings,
  templates,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    { setSettings: actions.set.bind(null, 'settings/collection'), notify: notifyAction },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
const FiltersFormComponent = ({ templates, settings, notify, setSettings }: mappedProps) => {
  const collectionSettings = settings.collection.toJS();
  const [activeFilters, setActiveFilters] = useState(collectionSettings.filters || []);
  const usedFiltersIds = flatMapDeep(activeFilters, item => item.id);
  const availableFilters = templates
    .filter(template => template !== undefined && !usedFiltersIds.includes(template.get('_id')))
    .map(template => ({
      _id: template?.get('_id'),
      name: template?.get('name'),
    }))
    .toJS();

  const sanitizeFilterForSave = (filter: ClientSettingsFilterSchema) =>
    omit(filter, ['container', 'index', 'items.container', 'items.index', 'items.index._id']);

  const save = async () => {
    const filters = activeFilters.map(filter => sanitizeFilterForSave(filter));
    const newSettings = { ...collectionSettings, filters };
    const result = await SettingsAPI.save(new RequestParams(newSettings));
    notify(t('System', 'Settings updated', null, false), 'success');
    setSettings(Object.assign(settings, result));
  };

  const addGroup = () => {
    const newGroup = { id: ID(), name: t('System', 'New group', null, false), items: [] };
    addSubject$.next({ ...newGroup, target: 'root' });
  };
  const renderFilter = (item: ClientSettingsFilterSchema) => (
    <div className="flex flex-row items-center w-full">
      <span>{item.name}</span>
      <Button
        type="button"
        color="error"
        size="small"
        className="p-1 ml-auto "
        onClick={() => {
          removeSubject$.next(item);
        }}
      >
        <TrashIcon className="w-4" />
      </Button>
    </div>
  );

  const handleNameChange = (group: any) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveFilters([activeFilters, { ...group, name: event.currentTarget.value }]);
  };

  const renderGroup = (group: ClientSettingsFilterSchema) => (
    <div className="w-full ">
      <div className="flex flex-row items-center w-full">
        <input
          type="text"
          className="w-full text-sm border-r-0 border-gray-300 rounded-md rounded-r-none "
          value={group.name}
          onChange={handleNameChange}
        />
        <Button
          type="button"
          color="error"
          size="small"
          className="p-1 ml-auto rounded-l-none"
          disabled={group.items && group.items.length > 0}
          onClick={() => {
            removeSubject$.next(group);
          }}
        >
          <TrashIcon className="w-4" />
        </Button>
      </div>
      <Container
        type={ItemTypes.FILTER}
        items={group.items as IDraggable[]}
        itemComponent={renderFilter}
        name={`group_${group.name}`}
        className="w-full text-xs"
      />
    </div>
  );

  const returnRenderItem = (item: ClientSettingsFilterSchema) =>
    item.items ? renderGroup(item) : renderFilter(item);

  return (
    <div className="settings-content">
      <div className="FiltersForm">
        <div className="FiltersForm-list">
          <div className="panel panel-default">
            <SettingsHeader>
              <Translate>Filters configuration</Translate>
            </SettingsHeader>
            <div className="panel-body">
              <div className="row">
                <div className="col-sm-9">
                  <div className="alert alert-info">
                    <Icon icon="info-circle" size="2x" />
                    <div className="force-ltr">
                      <p>
                        <Translate translationKey="Filters configuration description">
                          By default, users can filter the entities in the library based on the
                          types you have defined. However, you can configure how these entity types
                          will be displayed:
                        </Translate>
                      </p>
                      <ul>
                        <li>
                          <Translate translationKey="Filters configuration">
                            drag and drop each entity type into the window in order to configure
                            their order
                          </Translate>
                        </li>
                        <li>
                          <Translate translationKey="Filters configuration example">
                            select &quot;Create group&quot; below to group filters under a label e.g
                            (&quot;Documents &quot;or &quot;People&quot;)
                          </Translate>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Container
                    type={ItemTypes.FILTER}
                    items={activeFilters as IDraggable[]}
                    itemComponent={returnRenderItem}
                    name="root"
                    onChange={setActiveFilters}
                  />
                </div>
                <div className="col-sm-3">
                  <div className="FiltersForm-constructor">
                    <div>
                      <i>
                        <Translate>Entity types</Translate>
                      </i>
                    </div>
                    <DragSource items={availableFilters as IDraggable[]} type={ItemTypes.FILTER} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="settings-footer">
          <div className="btn-cluster">
            <button type="button" onClick={addGroup} className="btn btn-default">
              <Icon icon="plus" />
              <span className="btn-label">
                <Translate>Create group</Translate>
              </span>
            </button>
          </div>
          <div className="btn-cluster content-right">
            <button type="button" onClick={save} className="btn btn-success btn-extra-padding">
              <span className="btn-label">
                <Translate>Save</Translate>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const container = connector(FiltersFormComponent);
export { container as FiltersForm };
