/* eslint-disable react/no-multi-comp */
import React, { useCallback } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { map, omit } from 'lodash';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { t, Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { Button } from 'app/V2/Components/UI';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify as notifyAction } from 'app/Notifications/actions/notificationsActions';
import { DragSource, Container } from 'app/V2/Components/Layouts/DradAndDrop/';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { IStore } from 'app/istore';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { IDnDContext, useDnDContext } from 'app/V2/CustomHooks';
import debounce from 'app/utils/debounce';
import ID from 'shared/uniqueID';
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

const Filter = ({ item, context }: { item: ClientSettingsFilterSchema; context: IDnDContext }) => (
  <div className="flex flex-row items-center w-full h-10 mr-2" data-testid="filter_link">
    <span>{item.name}</span>
    <Button
      type="button"
      color="error"
      size="small"
      className="w-6 pl-1 ml-auto h-7 "
      onClick={() => {
        context.removeItem(item as IDraggable);
      }}
    >
      <TrashIcon className="w-3.5 pt-1" />
    </Button>
  </div>
);

const Group = ({
  item,
  context,
  index,
}: {
  item: ClientSettingsFilterSchema;
  context: IDnDContext;
  index: number;
}) => {
  const debouncedChangeHandler = useCallback(() => {
    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
      context.updateItems(index, {
        name: e.target.value,
      });
    };

    return debounce(changeHandler, 200);
  }, [context, index]);

  return (
    <div className="w-full mt-2" data-testid="filter_group">
      <div className="flex flex-row items-center w-full">
        <input
          data-testid={`filter_group_${index}`}
          type="text"
          className="w-full text-sm border-r-0 border-gray-300 rounded-md rounded-r-none "
          defaultValue={item.name}
          onChange={debouncedChangeHandler}
        />
        <Button
          data-testid={`delete_filter_group_${index}`}
          type="button"
          color="error"
          size="small"
          className="p-1 ml-auto rounded-l-none"
          disabled={item.items && item.items.length > 0}
          onClick={() => {
            context.removeItem(item as IDraggable, { omitSource: true });
          }}
        >
          <TrashIcon className="w-4" />
        </Button>
      </div>
      <Container
        context={context}
        itemComponent={Filter}
        name={`group_${item.name}`}
        className="w-full text-md"
        parent={item as IDraggable}
      />
    </div>
  );
};

const FilterComponent = ({
  item,
  context,
  index,
}: {
  item: ClientSettingsFilterSchema;
  context: IDnDContext;
  index: number;
}) =>
  item.items ? (
    <Group item={item} context={context} index={index} />
  ) : (
    <Filter item={item} context={context} />
  );

// eslint-disable-next-line max-statements
const FiltersFormComponent = ({ templates, settings, notify, setSettings }: mappedProps) => {
  const collectionSettings = settings.collection.toJS();
  const { filters } = collectionSettings;
  const usedFilters = (filters || []).map(filter => {
    // @ts-ignore: required by store structure
    const items = filter.items?.map(si => ({ ...si, id: si.id || si._id }));
    return { ...filter, id: filter._id, items };
  });

  const usedFiltersIds = usedFilters
    .map(filter => [filter._id, ...map(filter.items, 'id')])
    .flat()
    .filter(id => id);

  const availableFilters = templates
    .filter(template => template !== undefined && !usedFiltersIds.includes(template.get('_id')))
    .map(template => ({
      _id: template?.get('_id'),
      id: template?.get('_id'),
      name: template?.get('name'),
    }))
    .toJS();

  const dndContext = useDnDContext(ItemTypes.FILTER, usedFilters as IDraggable[], availableFilters);

  const sanitizeFilterForSave = (filter: ClientSettingsFilterSchema) => {
    const items = filter.items?.map(sf => omit(sf, ['parent', 'container', 'index', '_id']));
    return { ...omit(filter, ['container', 'index']), items };
  };

  const save = async () => {
    const currentFilters = dndContext.activeItems.map(filter => sanitizeFilterForSave(filter));
    const newSettings = { ...collectionSettings, filters: currentFilters };
    const result = await SettingsAPI.save(new RequestParams(newSettings));
    notify(t('System', 'Settings updated', null, false), 'success');
    setSettings(Object.assign(newSettings, result));
  };

  const addGroup = () => {
    const newGroup = { id: ID(), name: t('System', 'New group', null, false), items: [] };
    dndContext.addItem(newGroup);
  };

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
                  <Container context={dndContext} itemComponent={FilterComponent} name="root" />
                </div>
                <div className="col-sm-3" data-testid="inactive_filters_root">
                  <div className="FiltersForm-constructor">
                    <div>
                      <i>
                        <Translate>Entity types</Translate>
                      </i>
                    </div>
                    <DragSource context={dndContext} />
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
