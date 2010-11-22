
// Run $ expresso

// Force test environment
process.env.NODE_ENV = 'test';

var app = require('../app'),
    assert = require('assert');

function createDocument(title, after) {
  var d = new app.Document({ title: title });
  d.save(function() {
    var lastID = d._id.toHexString();
    after(lastID);
  });
}

module.exports = {
  'POST /documents.json': function(beforeExit) {
    assert.response(app, {
        url: '/documents.json',
        method: 'POST',
        data: JSON.stringify({ document: { title: 'Test' } }),
        headers: { 'Content-Type': 'application/json' }
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      },

      function(res) {
        var document = JSON.parse(res.body);
        assert.equal('Test', document.title);
      }
    );
  },

  'HTML POST /documents': function(beforeExit) {
    assert.response(app, {
        url: '/documents',
        method: 'POST',
        data: 'document[title]=test',
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

        documents.forEach(function(d) {
          app.Document.findById(d._id, function(document) {
            document.remove();
          });
        });
      });
  },

  'GET /': function(beforeExit) {
    assert.response(app,
      { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res) {
        assert.includes(res.body, '<title>Express</title>');
        process.exit();
      });
  }
};

