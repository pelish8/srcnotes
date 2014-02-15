; (function ($, _, Backbone) {
 var SRCNotes = {};

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};


var helpers = {
  // hash String function http://www.cse.yorku.ca/~oz/hash.html
  hash: function (str) {
    var hash = '',
        c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      hash += c;
    }
    return 'id-' + parseInt(hash, 16);
  }
};

function template(id, data) {
  var tpl = _.template($('#' + id).text());
  return tpl(data);
}
SRCNotes.sync = {
  action: function (method, model, options) {
    switch (method) {
    case 'create':
      this.createAction(model, options);
      break;
    case 'read':
      this.readAction(model, options);
      break;
    case 'update':
      this.updateAction(model, options);
      break;
    case 'delete':
      this.deleteAction(model, options);
      break;
    }
  },

  createAction: function (model, options) {
    localStorage.setItem(model.get('id'), JSON.stringify(model.toJSON()));
    options.success(model.toJSON());
  },

  readAction: function (model, options) {
    var store = [];

    for (var key in localStorage) {
      var item = this.getItem(key);
      if (item.type === 'srcnote') {
        item.date = new Date(item.date);
        item.modified = item.modified ? new Date(item.modified) : null;
        store.push(item);
      }
    }
    model.set(store, {silent: true});
    // options.success();
  },

  updateAction: function (model, options) {
    var item = this.getItem(model.get('id'));
    if (!item) {
      return this.createAction(model, options);
    }

    var title = model.get('title');
    if (item.title !== title) {
      localStorage.removeItem(item.id);
    }
    model.set('id', helpers.hash(title));
    localStorage.setItem(model.get('id'), JSON.stringify(model.toJSON()));

    options.success(model.toJSON());
  },

  deleteAction: function (model, options) {
    localStorage.removeItem(item.id);
  },

  getItem: function (id) {
    var item = localStorage.getItem(id);
    if (item) {
      return JSON.parse(item);
    }

    return null;
  }
};

Backbone.sync = function (method, model, options) {
  SRCNotes.sync.action(method, model, options);
};
SRCNotes.Note = Backbone.Model.extend({
  defaults: {
    type: 'srcnote'
  },
  initialize: function (atributes, options) {
    atributes.date = atributes.date || new Date();
    atributes.id = helpers.hash(atributes.title);
    this.set(atributes, options);
  }
});

SRCNotes.Notes = Backbone.Collection.extend({
  model: SRCNotes.Note,
  comparator: function (a, b) {
    a = a.get('modified') ? a.get('modified').getTime() : a.get('date').getTime();
    b = b.get('modified') ? b.get('modified').getTime() : b.get('date').getTime();
    return a > b ?  1
          : a < b ? -1
          :          0;
  }
});

SRCNotes.EditView = Backbone.View.extend({
  tagName: 'div',
  className: 'edit-form',

  events: {
    'submit form.js-edit-form': 'saveContent',
    'click a.js-back': 'showList'
  },
    
  initialize: function (cfg) {
    _.bindAll(this, 'saveContent', 'render');
    this.$parent = cfg.$parent;

    this.render();

    var interval = setInterval($.proxy(function () {
      var el = this.$el.find('.js-edit-form');

      if ($.contains(document, el[0])) {
        this.$el.find('.js-edit-form').submit();
      } else {
        clearInterval(interval);
      }
    }, this), 30000);
  },

  render: function () {
    $(this.el).append(template('template-edit-view', {
      title: this.model.escape('title'),
      content: this.model.escape('content')
    }));
    this.$parent.append(this.el);
    this.$el.find('textarea').focus();
  },
    
  saveContent: function (ev) {
    ev.preventDefault();
    var $target = $(ev.target);

    this.model.save({
      title: $target.find('input').val(),
      content: $target.find('textarea').val()
    });
  },
    
  showList: function (ev) {
    ev.preventDefault();
    this.$el.find('textarea').blur();
    this.$el.find('.note-name').blur();
    this.$parent.find('.l-note').removeClass('edit-form-active');
    this.$parent.find('.js-note-name').focus();
    this.$parent.find('.js-note-name').trigger('keyup');
    this.$el.find('.js-edit-form').submit();
    this.$parent.trigger('clearSearch');
    this.remove();
  }
});

SRCNotes.ListView = Backbone.View.extend({
  el: '#srcnotes',

  events: {
    'keyup input.js-note-name': 'findItem',
    'submit form.js-add-new-item': 'addItem',
    'keydown #notes': 'moveCursor'
  },

  templates: {},

  initialize: function () {
    _.bindAll(this, 'render', 'addItem',
              'moveFocus', 'clearSearch',
              'moveCursor', 'filterNotes');

    this.items = new SRCNotes.Notes();

    this.items.on('add', function (model) {
      var tpl = new SRCNotes.NoteView({
        model: model,
        '$parent': this.$el
      });
      this.$notes.prepend(tpl.render().el);
      // save template for later
      this.templates[model.id] = tpl;
    }, this);

    this.items.on('change', function (model) {
      model.set({modified: new Date()}, {silent: true});
      if (this.templates[model.id]) {
        this.$notes.prepend(this.templates[model.id].render().el);
      } else {
        console.log(model);
      }
    }, this);

    this.$el.on('clearSearch', this.clearSearch);
  },

  render: function () {
    var $app = $(template('template-list-view-l'));
    this.$el.append($app);
    this.$notes = this.$el.find('#notes');

    this.items.each(function (model) {
      var tpl = new SRCNotes.NoteView({
        model: model,
        '$parent': this.$el
      });
      // save template for later
      this.templates[model.id] = tpl;
      this.$notes.prepend(tpl.render().el);
    }, this);
    $app.find('.js-note-name').focus();
  },

  findItem: function (ev) {
    if (ev && ev.keyCode === 40) {
      // focus notes 
      this.focusNotes(ev);
      ev.preventDefault();
    } else {
      // clearTimeout(this.searchTimeout);
      // waite for user to stop writeng that search
      // this.searchTimeout = setTimeout(this.filterNotes);
      this.filterNotes();

    }
  },
  
  filterNotes: function () {
    var name = this.$el.find('.js-note-name').val(),
    pattern = new RegExp('^' + name);//, 'i'); case insensitive

    this.items.each(function (model) {
      if (!pattern.test(model.get('title'))) {
        model.trigger('hide');
      } else {
        model.trigger('show');
      }
    });
  },

  addItem: function (ev) {
    ev.preventDefault();
    var title = $('.js-note-name').val(),
    item = this.items.get(helpers.hash(title));
    if (!item) {
      item = this.items.create({title: title});
      // item.save();
    }
    this.$el.find('.l-note').addClass('edit-form-active');
    this.editForm = new SRCNotes.EditView({
      model: item,
      '$parent': this.$el,
      'show': true
    });
  },

  moveFocus: function (position) {
    var $notes = this.$el.find('#notes');
    $notes.focus();
    $notes.find(':visible:first').addClass('move');
  },

  clearSearch: function () {
    this.$el.find('.js-note-name').val('');
    this.findItem();
  },
  // colled from findItem
  focusNotes: function (ev) {
    // every time the down arrow key is pressed we tray to move the focus to
    // firt visible note so we can navigate through notes list with arrow key
    this.index = 0;
    // save to use in moveCursor method
    this.$visibleNotes = this.$notes.find('li.js-list-item:visible');
    if (this.$visibleNotes.size()) {
      $(ev.target).blur();// move focus from input fild (note-name)
      this.$notes.focus();
      this.$visibleNotes.removeClass('focus');
      this.$visibleNotes.eq(this.index).addClass('focus');
    } else {
      this.$visibleNotes = null;
    }
  },

  moveCursor: function (ev) {
    // console.log(ev.target);
    switch (ev.keyCode) {
    case 40:
      this.moveDown();
      break;
    case 38:
      this.moveUp();
      break;
    case 13:
      // open note when enter key is pressed
      this.openNote();
      break;
    }
  },

  moveDown: function () {
    if (this.index < (this.$visibleNotes.size() - 1)) {
      this.index++;
      this.$visibleNotes.eq(this.index - 1).removeClass('focus');
      this.$visibleNotes.eq(this.index).addClass('focus');
    }
  },

  moveUp: function () {
    if (this.index > 0) {
      this.index--;
      this.$visibleNotes.eq(this.index).addClass('focus');
    } else {
      var nameInput = this.$el.find('.js-note-name');
      nameInput.focus();
      nameInput.get(0).selectionEnd = nameInput.length;
      this.index--;
    }
    this.$visibleNotes.eq(this.index + 1).removeClass('focus');
  },
  
  openNote: function () {
    this.$visibleNotes.eq(this.index).find('a').trigger('click');
    this.$visibleNotes.eq(this.index).removeClass('focus');
  }
});

SRCNotes.NoteView = Backbone.View.extend({
  tagName: 'li',
  className: 'list-items js-list-item',
  events: {
    'click a': 'openNote'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'openNote');
    this.$parent = cfg.$parent;

    this.model.on('remove', function () {
      this.$el.remove();
    }, this);

    this.model.on('show', function () {
      this.$el.slideDown();
    }, this);

    this.model.on('hide', function () {
      this.$el.slideUp();
    }, this);
  },

  render: function () {
    this.$el.html(template('tempate-note', {
      title: this.model.escape('title')
    }));
    return this;
  },

  openNote: function (ev) {
    ev.preventDefault();
    this.$parent.find('.l-note').addClass('edit-form-active');
    this.editForm = new SRCNotes.EditView({
      model: this.model,
      '$parent': this.$parent
    });
  }
});

var notesapp = new SRCNotes.ListView();
// new SRCNotes.Notes();
notesapp.items.fetch();
notesapp.render();

}).call(this, jQuery, _, Backbone);
