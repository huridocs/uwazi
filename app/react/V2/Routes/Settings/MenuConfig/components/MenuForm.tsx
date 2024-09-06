/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef } from 'react';
import { Translate, t } from 'app/I18N';
import { InputField, Select, OptionSchema } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { Button, Card } from 'app/V2/Components/UI';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { createRowId, Link } from '../shared';

interface MenuFormProps {
  closePanel: () => void;
  linkToEdit?: Link & { parentId?: string };
  links?: Link[];
  submit: (formValues: Link[]) => void;
}

const updateLinks = (
  formData: Link & { select?: string },
  currentLinks?: Link[],
  parentId?: string
) => {
  const { select: selectedGroup, ...newData } = formData;

  if (newData.rowId === 'NEW_ITEM') {
    const updatedLinks = [...(currentLinks || [])];

    newData.rowId = createRowId();

    if (selectedGroup) {
      updatedLinks[updatedLinks.findIndex(link => link.rowId === selectedGroup)].subRows?.push(
        newData
      );
    } else {
      updatedLinks.push(newData);
    }

    return updatedLinks;
  }

  switch (true) {
    case parentId && selectedGroup && parentId !== selectedGroup:
      return currentLinks?.map(link => {
        if (link.rowId === parentId) {
          return {
            ...link,
            subRows: link.subRows?.filter(subrow => subrow.rowId !== newData.rowId),
          };
        }
        if (link.rowId === selectedGroup) {
          return { ...link, subRows: [...(link.subRows || []), newData] };
        }
        return link;
      });

    case parentId && selectedGroup && parentId === selectedGroup:
      return currentLinks?.map(link => {
        if (link.rowId === selectedGroup) {
          return {
            ...link,
            subRows: link.subRows?.map(subrow => {
              if (subrow.rowId === newData.rowId) {
                return newData;
              }
              return subrow;
            }),
          };
        }
        return link;
      });

    case parentId && !selectedGroup:
      return [
        ...(currentLinks?.map(link => {
          if (link.rowId === parentId) {
            return {
              ...link,
              subRows: link.subRows?.filter(subrow => subrow.rowId !== newData.rowId),
            };
          }
          return link;
        }) || []),
        newData,
      ];

    case Boolean(!parentId && selectedGroup):
      return currentLinks?.reduce((acc, link) => {
        if (link.rowId !== newData.rowId && link.rowId !== selectedGroup) {
          acc.push(link);
        }
        if (link.rowId === selectedGroup) {
          acc.push({ ...link, subRows: [...(link.subRows || []), newData] });
        }
        return acc;
      }, [] as Link[]);

    case !parentId && !selectedGroup:
      return currentLinks?.map(link => {
        if (link.rowId === newData.rowId) {
          return newData;
        }
        return link;
      });

    default:
      return currentLinks;
  }
};

const MenuForm = ({ closePanel, submit, linkToEdit, links = [] }: MenuFormProps) => {
  const groups = useRef<OptionSchema[]>([
    { label: t('System', 'No Group', 'No Group', false), value: '', key: '-' },
  ]);

  useEffect(() => {
    links.forEach(link => {
      if (link.subRows) {
        groups.current.push({
          label: t('Menu', link.title, link.title, false),
          value: link.rowId!,
          key: link.rowId,
        });
      }
    });
    // it's only important to get groups on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Link & { select: string | undefined }>({
    values: {
      rowId: linkToEdit?.rowId || '',
      title: linkToEdit?.title || '',
      type: linkToEdit?.type || 'link',
      url: linkToEdit?.url || '',
      subRows: linkToEdit?.subRows || [],
      _id: linkToEdit?._id?.toString(),
      select: linkToEdit?.parentId,
    },
    mode: 'onSubmit',
  });

  const onSubmit = (formValues: Link & { select?: string }) => {
    const formData = formValues;

    if (!formData.rowId) {
      formData.rowId = 'NEW_ITEM';
    }

    if (formData.type === 'link') {
      delete formData.subRows;
    }

    const updatedLinks = updateLinks(formData, links, linkToEdit?.parentId);

    submit(updatedLinks || []);
  };

  const hostname = window?.location?.origin || '';

  return (
    <div className="relative h-full">
      <div className="p-4 mb-4 rounded-md border border-gray-50 shadow-sm bg-primary-100 text-primary-700">
        <div className="flex gap-1 items-center w-full text-base font-semibold">
          <div className="w-5 h-5 text-sm">
            <CheckCircleIcon />
          </div>
          <Translate>Using URLs</Translate>
        </div>
        <div className="force-ltr">
          <Translate>
            If it is an external URL, use a fully formed URL. Ie. http://www.uwazi.io.
          </Translate>
          <br />
          <Translate translationKey="Navigation menu tool tip part 1">
            If it is an internal URL within this website, be sure to delete the first part
          </Translate>{' '}
          ({hostname}),{' '}
          <Translate translationKey="Navigation menu tool tip part 2">
            leaving only a relative URL starting with a slash character. Ie. /some_url.
          </Translate>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} id="menu-form">
        <Card
          title={
            linkToEdit?.type === 'group' ? (
              <Translate>Group</Translate>
            ) : (
              <Translate>Link</Translate>
            )
          }
        >
          <div className="flex flex-col gap-4">
            <InputField
              id="link-title"
              data-testid="menu-form-link-title"
              label={<Translate>Title</Translate>}
              {...register('title', { required: true })}
              hasErrors={!!errors.title}
            />
            {linkToEdit?.type === 'link' && (
              <>
                <InputField
                  id="link-url"
                  data-testid="menu-form-link-url"
                  label={<Translate>URL</Translate>}
                  {...register('url', { required: true })}
                  hasErrors={!!errors.url}
                />
                <Select
                  id="link-group"
                  data-testid="menu-form-link-group"
                  label={<Translate>Group</Translate>}
                  {...register('select')}
                  options={groups.current}
                />
              </>
            )}
          </div>
        </Card>
      </form>
      <div className="flex absolute bottom-0 gap-2 px-4 py-3 w-full">
        <Button
          styling="light"
          onClick={closePanel}
          className="grow"
          data-testid="menu-form-cancel"
        >
          <Translate>Cancel</Translate>
        </Button>
        <Button className="grow" type="submit" form="menu-form" data-testid="menu-form-submit">
          {linkToEdit?.title ? <Translate>Update</Translate> : <Translate>Add</Translate>}
        </Button>
      </div>
    </div>
  );
};

export { MenuForm, updateLinks };
