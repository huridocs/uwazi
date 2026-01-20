import { TargetTemplateStep } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/TargetTemplate/index.jsx';
import { SourceTemplateStep } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/SourceTemplate/index.jsx';
import { ExtractionConfigurationStep } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/ExtractionConfiguration/index.jsx';

const AddExtractorSteps: Record<
  number,
  {
    Body: () => JSX.Element;
    Footer: () => JSX.Element;
    title: () => JSX.Element;
    description: () => JSX.Element | string;
  }
> = {
  1: {
    Body: TargetTemplateStep.Body,
    Footer: TargetTemplateStep.Footer,
    title: TargetTemplateStep.title,
    description: TargetTemplateStep.description,
  },
  2: {
    Body: SourceTemplateStep.Body,
    Footer: SourceTemplateStep.Footer,
    title: SourceTemplateStep.title,
    description: SourceTemplateStep.description,
  },
  3: {
    Body: ExtractionConfigurationStep.Body,
    Footer: ExtractionConfigurationStep.Footer,
    title: ExtractionConfigurationStep.title,
    description: ExtractionConfigurationStep.description,
  },
};

export { AddExtractorSteps };
