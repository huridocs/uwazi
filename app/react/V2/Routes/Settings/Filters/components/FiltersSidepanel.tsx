/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { useLoaderData } from 'react-router-dom';
import uniqueID from 'shared/uniqueID';
import { Translate } from 'app/I18N';
import { ClientTemplateSchema } from 'app/istore';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { InputField, MultiSelect } from 'V2/Components/Forms';
import { sidepanelAtom } from './sidepanelAtom';
import { Filter, LoaderData } from './helpers';

type FiltersSidepanelProps = {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (newFilter: Filter | undefined) => void;
  availableTemplates?: ClientTemplateSchema[];
};

const FiltersSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  onSave,
  availableTemplates,
}: FiltersSidepanelProps) => {
  const { templates: allTemplates } = useLoaderData() as LoaderData;
  const filter = useAtomValue(sidepanelAtom);
  const multiselectValues = filter?.subRows?.map(item => item.id).filter(v => v) as
    | string[]
    | undefined;

  const selectedValues: string[] = [];
  const selectedOptions =
    multiselectValues?.map(value => {
      const template = allTemplates.find(t => t._id === value)!;
      selectedValues.push(template?._id);
      return {
        label: template?.name,
        value: template?._id,
      };
    }) || [];

  const availableOptions = availableTemplates?.map(availableTemplate => ({
    label: availableTemplate.name!,
    value: availableTemplate._id!,
  }));

  const defaultValues = { ...filter, subRows: selectedValues, rowId: filter?.rowId || 'NEW' };
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    values: defaultValues,
  });

  const closeSidepanel = () => {
    setShowSidepanel(false);
    reset();
  };

  const formatSelected = (selected: string[] | undefined) =>
    selected?.map(selection => {
      const templateName = allTemplates?.find(template => template._id === selection)?.name;
      return { id: selection, name: templateName, rowId: selection };
    });

  const handleSave = (values: Omit<Filter, 'subRows'> & { subRows: string[] }) => {
    const result = { ...values, subRows: formatSelected(values.subRows) };

    if (!filter?._id) delete result._id;
    if (!filter?.id) result.id = uniqueID();
    if (result.rowId === defaultValues.rowId) result.rowId = uniqueID();

    onSave(result);
    closeSidepanel();
  };

  return (
    <Sidepanel
      withOverlay
      isOpen={showSidepanel}
      closeSidepanelFunction={() => closeSidepanel()}
      title={filter?.name ? <Translate>Edit group</Translate> : <Translate>Add group</Translate>}
    >
      <Sidepanel.Body>
        <form onSubmit={handleSubmit(handleSave)} id="group-edit-form">
          <input className="hidden" {...register('_id')} />
          <input className="hidden" {...register('id')} />
          <input className="hidden" {...register('rowId')} />

          <Card title={<Translate>General Information</Translate>} className="mb-4">
            <InputField
              label={<Translate>Name</Translate>}
              id="group-name"
              {...register('name', {
                required: true,
              })}
              errorMessage={
                errors.name?.type === 'required' && <Translate>This field is required</Translate>
              }
            />
          </Card>

          <Card title={<Translate>Entity types</Translate>} className="mb-4">
            <div className="flex flex-col gap-4">
              <Controller
                control={control}
                name="subRows"
                render={({ field: { onChange, value } }) => (
                  <MultiSelect
                    label={<Translate>Entity types</Translate>}
                    options={[...(selectedOptions || []), ...(availableOptions || [])]}
                    value={value || []}
                    onChange={onChange}
                  />
                )}
              />
            </div>
          </Card>
        </form>
      </Sidepanel.Body>
      <Sidepanel.Footer className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            className="flex-grow"
            type="button"
            styling="outline"
            onClick={() => {
              closeSidepanel();
            }}
          >
            <Translate>Cancel</Translate>
          </Button>
          <Button className="flex-grow" type="submit" form="group-edit-form">
            {filter?.id ? <Translate>Update</Translate> : <Translate>Add</Translate>}
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { FiltersSidepanel };
