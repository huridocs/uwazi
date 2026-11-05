import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router';
import { useForm } from 'react-hook-form';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, Card } from '#V2/Components/UI/index.js';
import { InputField, Select } from '#V2/Components/Forms/index.js';
import { Translate, t } from '#app/I18N/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import {
  getSettings,
  saveSettings,
  type AIAssistantClientSettings,
  type AIAssistantProvider,
} from '#V2/api/aiAssistant/index.js';

type FormValues = {
  provider: AIAssistantProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

const providerOptions = [
  { value: 'bert-external', label: t('System', 'Bert (external service)', null, false) },
  { value: 'openai_compat', label: t('System', 'OpenAI compatible', null, false) },
  { value: 'anthropic', label: t('System', 'Anthropic', null, false) },
  { value: 'ollama', label: t('System', 'Ollama', null, false) },
];

const aiAssistantSettingsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [settings, error] = await getSettings(headers);
    if (error) {
      throw error;
    }
    return (
      settings ?? {
        provider: 'bert-external' as const,
        requiresPassword: true,
      }
    );
  };

const AIAssistantSettings = () => {
  const loaded = useLoaderData() as AIAssistantClientSettings;
  const { notify } = useRequestStatus();
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      provider: loaded.provider,
      apiKey: loaded.apiKey ?? '',
      baseUrl: loaded.baseUrl ?? '',
      model: loaded.model ?? '',
    },
  });

  const provider = watch('provider');
  const showLlmFields = provider !== 'bert-external';
  const fields = {
    provider: register('provider'),
    apiKey: register('apiKey'),
    model: register('model'),
    baseUrl: register('baseUrl'),
  };

  const submit = async (values: FormValues) => {
    const [saved, error] = await saveSettings({
      provider: values.provider,
      apiKey: values.apiKey || undefined,
      baseUrl: values.baseUrl || undefined,
      model: values.model || undefined,
    });

    if (error || !saved) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        error?.json?.prettyMessage || error?.message
      );
      return;
    }

    notify('success', t('System', 'Settings updated', null, false));
  };

  return (
    <div className="w-full h-full" data-testid="settings-ai-assistant">
      <SettingsContent>
        <SettingsContent.Header title="AI Assistant" />
        <SettingsContent.Body>
          <form id="ai-assistant-settings-form" onSubmit={handleSubmit(submit)}>
            <Card className="mb-4" title={<Translate>Provider</Translate>}>
              <p className="mb-4 text-sm text-ink-secondary">
                <Translate>
                  Bert stays available as the default provider. Other providers use an API key
                  stored on this collection.
                </Translate>
              </p>
              <Select
                id="ai-assistant-provider"
                label={<Translate>Provider</Translate>}
                options={providerOptions}
                name={fields.provider.name}
                onChange={fields.provider.onChange}
                onBlur={fields.provider.onBlur}
                ref={fields.provider.ref}
              />
            </Card>
            {showLlmFields ? (
              <Card className="mb-4" title={<Translate>Model</Translate>}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="ai-assistant-api-key"
                    type="password"
                    autoComplete="off"
                    label={<Translate>API key</Translate>}
                    name={fields.apiKey.name}
                    onChange={fields.apiKey.onChange}
                    onBlur={fields.apiKey.onBlur}
                    ref={fields.apiKey.ref}
                  />
                  <InputField
                    id="ai-assistant-model"
                    label={<Translate>Model</Translate>}
                    name={fields.model.name}
                    onChange={fields.model.onChange}
                    onBlur={fields.model.onBlur}
                    ref={fields.model.ref}
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      id="ai-assistant-base-url"
                      label={<Translate>Base URL</Translate>}
                      name={fields.baseUrl.name}
                      onChange={fields.baseUrl.onChange}
                      onBlur={fields.baseUrl.onBlur}
                      ref={fields.baseUrl.ref}
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="mb-4" title={<Translate>Bert</Translate>}>
                <p className="text-sm text-ink-secondary">
                  <Translate>
                    Bert uses the tenant service URL. Chat asks for the user password so Bert can
                    call Uwazi as that user.
                  </Translate>
                </p>
              </Card>
            )}
          </form>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-end">
            <Button type="submit" form="ai-assistant-settings-form" disabled={isSubmitting}>
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { AIAssistantSettings, aiAssistantSettingsLoader };
