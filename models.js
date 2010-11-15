var mongoose = require('mongoose').Mongoose;

mongoose.model('Document', {
  properties: ['title', 'data', 'tags', 'user_id'],

  indexes: [
    'title',
    'user_id'
  ]
});

exports.Document = function(db) {
  return db.model('Document');
};

