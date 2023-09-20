/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';

import { Translate } from 'app/I18N';
import { InputField, Select, OptionSchema } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { ClientSettingsLinkSchema } from 'app/apiResponseTypes';
import { Button, Card } from 'app/V2/Components/UI';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

type SettingsLinkForm = ClientSettingsLinkSchema & { groupId?: string };

interface MenuFormProps {
  closePanel: () => void;
  link?: ClientSettingsLinkSchema;
  links?: ClientSettingsLinkSchema[];
  submit: (formValues: SettingsLinkForm) => void;
}

const MenuForm = ({ closePanel, submit, link, links = [] }: MenuFormProps) => {
  const [groups, setGroups] = useState<OptionSchema[]>([]);

  useEffect(() => {
    if (links) {
      const _groups = links
        .filter(_link => _link.type === 'group' && _link.title && _link._id)
        .map(_link => ({
          label: <Translate context="Menu">{_link.title}</Translate>,
          value: _link._id?.toString(),
          key: _link._id?.toString(),
        })) as OptionSchema[];

      const emptyGroup = { label: <Translate>No group</Translate>, value: '', key: '-' };
      setGroups([emptyGroup, ..._groups]);
    }
  }, [links]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsLinkForm>({
    defaultValues: { ...link, _id: link?._id?.toString() },
    mode: 'onSubmit',
  });

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
      <form onSubmit={handleSubmit(submit)} id="menu-form">
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
          <Translate>Add</Translate>
        </Button>
      </div>
    </div>
  );
};

export { MenuForm };
