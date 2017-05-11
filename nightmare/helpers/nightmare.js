import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';

realMouse(Nightmare);

export default function createNightmare(width = 1100, height = 600) {
  const nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(width, height);

  nightmare.on('page', function (type, message, error) {
    fail(error);
  });

  nightmare.on('console', function (type, message) {
    if (message.match(/React\.createClass is deprecated|Accessing PropTypes via the main React package is deprecated/)) {
      return;
    }
    if (type === 'error') {
      fail(message);
    }
    if (type === 'log') {
      console.log(message);
    }
  });

  return nightmare;
}
