/* eslint-disable react/no-multi-comp */
import { connect, ConnectedProps } from 'react-redux';
import sift from 'sift';
import { IStore } from 'app/istore';
import { logError } from '../utils';
interface EntitySectionProps {
  'show-if'?: string;
  children: JSX.Element;
}

const mapStateToProps = ({ entityView }: IStore) => ({
  entity: entityView.entity,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntitySectionProps & MappedProps;

const EntitySection = ({ entity, children, 'show-if': showIf }: ComponentProps) => {
  const jsEntity = entity.toJS();
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
