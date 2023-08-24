import React from 'react';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { connect, ConnectedProps } from 'react-redux';
import { createSelector } from 'reselect';
import { Translate } from 'app/I18N';
import { bindActionCreators, Dispatch } from 'redux';
import { IStore } from '../../istore';
import { ensure } from '../../../shared/tsUtils';
import { Pill } from './Pill';
import * as actions from '../../Relationships/actions/actions';

interface GeolocationMarker {
  lat: string;
  lon: string;
  label?: string;
  color?: string;
  relatedEntity?: any;
}

interface GroupMember {
  label: string;
  name: string;
  translateContext: string;
  value: GeolocationMarker[];
}

interface TemplatesInfo {
  [template: string]: {
    name: string;
    color: string;
  };
}

export interface GroupedGeolocationViewerProps {
  members: GroupMember[];
  templatesInfo: TemplatesInfo;
  selectConnection: Function;
  templateId: string;
}

const templatesMap = createSelector(
  (s: IStore) => s.templates,
  templates =>
    templates.reduce(
      (map, template) => ({
        ...map,
        [ensure<string>(template?.get('_id'))]: {
          name: template?.get('name'),
          color: template?.get('color'),
        },
      }),
      {}
    )
);

function mapDispatchToProps(dispatch: Dispatch<{}>) {
  return bindActionCreators(
    {
      selectConnection: actions.selectConnection,
    },
    dispatch
  );
}

const mapStateToProps = (state: IStore) => ({
  templatesInfo: templatesMap(state),
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type mappedProps = ConnectedProps<typeof connector> & GroupedGeolocationViewerProps;

const notLabeledOrMultiple = (member: GroupMember) =>
  member.value.length === 1 && !member.value[0].label;

const pillColor = (member: GroupMember, templatesInfo: TemplatesInfo, templateId: string) =>
  templatesInfo[member.translateContext]?.color || templatesInfo[templateId].color;

const getFirstGroupInfo = (
  members: GroupMember[],
  templatesInfo: TemplatesInfo,
  templateId: string
) => (
  <dl
    className="pills-container"
    key={members.map(member => `${member.translateContext}_${member.name}`).join(',')}
  >
    <dt />
    <dd>
      {members.map(member => (
        <Pill
          key={`${member.value[0].lat}_${member.value[0].lon}`}
          color={pillColor(member, templatesInfo, templateId)}
        >
          <Translate context={templateId}>{member.label}</Translate>
        </Pill>
      ))}
    </dd>
  </dl>
);

const getMultiMemberInfo =
  (
    templatesInfo: TemplatesInfo,
    selectConnection: mappedProps['selectConnection'],
    templateId: string
  ) =>
  (member: GroupMember) => (
    <dl className="pills-container" key={`${member.translateContext}_${member.name}`}>
      <dt>
        <span>
          <Translate context={templateId}>{member.label}</Translate>
          {templatesInfo[member.translateContext]?.name && (
            <>
              {' ('}
              <Translate>linked</Translate>{' '}
              <Translate context={templateId}>
                {templatesInfo[member.translateContext].name}
              </Translate>
              {') '}
            </>
          )}
        </span>
      </dt>
      <dd>
        {member.value.map(value => (
          <div
            key={`${value.lat}_${value.lon}`}
            onClick={() => value.relatedEntity && selectConnection(value.relatedEntity)}
            style={{ cursor: value.relatedEntity ? 'pointer' : 'default' }}
          >
            <Pill
              key={`${value.lat}_${value.lon}`}
              color={pillColor(member, templatesInfo, templateId)}
            >
              <Translate context={member.translateContext}>{value.label || ''}</Translate>
            </Pill>
          </div>
        ))}
      </dd>
    </dl>
  );

const computeRenderMemberGroups = (
  members: GroupMember[],
  templatesInfo: TemplatesInfo,
  selectConnection: mappedProps['selectConnection'],
  templateId: string
) => {
  const firstGroup: GroupMember[] = [];
  const restOfGroups: GroupMember[] = [];

  members.forEach(member => {
    if (notLabeledOrMultiple(member)) {
      firstGroup.push(member);
    } else {
      restOfGroups.push(member);
    }
  });

  return [
    firstGroup.length ? getFirstGroupInfo(firstGroup, templatesInfo, templateId) : null,
  ].concat(restOfGroups.map(getMultiMemberInfo(templatesInfo, selectConnection, templateId)));
};

// eslint-disable-next-line react/no-multi-comp
const GroupedGeolocationViewerComponent = (props: mappedProps) => {
  const markers = props.members.reduce<GeolocationMarker[]>((flat: GeolocationMarker[], member) => {
    if (notLabeledOrMultiple(member)) {
      return flat.concat([
        {
          ...member.value[0],
          label: member.label,
          color: pillColor(member, props.templatesInfo, props.templateId),
        },
      ]);
    }

    return flat.concat(
      member.value.map(v => ({
        ...v,
        color: pillColor(member, props.templatesInfo, props.templateId),
      }))
    );
  }, []);

  return (
    <>
      <GeolocationViewer points={markers} onlyForCards={false} />
      {computeRenderMemberGroups(
        props.members,
        props.templatesInfo,
        props.selectConnection,
        props.templateId
      )}
    </>
  );
};

export const GroupedGeolocationViewer = connector(GroupedGeolocationViewerComponent);
