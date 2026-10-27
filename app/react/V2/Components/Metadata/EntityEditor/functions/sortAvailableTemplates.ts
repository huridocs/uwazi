type AvailableTemplateOption = {
  searchLabel: string;
  value: string;
  color?: string;
};

const sortAvailableTemplates = (options: AvailableTemplateOption[], locale: string) =>
  [...options].sort((left, right) =>
    left.searchLabel.localeCompare(right.searchLabel, locale || 'en')
  );

export { sortAvailableTemplates };
export type { AvailableTemplateOption };
