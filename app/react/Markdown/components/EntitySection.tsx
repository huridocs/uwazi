/* eslint-disable react/no-multi-comp */
import { connect, ConnectedProps } from 'react-redux';
import sift from 'sift';
import { IStore } from 'app/istore';
import { UnwrapMetadataObject } from 'app/Metadata/actions/actions';
import { logError } from '../utils';
interface EntitySectionProps {
  'show-if'?: string;
  children: JSX.Element;
}

const mapStateToProps = ({ templates, entityView }: IStore) => ({
  entity: entityView.entity,
  templates,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntitySectionProps & MappedProps;

const EntitySection = ({ entity, templates, children, 'show-if': showIf }: ComponentProps) => {
  const jsEntity = entity.toJS();
  const template = templates.find(t => t?.get('_id') === jsEntity.template);
  const unwrappedMetadata = UnwrapMetadataObject(jsEntity.metadata, template.toJS());
  jsEntity.metadata = unwrappedMetadata;
  try {
    const condition = JSON.parse(showIf as string);
    const filtered = [jsEntity].filter(sift(condition));
    return filtered.length > 0 ? children : null;
  } catch (e) {
    logError(e, showIf);
    return null;
  }
};

const container = connector(EntitySection);
export { container as EntitySection };
