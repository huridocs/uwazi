import {isClient} from 'app/utils';
import io from 'socket.io-client';

export default isClient ? io() : {};
