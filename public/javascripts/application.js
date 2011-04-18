(function() {
  var Document, Documents, DocumentRow, DocumentList, DocumentControls, ListToolBar, AppView;

  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };

  Document = Backbone.Model.extend({
    Collection: Documents,

    url: function() {
      return this.urlWithFormat('json');
    },

    urlWithFormat: function(format) {
      return this.get('id') ? '/documents/' + this.get('id') + '.' + format : '/documents.json';
    },

    display: function() {
      this.fetch({
        success: function(model, response) {
          $('#editor-container input.title').val(model.get('title'));
          $('#editor').val(model.get('data'));
        }
      });
    }
  });

  Documents = new Backbone.Collection();
  Documents.url = '/documents/titles.json';
  Documents.model = Document;
  Documents.comparator = function(d) {
    return d.get('title');
  };

  DocumentRow = Backbone.View.extend({
    tagName: 'li',

    events: {
      'click a': 'open'
    },

    template: _.template($('#document-row-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
    },

    open: function() {
      $('#document-list .selected').removeClass('selected');
      $(this.el).addClass('selected');
      this.model.display();
      this.controls = new DocumentControls(this.model),
      this.toolbar = new ListToolBar(this.model);
    },

    remove: function() {
      $(this.el).remove();
    },

    render: function() {
      $(this.el).html(this.template({
        id: this.model.id,
        title: this.model.get('title')
      }));
      return this;
    }
  });

  DocumentList = Backbone.View.extend({
    el: $('#document-list'),
    Collection: Documents,

    initialize: function() {
      _.bindAll(this, 'render', 'addDocument');
      this.Collection.bind('refresh', this.render);
    },

    addDocument: function(d) {
      d.rowView = new DocumentRow({ model: d });
      this.el.append(d.rowView.render().el);
    },

    render: function(documents) {
      var documentList = this;
      documents.each(function(d) {
        documentList.addDocument(d);
      });

      // Open the first document by default
      documents.first().rowView.open();
    }
  });

  DocumentControls = Backbone.View.extend({
    el: $('#controls'),

    events: {
      'click #save-button': 'save',
      'click #html-button': 'showHTML'
    },

    initialize: function(model) {
      _.bindAll(this, 'save', 'showHTML');
      this.model = model;
    },

    save: function(e) {
      this.model.set({
        title: $('input.title').val(),
        data: $('#editor').val()
      });
      
      this.model.save();
      this.model.rowView.render();
      e.preventDefault();
    },

    showHTML: function(e) {
      var model = this.model;
      e.preventDefault();
      $.get(this.model.urlWithFormat('html'), function(data) {
        $('#html-container').html(data);
        $('#html-container').dialog({
          title: model.get('title'),
          autoOpen: true,
          modal: true,
          width: $(window).width() * 0.95,
          height: $(window).height() * 0.90
        });
      });
    }
  });

  ListToolBar = Backbone.View.extend({
    el: $('#left .toolbar'),

    events: {
      'click #create-document': 'add',
      'click #delete-document': 'remove'
    },

    initialize: function(model) {
      _.bindAll(this, 'add', 'remove');
      this.model = model;
    },

    add: function(e) {
      e.preventDefault();
      var d = new Document({ title: 'Untitled Document', data: '' });
      d.save();
      Documents.add(d);
      appView.documentList.addDocument(d);
      d.rowView.open();
    },

    remove: function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to delete that document?')) {
        this.model.rowView.remove();
        this.model.destroy();
      }
    }
  });

  AppView = Backbone.View.extend({
    initialize: function() {
      this.documentList = new DocumentList();
    }
  });

  var appView = new AppView();
  window.Documents = Documents;

  $('#logout').click(function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to log out?')) {
      var element = $(this),
          form = $('<form></form>');
      form
        .attr({
          method: 'POST',
          action: '/sessions'
        })
        .hide()
        .append('<input type="hidden" />')
        .find('input')
        .attr({
          'name': '_method',
          'value': 'delete'
        })
        .end()
        .appendTo('body')
        .submit();
    }
  });

  // Correct widths and heights based on window size
  function resize() {
    var height = $(window).height() - $('#header').height() - 1,
        width = $('.content').width(),
        ov = $('.outline-view'),
        ed = $('#editor'),
        toolbar = $('.toolbar'),
        divider = $('.content-divider'),
        content = $('.content'),
        controls = $('#controls');

    $('#DocumentTitles').css({ height: height - toolbar.height() + 'px' });
    ov.css({ height: height + 'px' });
    toolbar.css({ width: ov.width() + 'px' });

    content.css({
      height: height - controls.height() + 'px',
      width: $('body').width() - ov.width() - divider.width() - 1 + 'px'
    });

    divider.css({ height: height + 'px' });

    ed.css({
      width: content.width() + 'px',
      height: content.height() - 22 - $('input.title').height() + 'px'
    }).focus();

    $('#controls').css({
      width: content.width() + 'px'
    });
  }

  function hideFlashMessages() {
    $(this).fadeOut();
  }

  setTimeout(function() {
    $('.flash').each(hideFlashMessages);
  }, 5000);
  $('.flash').click(hideFlashMessages);

  // TODO: Convert to Backbone
  // Search bar
  /*
  function showDocuments(results) {
    for (var i = 0; i < results.length; i++) {
      $('#document-list').append('<li><a id="document-title-' + results[i]._id + '" href="/documents/' + results[i]._id + '">' + results[i].title + '</a></li>');
    }
  }

  function search(value) {
    $.post('/search.json', { s: value }, function(results) {
      $('#document-list').html('');
      $('#document-list').append('<li><a id="show-all" href="#">Show All</a></li>');

      if (results.length === 0) {
        alert('No results found');
      } else {
        showDocuments(results);
      }
    }, 'json');
  }

  $('input[name="s"]').focus(function() {
    var element = $(this);
    if (element.val() === 'Search')
      element.val('');
  });

  $('input[name="s"]').blur(function() {
    var element = $(this);
    if (element.val().length === 0)
      element.val('Search');
  });

  $('form.search').submit(function(e) {
    search($('input[name="s"]').val());
    e.preventDefault();
  });

  $('#show-all').live('click', function(e) {
    $.get('/documents/titles.json', function(results) {
      $('#document-list').html('');
      showDocuments(results);
      if (results.length > 0)
        $('#document-title-' + results[0]._id).click();
    });
    e.preventDefault();
  });
  */

  $(window).resize(resize);
  $(window).focus(resize);
  resize();
})();
