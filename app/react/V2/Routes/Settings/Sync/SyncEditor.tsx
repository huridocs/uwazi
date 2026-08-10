/* eslint-disable max-statements */
import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { Translate, t } from '#app/I18N/index.js';
import * as SyncAPI from '#V2/api/settings/sync.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { InputField, Checkbox, MultiselectList } from '#V2/Components/Forms/index.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { Button, Card, ConfirmationModal } from '#V2/Components/UI/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';
import { SyncTemplateCard } from './components/SyncTemplateCard.js';
import {
  SyncDangerWarning,
  SyncActivateWarning,
  SyncRemoveTemplateWarning,
} from './components/SyncWarnings.js';
import type { SyncConfigForm, SyncConfigPublic, SyncTemplateConfig } from './types.js';

type SyncEditorLoaderData = {
  configs: SyncConfigPublic[];
  editing?: SyncConfigPublic;
  isNew: boolean;
};

type SyncFormValues = {
  name: string;
  url: string;
  username: string;
  password: string;
  active: boolean;
};

const emptyTemplateConfig = (): SyncTemplateConfig => ({
  properties: [],
  attachments: false,
});

const syncEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    const [configs, error] = await SyncAPI.getSync(headers);
    if (error) throw apiErrorToRequestError(error);
    const all = configs || [];
    const isNew = !params.name;
    const editing = isNew
      ? undefined
      : all.find(config => config.name === decodeURIComponent(params.name || ''));

    if (!isNew && !editing) {
      throw new Response('Sync target not found', { status: 404 });
    }

    return { configs: all, editing, isNew };
  };

const SyncEditor = () => {
  const { configs, editing, isNew } = useLoaderData() as SyncEditorLoaderData;
  const navigate = useNavigate();
  const params = useParams();
  const { notify } = useRequestStatus();
  const templates = useAtomValue(templatesAtom);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);

  const [templateConfig, setTemplateConfig] = useState<Record<string, SyncTemplateConfig>>(() => {
    const initial = editing?.config.templates || {};
    return Object.fromEntries(
      Object.entries(initial)
        .filter((entry): entry is [string, SyncTemplateConfig] => Boolean(entry[1]))
        .map(([id, value]) => [
          id,
          { properties: value.properties || [], attachments: value.attachments },
        ])
    );
  });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(() =>
    Object.keys(editing?.config.templates || {})
  );
  const [relationtypes, setRelationtypes] = useState<string[]>(
    () => editing?.config.relationtypes || []
  );
  const [pendingRemovalIds, setPendingRemovalIds] = useState<string[] | null>(null);
  const [pendingNextTemplateIds, setPendingNextTemplateIds] = useState<string[] | null>(null);
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);
  const [showSaveWarning, setShowSaveWarning] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SyncFormValues>({
    defaultValues: {
      name: editing?.name || '',
      url: editing?.url || '',
      username: '',
      password: '',
      active: editing?.active ?? false,
    },
    mode: 'onSubmit',
  });

  const active = watch('active');

  const templateOptions: MultiselectListOption[] = useMemo(
    () =>
      templates.map(template => ({
        value: template._id,
        label: template.name,
        searchLabel: template.name,
      })),
    [templates]
  );

  const relationtypeOptions: MultiselectListOption[] = useMemo(
    () =>
      relationshipTypes.map(type => ({
        value: type._id,
        label: type.name,
        searchLabel: type.name,
      })),
    [relationshipTypes]
  );

  const applyTemplateSelection = (nextIds: string[]) => {
    setSelectedTemplateIds(nextIds);
    setTemplateConfig(current => {
      const next = { ...current };
      nextIds.forEach(id => {
        if (!next[id]) {
          next[id] = emptyTemplateConfig();
        }
      });
      Object.keys(next).forEach(id => {
        if (!nextIds.includes(id)) {
          delete next[id];
        }
      });
      return next;
    });
  };

  const syncSelectedTemplates = (nextIds: string[]) => {
    const removed = selectedTemplateIds.filter(id => !nextIds.includes(id));
    if (removed.length) {
      setPendingRemovalIds(removed);
      setPendingNextTemplateIds(nextIds);
      return;
    }
    applyTemplateSelection(nextIds);
  };

  const confirmRemoveTemplate = () => {
    if (!pendingNextTemplateIds) {
      setPendingRemovalIds(null);
      return;
    }
    applyTemplateSelection(pendingNextTemplateIds);
    setPendingRemovalIds(null);
    setPendingNextTemplateIds(null);
  };

  const buildPayload = (values: SyncFormValues): SyncConfigForm => {
    const payload: SyncConfigForm = {
      name: values.name.trim(),
      url: values.url.trim(),
      active: values.active,
      config: {
        templates: Object.fromEntries(
          selectedTemplateIds.map(id => [id, templateConfig[id] || emptyTemplateConfig()])
        ),
        relationtypes,
      },
    };

    if (values.username.trim()) {
      payload.username = values.username.trim();
    }
    if (values.password) {
      payload.password = values.password;
    }

    return payload;
  };

  const saveConfigs = async (values: SyncFormValues) => {
    if (isNew && (!values.username.trim() || !values.password)) {
      notify(
        'error',
        t('System', 'Username and password are required for new sync targets', null, false)
      );
      return;
    }

    const nextConfig = buildPayload(values);
    const withoutCurrent = configs.filter(
      config => config.name !== (editing?.name || nextConfig.name)
    );
    const nameClash = withoutCurrent.some(config => config.name === nextConfig.name);
    if (nameClash) {
      notify('error', t('System', 'A sync target with this name already exists', null, false));
      return;
    }

    const next = [...withoutCurrent, nextConfig];
    const [, error] = await SyncAPI.saveSync(next);
    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
      return;
    }

    notify('success', t('System', 'Saved successfully.', null, false));
    await navigate('/settings/sync');
  };

  const onSubmit = async (values: SyncFormValues) => {
    if (values.active !== (editing?.active ?? false)) {
      setPendingActive(values.active);
      return;
    }
    setShowSaveWarning(true);
  };

  const confirmSave = async () => {
    setShowSaveWarning(false);
    await saveConfigs(getValues());
  };

  const confirmActiveChange = async () => {
    if (pendingActive === null) return;
    setValue('active', pendingActive);
    setPendingActive(null);
    setShowSaveWarning(true);
  };

  return (
    <div className="h-full w-full overflow-y-auto" data-testid="settings-sync-editor">
      <SettingsContent>
        <SettingsContent.Header
          title={isNew ? 'New sync target' : editing?.name || params.name}
          path={new Map([['Sync', '/settings/sync']])}
        />
        <SettingsContent.Body>
          <div className="mb-4">
            <SyncDangerWarning />
          </div>

          <form
            id="sync-editor-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Card title={<Translate>Connection</Translate>}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  id="sync-name"
                  label={<Translate>Name</Translate>}
                  disabled={!isNew}
                  hasErrors={Boolean(errors.name)}
                  {...register('name', { required: true })}
                />
                <InputField
                  id="sync-url"
                  label={<Translate>Remote URL</Translate>}
                  hasErrors={Boolean(errors.url)}
                  {...register('url', { required: true })}
                />
                <InputField
                  id="sync-username"
                  label={
                    isNew ? (
                      <Translate>Username</Translate>
                    ) : (
                      <Translate>Username (leave blank to keep current)</Translate>
                    )
                  }
                  autoComplete="off"
                  hasErrors={Boolean(errors.username)}
                  {...register('username', { required: isNew })}
                />
                <InputField
                  id="sync-password"
                  type="password"
                  label={
                    isNew ? (
                      <Translate>Password</Translate>
                    ) : (
                      <Translate>Password (leave blank to keep current)</Translate>
                    )
                  }
                  autoComplete="off"
                  hasErrors={Boolean(errors.password)}
                  {...register('password', { required: isNew })}
                />
              </div>
              <div className="mt-4">
                <Checkbox
                  name="sync-active"
                  checked={active}
                  onChange={event => setValue('active', event.currentTarget.checked)}
                  label={<Translate>Active</Translate>}
                />
                {!isNew && editing?.status && (
                  <p className="mt-2 text-sm text-ink-secondary">
                    <Translate>Pending changes</Translate>: {editing.status.pendingChanges}
                  </p>
                )}
              </div>
            </Card>

            <Card title={<Translate>Templates</Translate>}>
              <p className="mb-3 text-sm text-ink-secondary">
                <Translate>
                  Select templates to synchronize. Configure which properties to include on each
                  card.
                </Translate>
              </p>
              <div className="mb-4 h-72">
                <MultiselectList
                  items={templateOptions}
                  selectedValues={selectedTemplateIds}
                  onChange={syncSelectedTemplates}
                  checkboxes
                  allowSelelectAll
                  label={<Translate>Available templates</Translate>}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {selectedTemplateIds.map(templateId => (
                  <SyncTemplateCard
                    key={templateId}
                    templateId={templateId}
                    config={templateConfig[templateId] || emptyTemplateConfig()}
                    onChange={next =>
                      setTemplateConfig(current => ({ ...current, [templateId]: next }))
                    }
                    onRemove={() => {
                      const nextIds = selectedTemplateIds.filter(id => id !== templateId);
                      setPendingRemovalIds([templateId]);
                      setPendingNextTemplateIds(nextIds);
                    }}
                  />
                ))}
              </div>
            </Card>

            <Card title={<Translate>Relationship types</Translate>}>
              <div className="h-64">
                <MultiselectList
                  items={relationtypeOptions}
                  selectedValues={relationtypes}
                  onChange={setRelationtypes}
                  checkboxes
                  allowSelelectAll
                  label={<Translate>Relationship types to sync</Translate>}
                />
              </div>
            </Card>
          </form>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => navigate('/settings/sync')}
            >
              <Translate>Cancel</Translate>
            </Button>
            <Button type="submit" form="sync-editor-form">
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

      {pendingRemovalIds && (
        <ConfirmationModal
          header="Remove template from sync"
          warningText={<SyncRemoveTemplateWarning />}
          body={
            <Translate>
              Are you sure you want to stop synchronizing the selected template(s)?
            </Translate>
          }
          onAcceptClick={confirmRemoveTemplate}
          onCancelClick={() => {
            setPendingRemovalIds(null);
            setPendingNextTemplateIds(null);
          }}
          dangerStyle
        />
      )}

      {pendingActive !== null && (
        <ConfirmationModal
          header={pendingActive ? 'Activate sync' : 'Deactivate sync'}
          warningText={<SyncActivateWarning activating={pendingActive} />}
          body={
            <Translate>Confirm changing the active state, then save the configuration.</Translate>
          }
          onAcceptClick={confirmActiveChange}
          onCancelClick={() => setPendingActive(null)}
          dangerStyle
        />
      )}

      {showSaveWarning && (
        <ConfirmationModal
          header="Save sync configuration"
          warningText={
            <Translate>
              Saving sync settings can affect data on the remote instance. Only continue if you
              understand the impact.
            </Translate>
          }
          body={<Translate>Do you want to save these sync settings?</Translate>}
          onAcceptClick={confirmSave}
          onCancelClick={() => setShowSaveWarning(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { SyncEditor, syncEditorLoader };
