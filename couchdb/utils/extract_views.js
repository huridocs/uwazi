module.exports = function(doc, cb){
  if(doc._id.match(/_design/)){
    return cb(null, doc); //unmodified doc is passed through to the output
  }
  return cb(); //doc will not be in the output
}
