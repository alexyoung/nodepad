var app = require(__dirname + '/../app'),
    assert = require('assert'),
    tobi = require('tobi'),
    testHelper = require('./helper'),
    browser = tobi.createBrowser(app);

describe('Sign in', function() {
  before(function(done) {
    testHelper.clear([app.User], function() {
      var user = new app.User({'email' : 'alex@example.com', 'password' : 'test' });
      user.save(done);
      console.log('done');
    });
  });

  after(function(done) {
    app.close();
    done();
  });

  it('should allow valid users to sign in', function(done) {
    // FIXME: tobi doesn't seem to work at the moment
    browser.get('/sessions/new', function(res, $) {
      console.log('got / page');
      // Fill email, password and submit form
      $('form#login')
        .fill('user[email]', 'alex@example.com')
        .fill('user[password]', 'test')
        .submit(function(res, $) {
          console.log('form submitted');
          // Form submitted, new page loaded.
          assert.equal(browser.text('#header a.destroy'), 'Log Out');
          testHelper.end();
          done();
        });
    });
  });
});
