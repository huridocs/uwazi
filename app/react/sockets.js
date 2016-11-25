import {store} from './store';
import {actions} from 'app/BasicReducer';
import io from 'socket.io-client';
const socket = io();

socket.on('templateUpdated', (template) => {
  store.dispatch(actions.update('templates', template));
});
