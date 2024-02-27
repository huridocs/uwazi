import React, { useEffect, useState } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import uniqueID from 'shared/uniqueID';

type LocalThesaurusValueSchema = ThesaurusValueSchema & { groupId?: string };
interface ValueFormProps {
  closePanel: () => void;
  value?: ThesaurusValueSchema;
  groups?: ThesaurusValueSchema[];
  submit: SubmitHandler<LocalThesaurusValueSchema[]>;
}

const ValueForm = ({ submit, closePanel, groups, value }: ValueFormProps) => {
  const [parentGroup, setParentGroup] = useState<ThesaurusValueSchema | undefined>();

  const {
    register,
    control,
    handleSubmit,
    // formState: { errors },
  } = useForm<{ newValues: LocalThesaurusValueSchema[] } | LocalThesaurusValueSchema>({
    mode: 'onSubmit',
    defaultValues: value || { newValues: [{ label: '', id: uniqueID() }] },
  });

  const { append, fields } = useFieldArray({ control, name: 'newValues' });

  useEffect(() => {
    console.log('Use effect: ', value);
    if (value && groups) {
      const group = groups.find(singleGroup => {
        return singleGroup.values?.includes(value);
      });
      setParentGroup(group);
    }
  }, [value, groups]);

  const determineIfNeedToAddNewItem = () => {
    // check if there is an empty value
    if (!value) {
      console.log('Determining whether to add a new item');
      const hasEmpty = fields.find(v => v.label === '');
      console.log('Has empty: ', hasEmpty);
      if (hasEmpty.length === 2) return;
      append({ label: '', id: uniqueID() });
    }
  };

  const renderInputs = () => {
    if (!value) {
      return fields.map((localValue, index) => (
        <div className="flex flex-col gap-4" key={localValue.id}>
          <InputField
            id="item-name"
            data-testid="thesauri-form-item-name"
            label={<Translate>Title</Translate>}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register(`newValues.${index}.label`, { required: true })}
            onChange={determineIfNeedToAddNewItem}
            // hasErrors={!!errors.label}
          />
          {groups && (
            <Select
              id="item-group"
              data-testid="thesauri-form-item-group"
              label={<Translate>Group</Translate>}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register(`newValues.${index}.groupId`)}
              value={parentGroup ? parentGroup.id : undefined}
              disabled={!!parentGroup}
              options={[
                { value: '', label: 'No label', key: '0' },
                ...groups.map(group => ({
                  value: group.id as string,
                  label: group.label as string,
                  key: group.id as string,
                })),
              ]}
            />
          )}
        </div>
      ));
    }
    return (
      <div className="flex flex-col gap-4">
        <InputField
          id="item-name"
          data-testid="thesauri-form-item-name"
          label={<Translate>Title</Translate>}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...register('label', { required: true })}
          // hasErrors={!!errors.label}
        />
        {groups && (
          <Select
            id="item-group"
            data-testid="thesauri-form-item-group"
            label={<Translate>Group</Translate>}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('groupId')}
            value={parentGroup ? parentGroup.id : undefined}
            disabled
            options={[
              { value: '', label: 'No label', key: '0' },
              ...groups.map(group => ({
                value: group.id as string,
                label: group.label as string,
                key: group.id as string,
              })),
            ]}
          />
        )}
      </div>
    );
  };
  return (
    <div className="relative h-full">
      {!value && (
        <div className="p-4 mb-4 border rounded-md shadow-sm border-gray-50 bg-primary-100 text-primary-700">
          <div className="flex items-center w-full gap-1 text-base font-semibold">
            <div className="w-5 h-5 text-sm">
              <CheckCircleIcon />
            </div>
            <Translate>Adding items to the thesauri</Translate>
          </div>
          <div className="force-ltr">
            <Translate>You can add one or many items in this form.</Translate>
            <br />
            <Translate translationKey="thesauri new item desc">
              Once you type the first item name, a new item form will appear underneath it, so you
              can keep on adding as many as you want.
            </Translate>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit(
          (item: { newValues: LocalThesaurusValueSchema[] } | LocalThesaurusValueSchema) => {
            if (!value) {
              // New Items
              const items = (item as { newValues: LocalThesaurusValueSchema[] }).newValues.filter(
                newValue => newValue.label !== ''
              ) as unknown as LocalThesaurusValueSchema[];
              console.log('Submitting new items: ', items);
              submit(items);
              return;
            }
            if (parentGroup) {
              (item as LocalThesaurusValueSchema).groupId = parentGroup.id;
            }
            // @ts-ignore
            submit([item]);
          }
        )}
        id="menu-form"
      >
        <Card title={<Translate>Item</Translate>}>{renderInputs()}</Card>
      </form>
      <div className="absolute bottom-0 flex w-full gap-2">
        <Button
          styling="light"
          onClick={closePanel}
          className="grow"
          data-testid="menu-form-cancel"
        >
          <Translate>Cancel</Translate>
        </Button>
        <Button className="grow" type="submit" form="menu-form" data-testid="menu-form-submit">
          <Translate>Add</Translate>
        </Button>
      </div>
    </div>
  );
};

export { ValueForm };
export type { LocalThesaurusValueSchema };
