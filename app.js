var express = require('express@1.0.0'),
    app = module.exports = express.createServer(),
    mongoose = require('mongoose@0.0.4').Mongoose,
    mongoStore = require('connect-mongodb@0.1.1'),
    markdown = require('markdown').markdown,
    sys = require('sys'),
    db,
    Document,
    User,
    LoginToken,
    Settings = { development: {}, test: {}, production: {} };

app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-development');
  app.use(express.errorHandler({ dumpExceptions: true }));  
});

app.configure('test', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-test');
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-production');
});

db = mongoose.connect(app.set('db-uri'));

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.bodyDecoder());
  app.use(express.cookieDecoder());
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(express.staticProvider(__dirname + '/public'));
});

app.Document = Document = require('./models.js').Document(db);
app.User = User = require('./models.js').User(db);
app.LoginToken = LoginToken = require('./models.js').LoginToken(db);

function authenticateFromLoginToken(req, res, next) {
  var cookie = JSON.parse(req.cookies.logintoken);

  LoginToken.find({ email: cookie.email,
                    series: cookie.series,
                    token: cookie.token })
            .first(function(token) {
    if (!token) {
      res.redirect('/sessions/new');
      return;
    }

    User.find({ email: token.email }).first(function(user) {
      if (user) {
        req.session.user_id = user.id;
        req.currentUser = user;

        token.token = token.randomToken();
        token.save(function() {
          res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          next();
        });
      } else {
        res.redirect('/sessions/new');
      }
    });
  });
}

function loadUser(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/sessions/new');
      }
    });
  } else if (req.cookies.logintoken) {
    authenticateFromLoginToken(req, res, next);
  } else {
    res.redirect('/sessions/new');
  }
}

app.get('/', loadUser, function(req, res) {
  res.redirect('/documents')
});

// Error handling
function NotFound(msg) {
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

app.get('/404', function(req, res) {
  throw new NotFound;
});

app.get('/500', function(req, res) {
  throw new Error('An expected error');
});

app.get('/bad', function(req, res) {
  unknownMethod();
});

app.error(function(err, req, res, next) {
  if (err instanceof NotFound) {
    res.render('404.jade', { status: 404 });
  } else {
    next(err);
  }
});

app.error(function(err, req, res) {
  res.render('500.jade', {
    status: 500,
    locals: {
      error: err
    } 
  });
});

// Document list
app.get('/documents.:format?', loadUser, function(req, res) {
  Document.find().all(function(documents) {
    switch (req.params.format) {
      case 'json':
        res.send(documents.map(function(d) {
          return d.__doc;
        }));
      break;

      default:
        res.render('documents/index.jade', {
          locals: { documents: documents, currentUser: req.currentUser }
        });
    }
  });
});

app.get('/documents/:id.:format?/edit', loadUser, function(req, res, next) {
  Document.findById(req.params.id, function(d) {
    if (!d) return next(new NotFound('Document not found'));
    res.render('documents/edit.jade', {
      locals: { d: d, currentUser: req.currentUser }
    });
  });
});

app.get('/documents/new', loadUser, function(req, res) {
  res.render('documents/new.jade', {
    locals: { d: new Document(), currentUser: req.currentUser }
  });
});

// Create document 
app.post('/documents.:format?', loadUser, function(req, res) {
  var d = new Document(req.body.d);
  d.save(function() {
    switch (req.params.format) {
      case 'json':
        res.send(d.__doc);
      break;

      default:
        req.flash('info', 'Document created');
        res.redirect('/documents');
    }
  });
});

// Read document
app.get('/documents/:id.:format?', loadUser, function(req, res, next) {
  Document.findById(req.params.id, function(d) {
    if (!d) return next(new NotFound('Document not found'));

    switch (req.params.format) {
      case 'json':
        res.send(d.__doc);
      break;

      case 'html':
        res.send(markdown.toHTML(d.data));
      break;

      default:
        res.render('documents/show.jade', {
          locals: { d: d, currentUser: req.currentUser }
        });
    }
  });
});

// Update document
app.put('/documents/:id.:format?', loadUser, function(req, res, next) {
  Document.findById(req.body.d.id, function(d) {
    if (!d) return next(new NotFound('Document not found'));

    d.title = req.body.d.title;
    d.data = req.body.d.data;
    d.save(function() {
      switch (req.params.format) {
        case 'json':
          res.send(d.__doc);
        break;

        default:
          req.flash('info', 'Document updated');
          res.redirect('/documents');
      }
    });
  });
});

// Delete document
app.del('/documents/:id.:format?', loadUser, function(req, res, next) {
  Document.findById(req.params.id, function(d) {
    if (!d) return next(new NotFound('Document not found'));

    d.remove(function() {
      switch (req.params.format) {
        case 'json':
          res.send('true');
        break;

        default:
          req.flash('info', 'Document deleted');
          res.redirect('/documents');
      } 
    });
  });
});

// Users
app.get('/users/new', function(req, res) {
  res.render('users/new.jade', {
    locals: { user: new User() }
  });
});

app.post('/users.:format?', function(req, res) {
  var password = req.body['user[password]'];
  var email = req.body['user[email]'];
  var user = new User({'email':email, 'password':password});

  function userSaved() {
    req.flash('info', 'Your account has been created');
    switch (req.params.format) {
      case 'json':
        res.send(user.__doc);
      break;

      default:
        req.session.user_id = user.id;
        res.redirect('/documents');
    }
  }

  function userSaveFailed() {
    req.flash('error', 'Account creation failed');
    res.render('users/new.jade', {
      locals: { user: user }
    });
  }

  user.save(userSaved, userSaveFailed);
});

// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new.jade', {
    locals: { user: new User() }
  });
});

app.post('/sessions', function(req, res) {
  User.find({ email: req.body.user.email }).first(function(user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;

      // Remember me
      if (req.body.remember_me) {
        var loginToken = new LoginToken({ email: user.email });
        loginToken.save(function() {
          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
        });
      }

      res.redirect('/documents');
    } else {
      req.flash('error', 'Incorrect credentials');
      res.redirect('/sessions/new');
    }
  }); 
});

app.get('/sessions', loadUser, function(req, res) {
  if (req.session) {
    LoginToken.remove({ email: req.currentUser.email }, function() {});
    res.clearCookie('logintoken');
    req.session.destroy(function() {});
  }
  res.redirect('/sessions/new');
});

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d, environment: %s", app.address().port, app.settings.env)
}
