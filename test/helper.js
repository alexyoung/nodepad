// Force test environment
process.env.NODE_ENV = 'test';
var state = {};

function prepare(models, next) {
  var modelCount = models.length;
  models.forEach(function(model) {
    modelCount--;
    model.find().all(function(records) {
      var count = records.length;
      records.forEach(function(result) {
        result.remove();
        count--;
      });
      if (count === 0 && modelCount === 0) next();
    });
  });
};

exports.tests = function(tests) {
  state.tests = tests;
};

exports.run = function(e) {
  for (var test in state.tests) {
    e[test] = state.tests[test];
  }
};

exports.setup = function(models, next) {
  state.models = models;
  prepare(state.models, next);
};

exports.end = function() {
  prepare(state.models, process.exit);
};

