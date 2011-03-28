
desc('Saves all documents to generate keywords');
task('index', [], function() {
  app = require('./app');

  app.Document.find({}, function(err, documents) {
    documents.forEach(function(d) {
      console.log(d._id);
      d.save();
    });
  });
});
