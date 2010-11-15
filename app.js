var express = require('express'),
    app = module.exports = express.createServer(),
    mongoose = require('mongoose').Mongoose,
    db,
    Document;

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.logger({ format: ':method :uri' }));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = mongoose.connect('mongodb://localhost/nodepad-development');
});

app.configure('production', function() {
  app.use(express.logger());
  app.use(express.errorHandler()); 
  db = mongoose.connect('mongodb://localhost/nodepad-production');
});

app.configure('test', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = mongoose.connect('mongodb://localhost/nodepad-test');
});

app.Document = Document = require('./models.js').Document(db);

app.get('/', function(req, res) {
  res.render('index.jade', {
    locals: {
        title: 'Express'
    }
  });
});

// Document list
app.get('/documents.:format', function(req, res) {
  Document.find().all(function(documents) {
    switch (req.params.format) {
      case 'json':
        res.send(documents.map(function(d) {
          return d.__doc;
        }));
      break;

      default:
        res.render('documents/index.jade');
    }
  });
});

// Create document 
app.post('/documents.:format?', function(req, res) {
  var document = new Document(req.body['document']);
  document.save(function() {
    switch (req.params.format) {
      case 'json':
        res.send(document.__doc);
       break;

       default:
        res.redirect('/documents');
    }
  });
});

// Read document
app.get('/documents/:id.:format?', function(req, res) {
});

// Update document
app.put('/documents/:id.:format?', function(req, res) {
});

// Delete document
app.del('/documents/:id.:format?', function(req, res) {
});

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d, environment: %s", app.address().port, app.settings.env)
}
