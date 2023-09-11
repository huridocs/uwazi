import React, { useEffect, useState } from 'react';
import api from 'app/utils/api';
import { useRevalidator } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';

import { notificationAtom } from 'app/V2/atoms';

import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { SettingsLinkSchema } from 'shared/types/settingsType';
import { Button, Card, CopyValueInput } from 'app/V2/Components/UI';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface MenuFormProps {
  closePanel: () => void;
  link?: SettingsLinkSchema;
  links?: SettingsLinkSchema[];
}

const MenuForm = ({ closePanel, link, links }: MenuFormProps) => {
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();

  const [groups, setGroups] = useState<SettingsLinkSchema[]>([]);

  useEffect(() => {
    if (links) {
      const _groups = links.filter(_link => _link.type === 'group');
      setGroups(_groups);
    }
  }, [links]);

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<SettingsLinkSchema>({
    defaultValues: link,
    mode: 'onSubmit',
  });

  const submit = async () => {
    revalidator.revalidate();
    closePanel();
    setNotifications({
      type: 'success',
      text: <Translate>Updated</Translate>,
    });
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
      <form onSubmit={handleSubmit(submit)} id="menu-form">
        <Card
          title={
            link?.type === 'group' ? <Translate>Group</Translate> : <Translate>Link</Translate>
          }
        >
          <div className="flex flex-col gap-4">
            <InputField id="link-title" label={<Translate>Title</Translate>} value={link?.title} />
            {link?.type === 'link' && (
              <>
                <InputField id="link-title" label={<Translate>Url</Translate>} value={link?.url} />
                <Select
                  id="link-group"
                  label={<Translate>Group</Translate>}
                  options={groups.map(g => ({ key: g.title, value: g.title, selected: false }))}
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
          <Translate>Enable</Translate>
        </Button>
      </div>
    </div>
  );
};

export { MenuForm };
