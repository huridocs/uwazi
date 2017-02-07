export default (MongooseModel) => {
  return {
    save: MongooseModel.create.bind(MongooseModel),
    get: MongooseModel.find.bind(MongooseModel)
  };
  //not exists
  //console.log(MongooseModel.save);
  //console.log(MongooseModel.delete);
  //exists
  //console.log(MongooseModel.find);
  //console.log(MongooseModel.findById);
};
