
// Run $ expresso

// Force test environment
process.env.NODE_ENV = 'test';

var app = require('../app'),
    assert = require('assert');

module.exports = {
  'Test registration': function(beforeExit) {
    assert.response(app, {
        url: '/users.json',
        method: 'POST',
        data: JSON.stringify({ user: { email: 'alex@example.com', password: 'test' } }),
        headers: { 'Content-Type': 'application/json' }
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      },

      function(res) {
        var user = JSON.parse(res.body);
        assert.equal('alex@example.com', user.email);
      }
    );
  },

  'Test login': function(beforeExit) {
    assert.response(app, {
        url: '/sessions',
        method: 'POST',
        data: JSON.stringify({ user: { email: 'alex@example.com', password: 'test' } }),
        headers: { 'Content-Type': 'application/json' }
      }, {
        status: 302,
        headers: { 'location': '/documents' }
      }
    );
  },

  'Test document index': function(beforeExit) {
    assert.response(app, {
        url: '/documents.json',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        status: 200,
      },

      function (res) {
        console.log(res.body);
      }
    );
  },

  'POST /documents.json': function(beforeExit) {
    assert.response(app, {
        url: '/documents.json',
        method: 'POST',
        data: JSON.stringify({ d: { title: 'Test' } }),
        headers: { 'Content-Type': 'application/json' }
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      },

      function(res) {
        var d = JSON.parse(res.body);
        assert.equal('Test', d.title);
      }
    );
  },

  'HTML POST /documents': function(beforeExit) {
    assert.response(app, {
        url: '/documents',
        method: 'POST',
        data: 'd[title]=test',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, {
        status: 302,
        headers: { 'Content-Type': 'text/plain' }
      });
  },

  'GET /documents/id.json': function(beforeExit) {
  },

  'GET /documents.json and delete them all': function(beforeExit) {
    assert.response(app,
      { url: '/documents.json' },
      { status: 200, headers: { 'Content-Type': 'application/json' }},
      function(res) {
        var documents = JSON.parse(res.body);
        assert.type(documents, 'object');

        documents.forEach(function(data) {
          app.Document.findById(data._id, function(d) {
            d.remove();
          });
        });
      });
  },

  'GET /': function(beforeExit) {
    assert.response(app,
      { url: '/' },
      { status: 302 },
      function(res) {
        process.exit();
      });
  }
};

