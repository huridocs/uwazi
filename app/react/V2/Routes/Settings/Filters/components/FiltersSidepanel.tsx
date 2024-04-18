import React, { useEffect, useState } from 'react';
import uniqueID from 'shared/uniqueID';
import { Translate } from 'app/I18N';
import { ClientTemplateSchema } from 'app/istore';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { InputField, MultiSelect } from 'V2/Components/Forms';

type FiltersSidepanelProps = {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (newFilter: ClientSettingsFilterSchema | undefined) => void;
  templates?: ClientTemplateSchema[];
};

const FiltersSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  onSave,
  templates,
}: FiltersSidepanelProps) => {
  const [newFilter, setNewFiter] = useState<ClientSettingsFilterSchema>();
  const [inputError, setInputError] = useState(false);
  const [selectError, setSelectError] = useState(false);
  const [selected, setSelected] = useState<string[]>();

  useEffect(
    () => () => {
      setNewFiter(undefined);
      setInputError(false);
      setSelectError(false);
      setSelected([]);
    },
    []
  );

  const options = templates?.map(template => ({
    label: template.name,
    value: template._id,
  }));

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toString().trim();
    if (value.length) {
      setNewFiter({ ...newFilter, name: value });
      setInputError(false);
    } else {
      setInputError(true);
    }
  };

  const handleSelectChange = (ids: string[]) => {
    if (ids.length) {
      setSelected(ids);
      setSelectError(false);
    } else {
      setSelectError(true);
    }
  };

  const handleSave = () => {
    const selectedTemplates = templates?.filter(template => selected?.includes(template._id));
    const items = selectedTemplates?.map(selectedTemplate => ({
      id: selectedTemplate._id,
      name: selectedTemplate.name,
    }));

    if (!newFilter?.name) {
      setInputError(true);
    }

    if (!items?.length) {
      setSelectError(true);
    }

    if (newFilter?.name && items?.length) {
      onSave({ id: uniqueID(), name: newFilter?.name, items });
      setShowSidepanel(false);
    }
  };

  return (
    <Sidepanel
      withOverlay
      isOpen={showSidepanel}
      closeSidepanelFunction={() => setShowSidepanel(false)}
      title={<Translate>Add group</Translate>}
    >
      <Sidepanel.Body>
        <Card title={<Translate>General Information</Translate>} className="mb-4">
          <InputField
            label={<Translate>Name</Translate>}
            id="group-name"
            onChange={handleInputChange}
            errorMessage={inputError && <Translate>This field is required</Translate>}
          />
        </Card>

        <Card title={<Translate>Entity types</Translate>} className="mb-4">
          <div className="flex flex-col gap-4">
            <MultiSelect
              label={<Translate>Entity types</Translate>}
              options={options || []}
              value={[]}
              hasErrors={selectError}
              onChange={handleSelectChange}
            />
            {selectError && (
              <Translate className="text-error-700">Entity types cannot be empty</Translate>
            )}
          </div>
        </Card>
      </Sidepanel.Body>
      <Sidepanel.Footer className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            className="flex-grow"
            type="button"
            styling="outline"
            onClick={() => {
              setShowSidepanel(false);
            }}
          >
            <Translate>Cancel</Translate>
          </Button>
          <Button
            className="flex-grow"
            type="button"
            disabled={inputError || selectError}
            onClick={() => handleSave()}
          >
            <Translate>Add</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { FiltersSidepanel };
