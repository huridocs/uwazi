/* eslint-disable react/no-multi-comp */
import { connect, ConnectedProps } from 'react-redux';
import sift from 'sift';
import formatter from 'app/Metadata/helpers/formater';
import { IStore } from 'app/istore';
interface SectionProps {
  'show-if'?: string;
  children: JSX.Element;
}

const mapStateToProps = ({ entityView, templates, thesauris }: IStore) => ({
  entity: entityView.entity,
  templates,
  thesauri: thesauris,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = SectionProps & MappedProps;

const Section = ({ entity, templates, thesauri, children, 'show-if': showIf }: ComponentProps) => {
  const formattedEntity = formatter.prepareMetadata(entity.toJS(), templates, thesauri);
  const condition = JSON.parse(showIf as string);
  const filtered = formattedEntity.metadata.filter(sift(condition));
  return filtered.length > 0 ? children : null;
};

const container = connector(Section);
export { container as Section };
