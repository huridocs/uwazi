jasmine.createSpyObj = (name, methodNames) => {
  let names = methodNames;
  if (Array.isArray(name)) {
    names = name;
  }

  let obj = {};

  for (let i = 0; i < names.length; i += 1) {
    obj[names[i]] = jasmine.createSpy(names[i]);
  }

  return obj;
};
