import React from 'react';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
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

export interface GroupedGeolocationViewerProps {
  members: GroupMember[];
  colors: {
    [template: string]: string;
  };
}

const notLabeledOrMultiple = (member: GroupMember) =>
  member.value.length === 1 && !member.value[0].label;

const renderMemberInfo = (colors: { [template: string]: string }) => (member: GroupMember) =>
  notLabeledOrMultiple(member) ? (
    <dl key={`${member.translateContext}_${member.name}`}>
      <dt />
      <dd>
        <Pill
          key={`${member.value[0].lat}_${member.value[0].lon}`}
          color={colors[member.translateContext]}
        >
          {member.label}
        </Pill>
      </dd>
    </dl>
  ) : (
    <dl key={`${member.translateContext}_${member.name}`}>
      <dt>
        <span>{`${member.label}`}</span>
      </dt>
      <dd>
        {member.value.map(value => (
          <Pill key={`${value.lat}_${value.lon}`} color={colors[member.translateContext]}>
            {value.label}
          </Pill>
        ))}
      </dd>
    </dl>
  );

const GroupedGeolocationViewerComponent = (props: GroupedGeolocationViewerProps) => {
  const markers = props.members.reduce<GeolocationMarker[]>((flat: GeolocationMarker[], member) => {
    if (notLabeledOrMultiple(member)) {
      return flat.concat([
        {
          ...member.value[0],
          label: member.label,
          color: props.colors[member.translateContext],
        },
      ]);
    }

    return flat.concat(
      member.value.map(v => ({ ...v, color: props.colors[member.translateContext] }))
    );
  }, []);

  return (
    <>
      <GeolocationViewer points={markers} onlyForCards={false} />
      {props.members.map(renderMemberInfo(props.colors))}
    </>
  );
};

const colorsMap = createSelector(
  (s: IStore) => s.templates,
  templates =>
    templates.reduce(
      (map, template) => ({
        ...map,
        [ensure<string>(template?.get('_id'))]: template?.get('color'),
      }),
      {}
    )
);

const mapStateToProps = (state: IStore) => ({
  colors: colorsMap(state),
});

export const GroupedGeolocationViewer = connect(mapStateToProps)(GroupedGeolocationViewerComponent);
