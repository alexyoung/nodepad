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
  run: function(e) {
    for (var test in state.tests) {
      e[test] = state.tests[test];
    }
  },

  setup: function(next) {
    prepare(state.models, next);
  },

  end: function() {
    prepare(state.models, process.exit);
  },

  set models(models) {
    state.models = models;
  },

  set tests(tests) {
    state.tests = tests;
  }
};

