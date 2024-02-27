import React, { useEffect, useState } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';

type LocalThesaurusValueSchema = ThesaurusValueSchema & { groupId?: string };
interface ValueFormProps {
  closePanel: () => void;
  value?: ThesaurusValueSchema;
  groups?: ThesaurusValueSchema[];
  submit: SubmitHandler<LocalThesaurusValueSchema[]>;
}

const ValueForm = ({ submit, closePanel, groups, value }: ValueFormProps) => {
  const [parentGroup, setParentGroup] = useState<ThesaurusValueSchema | undefined>();
  const [editing, setEditing] = useState(false);
  const [typing, setTyping] = useState('');

  const {
    watch,
    control,
    register,
    getValues,
    handleSubmit,
    // formState: { errors },
  } = useForm<{ newValues: LocalThesaurusValueSchema[] } | LocalThesaurusValueSchema>({
    mode: 'onSubmit',
    defaultValues: value || { newValues: [{ label: '' }] },
  });

  const { append, fields } = useFieldArray({ control, name: 'newValues' });

  useEffect(() => {
    if (!value) {
      setEditing(false);
    } else {
      setEditing(true);
    }

    if (value && groups) {
      const group = groups.find(singleGroup => {
        return singleGroup.values?.includes(value);
      });
      setParentGroup(group);
    }
  }, [value, groups]);

  useEffect(() => {
    const newValues = (getValues() as { newValues: ThesaurusValueSchema[] }).newValues;
    if (!editing) {
      console.log('Typing...');
      const hasEmpty = newValues.find(nv => nv.label === '');
      console.log('hasEmpty: ', hasEmpty);
      if (!hasEmpty) {
        append({ label: '' });
      }
    }
  }, [typing]);

  // const determineIfNeedToAddNewItem = () => {
  //   // check if there is an empty value
  //   if (!editing) {
  //     const newValues = watch('newValues');
  //     // console.log('Fields: ', newValues);
  //     const hasEmpty = newValues.find(v => v.label === '');
  //     // console.log('hasEmpty: ', hasEmpty);

  //     if (hasEmpty) return;
  //     append({ label: '' });
  //   }
  // };

  const renderInputs = () => {
    if (!editing) {
      return fields.map((localValue, index) => (
        <Card title={<Translate>Item</Translate>} key={localValue.id}>
          <div className="flex flex-col gap-4">
            <InputField
              id="item-name"
              data-testid="thesauri-form-item-name"
              label={<Translate>Title</Translate>}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register(`newValues.${index}.label`)}
              onBlur={e => setTyping(e.target.value)}
              // onBlur={determineIfNeedToAddNewItem}
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
        </Card>
      ));
    }
    return (
      <Card title={<Translate>Item</Translate>}>
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
      </Card>
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
        style={{ scroll }}
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
        {renderInputs()}
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
