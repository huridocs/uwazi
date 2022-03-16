/* eslint-disable react/no-multi-comp */
import sift from 'sift';

interface EntitySectionProps {
  showIf: any;
  children: JSX.Element;
  entities: any[];
}

// eslint-disable-next-line max-statements
const Section = ({ entities, children, showIf: condition }: EntitySectionProps) => {
  const filtered = entities.filter(sift(condition));
  return filtered.length > 0 ? children : null;
};

export { Section };
