module.exports = function(doc, cb){
  if(doc._id.match(/_design/)){
    doc._deleted = true;
    return cb(null, doc);
  }
  return cb(); //doc will not be in the output
}
