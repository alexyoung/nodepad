// Force test environment
process.env.NODE_ENV = 'test';
var state = {
  models: []
};

function prepare(models, next) {
  var modelCount = models.length;
  models.forEach(function(model) {
    modelCount--;
    model.find({}, function(err, records) {
      var count = records.length;
      records.forEach(function(result) {
        result.remove();
        count--;
      });
      if (count === 0 && modelCount === 0) next();
    });
  });
};

module.exports = {
  clear: function(models, next) {
    prepare(models, next);
  }
};
