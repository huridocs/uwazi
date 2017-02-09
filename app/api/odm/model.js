export default (MongooseModel) => {
  return {
    save: (data) => {
      if (data._id) {
        return MongooseModel.findOneAndUpdate({_id: data._id}, data, {new: true});
      }
      return MongooseModel.create(data);
    },

    get: (query) => {
      return MongooseModel.find(query, {}, {lean: true});
    },

    count: (condition) => {
      return MongooseModel.count(condition);
    },

    getById: (id) => {
      return MongooseModel.findById(id, {}, {lean: true});
    },

    delete: (id) => {
      return MongooseModel.findOneAndRemove({_id: id});
    }
  };
};
