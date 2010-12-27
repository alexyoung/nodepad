var mongoose = require('mongoose@0.0.4').Mongoose,
    crypto = require('crypto');

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

mongoose.model('User', {
  properties: ['email', 'hashed_password', 'salt'],

  indexes: [
    [{ email: 1 }, { unique: true }]
  ],

  getters: {
    id: function() {
      return this._id.toHexString();
    },

    password: function() { return this._password; }
  },

  setters: {
    password: function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    }
  },

  methods: {
    authenticate: function(plainText) {
      return this.encryptPassword(plainText) === this.hashed_password;
    },

    makeSalt: function() {
      return Math.round((new Date().valueOf() * Math.random())) + '';
    },

    encryptPassword: function(password) {
      return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    },

    isValid: function() {
      // TODO: Better validation
      return this.email && this.email.length > 0 && this.email.length < 255
             && this.password && this.password.length > 0 && this.password.length < 255;
    },

    save: function(okFn, failedFn) {
      if (this.isValid()) {
        this.__super__(okFn);
      } else {
        failedFn();
      }
    }
  }
});

exports.User = function(db) {
  return db.model('User');
};

exports.Document = function(db) {
  return db.model('Document');
};

