import api from 'app/utils/api';

export default {
  getUserGroups(requestParams) {
    return api.get('usergroups', requestParams).then(response => response.json);
  },
  saveUserGroup(requestParams) {
    return api.post('usergroups', requestParams).then(response => response.json);
  },
  deleteUserGroup(requestParams) {
    return api.delete('usergroups', requestParams).then(response => response.json);
  },
};
