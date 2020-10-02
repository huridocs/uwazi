import React from 'react';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { connect } from 'react-redux';
import { IStore } from '../../istore';
import { createSelector } from 'reselect';
import { ensure } from '../../../shared/tsUtils';

interface GeolocationMarker {
  lat: string;
  lon: string;
  label: string;
  color: string;
}

interface GroupMember {
  label: string;
  translateContext: string;
  value: GeolocationMarker[];
}

interface GroupedGeolocationViewerProps {
  members: GroupMember[];
  colors: {
    [template:string]: string;
  };
}

const notInherited = (member: GroupMember) => member.value.length === 1 && !member.value[0].label;

const Pill = (props: {children: string, color: string}) => (<span className="pill" style={{backgroundColor: props.color}}>{props.children}</span>);

const renderGroupInfo = (colors: {
  [template:string]: string;
}) => (member: GroupMember) => {
  return notInherited(member) ? (
    <dl>
      <dt></dt>
      <dd>
          <Pill color={colors[member.translateContext]}>{member.label}</Pill>
      </dd>
    </dl>
  ) : (
    <dl>
      <dt><span>{`${member.label}`}</span></dt>
      <dd>
        {member.value.map(value => <Pill color={colors[member.translateContext]}>{value.label}</Pill>)}
      </dd>
    </dl>
  );
};

const GroupedGeolocationViewerComponent = (props: GroupedGeolocationViewerProps) => {
  const markers = props.members.reduce(
    (flat: GeolocationMarker[], member) => {
      if (notInherited(member)) {
        return flat.concat([{
          ...member.value[0],
          label: member.label,
          color: props.colors[member.translateContext],
        }]);
      }

      return flat.concat(member.value.map(v => ({ ...v, color: props.colors[member.translateContext] })))
    },
    []
  );
  debugger;
  return (
    <>
      <GeolocationViewer points={markers} onlyForCards={false} />
      {props.members.map(renderGroupInfo(props.colors))}
    </>
  );
};

const colorsMap = createSelector((s: IStore) => s.templates, templates => {
  return templates.reduce((map, template) => {
    return {
      ...map,
      [ensure<string>(template?.get('_id'))]: template?.get('color'),
    }
  }, {});
})

const mapStateToProps = (state: IStore) => {
  return {
    colors: colorsMap(state),
  }
};

export const GroupedGeolocationViewer = connect(mapStateToProps)(GroupedGeolocationViewerComponent);