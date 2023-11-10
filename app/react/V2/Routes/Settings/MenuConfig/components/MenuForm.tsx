/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';

import { Translate, t } from 'app/I18N';
import { InputField, Select, OptionSchema } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { ClientSettingsLinkSchema } from 'app/apiResponseTypes';
import { Button, Card } from 'app/V2/Components/UI';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

type SettingsLinkForm = ClientSettingsLinkSchema & { groupId?: string };

interface MenuFormProps {
  closePanel: () => void;
  link?: ClientSettingsLinkSchema & { groupId?: string };
  links?: ClientSettingsLinkSchema[];
  submit: (formValues: ClientSettingsLinkSchema[]) => void;
}

const MenuForm = ({ closePanel, submit, link, links = [] }: MenuFormProps) => {
  const [groups, setGroups] = useState<OptionSchema[]>([]);
  useEffect(() => {
    if (links) {
      const _groups = links
        .filter(_link => _link.type === 'group' && _link.title && _link._id)
        .map(_link => ({
          label: t('Menu', _link.title, _link.title, false),
          value: _link._id?.toString(),
          key: _link._id?.toString(),
        })) as OptionSchema[];

      const emptyGroup = { label: t('System', 'No Group', 'No Group', false), value: '', key: '-' };
      setGroups([emptyGroup, ..._groups]);
    }
  }, [links]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsLinkForm>({
    values: {
      title: link?.title || '',
      type: link?.type || 'link',
      url: link?.url || '',
      sublinks: link?.sublinks,
      _id: link?._id?.toString(),
      groupId: link?.groupId?.toString(),
    },
    mode: 'onSubmit',
  });

  const onSubmit = (formValues: SettingsLinkForm) => {
    const { groupId, ...linkData } = formValues;
    let currentLinks = [...links] || [];

    if (linkData.type === 'link') {
      delete linkData.sublinks;
    }

    if (!groupId) {
      let linkIndex = currentLinks.findIndex(_link => _link._id === linkData._id);
      linkIndex = linkIndex === -1 ? currentLinks.length : linkIndex;
      currentLinks[linkIndex] = linkData;
    }

    currentLinks = currentLinks.map(_link => {
      if (!_link.sublinks) {
        return _link;
      }

      if (_link._id !== groupId) {
        return {
          ..._link,
          sublinks: _link.sublinks.filter(sublink => sublink._id !== linkData._id),
        };
      }

      let sublinkIndex = _link.sublinks.findIndex(sublink => sublink._id === linkData._id);
      sublinkIndex = sublinkIndex === -1 ? _link.sublinks.length : sublinkIndex;
      const sublinks = [..._link.sublinks];
      sublinks[sublinkIndex] = linkData;
      return { ..._link, sublinks };
    });
    submit(currentLinks);
  };

  return (
    <div className="relative h-full">
      <div className="p-4 mb-4 border rounded-md shadow-sm border-gray-50 bg-primary-100 text-primary-700">
        <div className="flex items-center w-full gap-1 text-base font-semibold">
          <div className="w-5 h-5 text-sm">
            <CheckCircleIcon />
          </div>
          <Translate>Using URLs</Translate>
        </div>
        <div className="">
          <Translate key="Settings menu tip">
            If it is an external URL, use a fully formed URL (including http://example.com or
            https://example.com). If it is an internal URL, use a relative URL (e.g. /page/123).
          </Translate>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} id="menu-form">
        <Card
          title={
            link?.type === 'group' ? <Translate>Group</Translate> : <Translate>Link</Translate>
          }
        >
          <div className="flex flex-col gap-4">
            <InputField
              id="link-title"
              label={<Translate>Title</Translate>}
              {...register('title', { required: true })}
              hasErrors={!!errors.title}
            />
            {link?.type === 'link' && (
              <>
                <InputField
                  id="link-title"
                  label={<Translate>Url</Translate>}
                  {...register('url', { required: true })}
                  hasErrors={!!errors.url}
                />
                <Select
                  id="link-group"
                  label={<Translate>Group</Translate>}
                  {...register('groupId')}
                  options={groups}
                />
              </>
            )}
          </div>
        </Card>
      </form>
      <div className="absolute bottom-0 flex w-full gap-2">
        <Button styling="light" onClick={closePanel} className="grow">
          <Translate>Cancel</Translate>
        </Button>
        <Button className="grow" type="submit" form="menu-form">
          {link?.title ? <Translate>Update</Translate> : <Translate>Add</Translate>}
        </Button>
      </div>
    </div>
  );
};

export { MenuForm };
