import React from 'react';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Translate } from 'app/I18N';
import { IStore } from '../../istore';
import { ensure } from '../../../shared/tsUtils';
import { Pill } from './Pill';

interface GeolocationMarker {
  lat: string;
  lon: string;
  label?: string;
  color?: string;
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
}

const notLabeledOrMultiple = (member: GroupMember) =>
  member.value.length === 1 && !member.value[0].label;

const getFirstGroupInfo = (members: GroupMember[], templatesInfo: TemplatesInfo) => (
  <dl key={members.map(member => `${member.translateContext}_${member.name}`).join(',')}>
    <dt />
    <dd>
      {members.map(member => (
        <Pill
          key={`${member.value[0].lat}_${member.value[0].lon}`}
          color={templatesInfo[member.translateContext].color}
        >
          <Translate context={member.translateContext}>{member.label}</Translate>
        </Pill>
      ))}
    </dd>
  </dl>
);

const getMultiMemberInfo = (templatesInfo: TemplatesInfo) => (member: GroupMember) => (
  <dl key={`${member.translateContext}_${member.name}`}>
    <dt>
      <span>
        <Translate context={member.translateContext}>{member.label}</Translate>
        <> (</>
        <Translate>linked</Translate>
        <> </>
        <Translate context={member.translateContext}>
          {templatesInfo[member.translateContext].name}
        </Translate>
        <>)</>
      </span>
    </dt>
    <dd>
      {member.value.map(value => (
        <Pill
          key={`${value.lat}_${value.lon}`}
          color={templatesInfo[member.translateContext].color}
        >
          <Translate context={member.translateContext}>{value.label || ''}</Translate>
        </Pill>
      ))}
    </dd>
  </dl>
);

const computeRenderMemberGroups = (members: GroupMember[], templatesInfo: TemplatesInfo) => {
  const firstGroup: GroupMember[] = [];
  const restOfGroups: GroupMember[] = [];

  members.forEach(member => {
    if (notLabeledOrMultiple(member)) {
      firstGroup.push(member);
    } else {
      restOfGroups.push(member);
    }
  });

  return [getFirstGroupInfo(firstGroup, templatesInfo)].concat(
    restOfGroups.map(getMultiMemberInfo(templatesInfo))
  );
};

// eslint-disable-next-line react/no-multi-comp
const GroupedGeolocationViewerComponent = (props: GroupedGeolocationViewerProps) => {
  const markers = props.members.reduce<GeolocationMarker[]>((flat: GeolocationMarker[], member) => {
    if (notLabeledOrMultiple(member)) {
      return flat.concat([
        {
          ...member.value[0],
          label: member.label,
          color: props.templatesInfo[member.translateContext].color,
        },
      ]);
    }

    return flat.concat(
      member.value.map(v => ({ ...v, color: props.templatesInfo[member.translateContext].color }))
    );
  }, []);

  return (
    <>
      <GeolocationViewer points={markers} onlyForCards={false} />
      {computeRenderMemberGroups(props.members, props.templatesInfo)}
    </>
  );
};

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

const mapStateToProps = (state: IStore) => ({
  templatesInfo: templatesMap(state),
});

export const GroupedGeolocationViewer = connect(mapStateToProps)(GroupedGeolocationViewerComponent);
