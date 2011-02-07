/**
  * Run with expresso test/app.test.js
  */

var app = require('../app'),
    assert = require('assert'),
    zombie = require('zombie'),
    events = require('events'),
    testHelper = require('./helper');

app.listen(3001);

testHelper.models = [app.User];

testHelper.setup(function() {
  // Fixtures
  var user = new app.User({'email' : 'alex@example.com', 'password' : 'test' });
  user.save(function() {
    testHelper.run(exports)
  });
});

testHelper.tests = {
  'test login': function() {
    zombie.visit('http://localhost:3001/', function(err, browser, status) {
      // Fill email, password and submit form
      browser.
        fill('user[email]', 'alex@example.com').
        fill('user[password]', 'test').
        pressButton('Log In', function(err, browser, status) {
          // Form submitted, new page loaded.
          assert.equal(browser.text('#header a.destroy'), 'Log Out');
          testHelper.end();
        });
    });
  }
};

