Math.uniqueID = () => {
  return Math.random().toString(36).substr(2);
};

export default function () {
  return Math.uniqueID();
}

export function mockID(uniqueID = 'unique_id') {
  spyOn(Math, 'uniqueID').and.returnValue(uniqueID);
}
