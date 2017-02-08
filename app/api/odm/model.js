export default (MongooseModel) => {
  return {
    save: (data) => {
      if (data._id) {
        return MongooseModel.findOneAndUpdate({_id: data._id}, data, {new: true});
      }
      return MongooseModel.create(data);
    },
    get: () => {
      return MongooseModel.find({}, {}, {lean: true});
    },
    getById: (id) => {
      return MongooseModel.findById(id, {}, {lean: true});
    },

    delete: (id) => {
      return MongooseModel.findOneAndRemove({_id: id});
    }
  };
};
