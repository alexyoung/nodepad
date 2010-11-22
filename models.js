var mongoose = require('mongoose').Mongoose;

mongoose.model('Document', {
  properties: ['title', 'data', 'tags', 'user_id'],

  indexes: [
    'title',
    'user_id'
  ],

  getters: {
    id: function() {
      return this._id.toHexString();
    }
  }
});

exports.Document = function(db) {
  return db.model('Document');
};

