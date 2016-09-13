import {actions as formActions} from 'react-redux-form';

import ID from 'shared/uniqueID';

export function addLink() {
  return function (dispatch, getState) {
    let links = getState().settings.navlinksData.links.slice(0);
    const link = {title: `Item ${links.length + 1}`, localID: ID()};
    dispatch(formActions.push('settings.navlinksData.links', link));
  };
}

export function sortLink(originIndex, targetIndex) {
  return function (dispatch) {
    dispatch(formActions.move('settings.navlinksData.links', originIndex, targetIndex));
  };
}
