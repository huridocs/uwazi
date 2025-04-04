import React from 'react';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { Icon } from 'app/UI';
import { filterSidepanelAtom } from './filterSidepanelAtom';

const FilterSidepanelButton = () => {
  const setOpen = useSetAtom(filterSidepanelAtom);

  return (
    <Button
      className="leading-4 flex gap-2 items-center text-gray-800"
      styling="light"
      onClick={() => setOpen(true)}
    >
      <Icon icon="filter" />
      <Translate>Filters</Translate>
    </Button>
  );
};

export { FilterSidepanelButton };
