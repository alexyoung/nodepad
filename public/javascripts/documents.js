(function() {
  var Document, Documents, DocumentRow, DocumentList,
      DocumentControls, ListToolBar, AppView,
      SearchView;

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
    return d.get('title') && d.get('title').toLowerCase();
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
      appView.documentList.selectedDocument = this.model;
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

    events: {
      'click #show-all': 'showAll',
    },

    initialize: function() {
      _.bindAll(this, 'render', 'addDocument', 'showAll', 'create');
      this.Collection.bind('reset', this.render);
    },

    addDocument: function(d) {
      var index = Documents.indexOf(d) + 1;
      d.rowView = new DocumentRow({ model: d });
      var el = this.el.find('li:nth-child(' + index + ')');
      if (el.length) {
        el.after(d.rowView.render().el);
      } else {
        this.el.append(d.rowView.render().el);
      }
    },

    resort: function() {
      Documents.sort({ silent: true });
    },

    create: function(title, data) {
      this.selectedDocument.set({
        title: title,
        data: data
      });
      
      this.selectedDocument.save();
      this.selectedDocument.rowView.render();
      this.resort();
    },

    render: function(documents) {
      var documentList = this;
      documents.each(function(d) {
        documentList.addDocument(d);
      });

      // Open the first document by default
      if (!this.selectedDocument) {
        this.openFirst();
      }
    },

    openFirst: function() {
      if (Documents.length) {
        Documents.first().rowView.open();
      }
    },

    showAll: function(e) {
      e.preventDefault();
      this.el.html('');
      Documents.fetch({ success: this.openFirst });
      appView.searchView.reset();
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
    },

    save: function(e) {
      e.preventDefault();

      var title = $('input.title').val(),
          data = $('#editor').val();

      if (!appView.documentList.selectedDocument) {
        Documents.create({ title: title, data: data }, {
          success: function(model) {
            Documents.fetch();
          }
        });
      } else {
        appView.documentList.create(title, data);
      }
    },

    showHTML: function(e) {
      e.preventDefault();

      var model = appView.documentList.selectedDocument,
        html = model.urlWithFormat('html');

      $.get(html, function(data) {
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
    },

    add: function(e) {
      e.preventDefault();
      var d = new Document({ title: 'Untitled Document', data: '' });
      d.save();
      Documents.add(d);
      appView.documentList.addDocument(d);
      d.rowView.open();
      $('#editor-container input.title').focus();
    },

    remove: function(e) {
      e.preventDefault();
      var model = appView.documentList.selectedDocument;

      if (!model) return;
      if (confirm('Are you sure you want to delete that document?')) {
        model.rowView.remove();
        model.destroy();
        Documents.remove(model);
        appView.documentList.selectedDocument = null;
        $('#editor-container input.title').val('');
        $('#editor').val('');
        $('#document-list li:visible:first a').click();
      }
    }
  });

  SearchView = Backbone.View.extend({
    el: $('#header .search'),

    events: {
      'focus input[name="s"]': 'focus',
      'blur input[name="s"]': 'blur',
      'submit': 'submit'
    },

    initialize: function(model) {
      _.bindAll(this, 'search', 'reset');
    },

    focus: function(e) {
      var element = $(e.currentTarget);
      if (element.val() === 'Search')
        element.val('');
    },

    blur: function(e) {
      var element = $(e.currentTarget);
      if (element.val().length === 0)
        element.val('Search');
    },

    submit: function(e) {
      e.preventDefault();
      this.search($('input[name="s"]').val());
    },

    reset: function() {
      this.el.find("input[name='s']").val('Search');
    },

    search: function(value) {
      $.post('/search.json', { s: value }, function(results) {
        appView.documentList.el.html('<li><a id="show-all" href="#">Show All</a></li>');

        if (results.length === 0) {
          alert('No results found');
        } else {
          for (var i = 0; i < results.length; i++) {
            var d = new Document(results[i]);
            appView.documentList.addDocument(d);
          }
        }
      }, 'json');
    }
  });

  AppView = Backbone.View.extend({
    initialize: function() {
      this.documentList = new DocumentList();
      this.searchView = new SearchView();
      this.toolbar = new ListToolBar();
      this.documentControls = new DocumentControls();
    }
  });

  var appView = new AppView();
  window.Documents = Documents;
  window.appView = appView;

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
})();
