Math.uniqueID = () => Math.random().toString(36).substr(2);

export default function () {
  return Math.uniqueID();
}

export function mockID(uniqueID = 'unique_id') {
  jest.spyOn(Math, 'uniqueID').mockReturnValue(uniqueID);
}
