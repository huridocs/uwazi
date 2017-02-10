export default (MongooseModel) => {
  return {
    save: (data) => {
      if (Array.isArray(data)) {
        let promises = data.map((entry) => {
          return MongooseModel.findOneAndUpdate({_id: entry._id}, entry, {new: true}).then(saved => saved.toObject());
        });
        return Promise.all(promises);
      }

      if (data._id) {
        return MongooseModel.findOneAndUpdate({_id: data._id}, data, {new: true}).then(saved => saved.toObject());
      }
      return MongooseModel.create(data).then(saved => saved.toObject());
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
