/* eslint-disable react/no-multi-comp */
import sift from 'sift';

interface EntitySectionProps {
  showIf: any;
  children: JSX.Element;
  data: any[];
}

// eslint-disable-next-line max-statements
const Section = ({ data, children, showIf: condition }: EntitySectionProps) => {
  const filtered = data.filter(sift(condition));
  return filtered.length > 0 ? children : null;
};

export { Section };
