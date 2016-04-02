export default function () {
  return Math.random().toString(36).substr(2);
}

export function mockID(uniqueID = 'unique_id') {
  spyOn(Math, 'random').and.returnValue({
    toString() {
      return {
        substr() {
          return uniqueID;
        }
      };
    }
  });
}
