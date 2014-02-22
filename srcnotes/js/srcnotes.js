; (function ($, _, Backbone) {
 var SRCNotes = {}, Router = {};

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};


var helpers = {

  S4: function () {
    return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
  },

  guid: function () {
    return this.S4() + this.S4() + '-' + this.S4() + '-' + this.S4() +
      '-' + this.S4() + '-' + this.S4() + this.S4() + this.S4();
  },

  // hash String function http://www.cse.yorku.ca/~oz/hash.html
  hash: function (str) {
    var hash = '',
        c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      hash += c;
    }
    return 'id-' + parseInt(hash, 16);
  },
  // used to migrate data from locaStorage to localforage
  migrateFromLocalStore: function () {
    var keyss = [];
    for (var key in localStorage) {
      var item = localStorage.getItem(key),
       json;
      try {
        json = JSON.parse(item);
      } catch (variable) {
        continue;
      }
      if (json.type === 'srcnote') {
        json.localId = this.guid();
        json.date = new Date(json.date);
        json.modified = new Date(json.modified);
        keyss.push(json.localId);
        
        localforage.setItem(json.localId, JSON.stringify(json));
      }
    }
    
    localforage.setItem('srcnote-key', JSON.stringify(keyss));
  },
  escapeRegExp: function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  },
  
  isTouch: function () {
    return 'ontouchstart' in window || 'onmsgesturechange' in window;
  }
};

function template(id, data) {
  var tpl = _.template($('#' + id).text());
  return tpl(data);
}

SRCNotes.sync = {
  action: function (method, model, options) {
    var _this = this;

    switch (method) {
    case 'create':
      this.createAction(model, options);
      break;
    case 'read':
      // this.readAction(model, options);
      this.getStoreKeys(function (keys) {
        if (!keys) {
          return;
        }
        _this.readAction.call(_this, keys, model, options);
      });
      break;
    case 'update':
      this.getStoreKeys(function (keys) {
        if (keys) {
          _this.updateAction.call(_this, keys, model, options);
        }
      });
      break;
    case 'delete':
      this.deleteAction(model, options);
      break;
    }
  },

  createAction: function (model, options) {
    var _this = this,
      localId = model.get('localId');

    localforage.setItem(localId, JSON.stringify(model.toJSON()), function () {
      _this.setStoreKey(localId);
      options.success(model.toJSON());
    });
  },

  readAction: function (keys, model, options) {
    var store = [],
      length = keys.length,
      _this = this;

    if (!length) {
      // store is empty
      model.reset(store);
    } else {
      _.each(keys, function (key, index) {
        localforage.getItem(key, function (val) {
          // if key value does not exist remove key
          if (!val) {
            _this.removeStoreKey(key);
            return;
          }
          var item = JSON.parse(val);
          item.date = new Date(item.date);
          item.modified = new Date(item.modified);
          store.push(item);
          if (index + 1 === length) {
            // last
            model.reset(store);//, {silent: true});
          }
        });
      }, this);
    }
  },

  updateAction: function (keys, model, options) {
    if (_.indexOf(keys, model.get('localId')) === -1) {
      return this.createAction(model, options);
    }
    localforage.setItem(model.get('localId'), JSON.stringify(model.toJSON()), function () {
      options.success(model.toJSON());
    });
    this.setStoreKey(model.get('localId'));
  },

  deleteAction: function (model, options) {
    var _this = this,
      key = model.get('localId');
    localforage.removeItem(key, function () {
      _this.removeStoreKey(key);
      options.success(model);
    });
  },
  
  getStoreKeys: function (callback) {
    localforage.getItem('srcnote-key', function (keys) {
      if (_.isString(keys)) {
        keys = JSON.parse(keys);
      } else {
        keys = [];
      }
      callback(keys);
    });
  },
  setStoreKey: function (newKey) {
    this.getStoreKeys(function (keys) {
      var index = _.indexOf(keys, newKey);
      if (index === -1) {
        // move key to be last to awoide sorting 
        // keys.splice(index, 1);
        keys.push(newKey);
      }
      localforage.setItem('srcnote-key', JSON.stringify(keys));
    });
  },
  removeStoreKey: function (key) {
    this.getStoreKeys(function (keys) {
      var index = _.indexOf(keys, key);
      if (index !== -1) {
        keys.splice(index, 1);
      }
      localforage.setItem('srcnote-key', JSON.stringify(keys));
    });
  }
};

Backbone.sync = function (method, model, options) {
  SRCNotes.sync.action(method, model, options);
};
SRCNotes.Note = Backbone.Model.extend({
  defaults: {
    type: 'srcnote',
    color: 'default'
  },
  initialize: function (atributes, options) {
    atributes.date = atributes.date || new Date();
    atributes.id = helpers.hash(atributes.title);
    atributes.localId = atributes.localId || helpers.guid();
    this.set(atributes, options);
  }
});

SRCNotes.Notes = Backbone.Collection.extend({
  model: SRCNotes.Note,
  fetched: false,
  
  initialize: function () {
    this.on('reset', function () {
      this.fetched = true;
    }, this);
  },
  
  comparator: function (a, b) {
    a = a.get('modified') ? a.get('modified').getTime() : a.get('date').getTime();
    b = b.get('modified') ? b.get('modified').getTime() : b.get('date').getTime();
    return a > b ?  1
          : a < b ? -1
          :          0;
  }
});

SRCNotes.ColorView = Backbone.View.extend({
  tagName: 'div',
  className: 'colors-panel',
  events: {
    'focusout': 'focusOut',
    'click a': 'changeColor'
  },
  attributes: {
    'tabindex': 0
  },
  initialize: function (cfg) {
    _.bindAll(this, 'render', 'focusOut', 'changeColor');
    
    this.$main = $('#srcnotes');
    this.parent = cfg.parent;
    this.x = cfg.x;
    this.y = cfg.y;
    this.render();
  },
  
  render: function () {
    var elHeight,
      top,
      parentTop;

    this.$el.html(template('template-color'));
    this.$el.find('.color-' + this.model.get('color')).addClass('is-active');
    
    this.$main.append(this.$el);
    
    this.$el.transition({
      scale: 1
    });
    
    elHeight = this.$el.height();
    top = this.y + elHeight / 2.5;
    parentTop = $(window).scrollTop() + $(window).height();
    
    if ((top + elHeight) > parentTop) {
      top -= (elHeight * 1.8);
    }
    
    this.$el.css({
      top: top,
      left: (this.x - this.$el.width() / 2)
    });
    this.$el.focus();
  },

  focusOut: function (ev) {
    ev.preventDefault();
    var _this = this;
    this.$el.transition({
      opacity: 0
    }, function () {
      _this.remove();
    });
  },

  changeColor: function (ev) {
    ev.preventDefault();
    var color = $(ev.target).parent().data('color');
    this.model.save({'color': color}, {silent: true});
    this.parent.render();
    this.remove();
  }
});
SRCNotes.EditView = Backbone.View.extend({
  tagName: 'div',
  className: 'edit-form',

  events: {
    'submit form.js-edit-form': 'saveContent',
    'click a.js-back': 'showList',
    'keyup': 'keyUp'
  },
    
  initialize: function (cfg) {
    _.bindAll(this, 'saveContent', 'render', 'keyUp', 'onBeforeunLoad');
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
    
    window.onbeforeunload = this.onBeforeunLoad;
  },
  
  onBeforeunLoad: function () {
    this.model.save({
      title: this.$el.find('input').val(),
      content: this.editor.getValue()
    });
    // return 'It looks like you have been editing something -- if you leave before submitting your changes will be lost.';
  },

  render: function (item) {
    if (item) {
      this.model = item;
    }
    this.$el.html(template('template-edit-view', {
      title: this.model.escape('title'),
      content: this.model.escape('content')
    }));
    this.$parent.append(this.el);
    this.$el.find('textarea').focus();

    this.editor = CodeMirror.fromTextArea(this.$el.find('#text-editor').get(0), {
      lineNumbers: false,
      lineWrapping: true,
      mode: 'markdown'
    });
  
  },
    
  saveContent: function (ev) {
    ev.preventDefault();
    var $target = $(ev.target);

    this.model.save({
      title: $target.find('input').val(),
      content: this.editor.getValue()
    });
  },

  showList: function (ev) {
    ev.preventDefault();
    this.$el.find('.js-edit-form').submit();
    Router.navigate('', { trigger: true });
    this.hide();
  },
  
  keyUp: function (ev) {
    if (ev.keyCode === 27) {
      this.showList(ev);
    }
  },
  hide: function () {
    this.$el.hide();
    this.remove();
  },
  show: function () {
    this.$el.show();
  }
});

SRCNotes.ListView = Backbone.View.extend({
  el: '#srcnotes',

  events: {
    'keydown input.js-note-name': 'findItem',
    'keyup input.js-note-name': 'filterNotes',
    'submit form.js-add-new-item': 'addItem',
    'keydown #notes': 'moveCursor',
    'focus input.js-note-name': 'noteNameFocus'
  },

  templates: {},

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'addItem',
              'moveFocus', 'clearSearch',
              'moveCursor', 'filterNotes',
              'noteNameFocus');

    this.items = cfg.items;
    if (!this.items.fetched) {
      this.items.fetch();
    } else {
      this.render();
    }

    this.items.on('add', function (model) {
      var tpl = new SRCNotes.NoteView({
        model: model,
        'listView': this
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
    
    this.items.once('reset', function () {
      this.render();
    }, this);
  },

  render: function () {
    var $app = $(template('template-list-view-l'));
    this.$el.append($app);
    this.$notes = this.$el.find('#notes');
    this.items.sort();
    this.items.each(function (model) {
      var tpl = new SRCNotes.NoteView({
        model: model,
        'listView': this
      });
      // save template for later
      this.templates[model.id] = tpl;
      this.$notes.prepend(tpl.render().el);
    }, this);
    if (this.items.fetched) {
      this.show();
    }
    $app.find('.js-note-name').focus();
  },

  // intercept key event to find if we need to react
  findItem: function (ev) {
    if (ev.keyCode === 40) {
      // focus notes 
      this.focusNotes(ev);
      ev.preventDefault();
    } else if (ev.shiftKey && ev.keyCode === 13) {
      // shift + enter opens first note in list
      ev.preventDefault();
      this.$notes.find('li.js-list-item:visible').eq(0).find('a').trigger('click');
    }
  },

  // @todo waite for user to stop writing name
  filterNotes: function () {
    var name = helpers.escapeRegExp(this.$el.find('.js-note-name').val()),
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
    }
    Router.navigate('note/' + item.get('id'), { trigger: true });
  },

  moveFocus: function (position) {
    var $notes = this.$el.find('#notes');
    $notes.focus();
    $notes.find(':visible:first').addClass('move');
  },

  clearSearch: function () {
    this.$el.find('.js-note-name').val('');
    this.filterNotes();
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
      this.moveDown(ev);
      break;
    case 38:
      this.moveUp(ev);
      break;
    case 13:
      // open note when enter key is pressed
      this.openNote(ev);
      break;
    default:
      ev.preventDefault();
    }
  },

  moveDown: function () {
    if (this.$visibleNotes && (this.index < (this.$visibleNotes.size() - 1))) {
      this.index++;
      this.$visibleNotes.eq(this.index - 1).removeClass('focus');
      this.$notes.scrollToElement(this.$visibleNotes.eq(this.index));
      this.$visibleNotes.eq(this.index).addClass('focus');
    }
  },

  moveUp: function () {
    if (!this.$visibleNotes) {
      return;
    }
    if (this.index > 0) {
      this.index--;
      this.$visibleNotes.eq(this.index).addClass('focus');
      this.$notes.scrollToElement(this.$visibleNotes.eq(this.index));
    } else {
      var nameInput = this.$el.find('.js-note-name');
      nameInput.focus();
      nameInput.get(0).selectionEnd = nameInput.val().length;
      this.index--;
    }
    this.$visibleNotes.eq(this.index + 1).removeClass('focus');
  },

  openNote: function () {
    this.$visibleNotes.eq(this.index).find('a').trigger('click');
    this.$visibleNotes.eq(this.index).removeClass('focus');
  },

  noteNameFocus: function () {
    this.removeActiveNote();
  },

  // note when option is visible
  setActiveNote: function (note) {
    this.actioveNote = note;
  },

  removeActiveNote: function () {
    if (this.actioveNote) {
      this.actioveNote.hideOption();
      this.actioveNote = null;
    }
    if (this.$visibleNotes && this.index) {
      this.$visibleNotes.eq(this.index).removeClass('focus');
    }
  },

  show: function (reset) {
    this.$el.find('.l-note').show();
    if (reset) {
      this.clearSearch();
      this.$el.find('.js-note-name').focus().trigger('keyup');
    }
  },

  hide: function () {
    this.$el.find('.l-note').hide();
  }
});

SRCNotes.NoteView = Backbone.View.extend({
  tagName: 'li',
  className: 'list-item js-list-item',
  events: {
    'click a.js-open-link': 'openNote',
    'click a.js-option-open': 'toggleOptionPanel',
    'click a.js-option-close': 'hideOption',
    'click a.js-option-delete': 'removeItem',
    'click a.js-option-color': 'showColorPanel'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'openNote',
            'toggleOptionPanel', 'hideOption',
            'removeItem', 'showColorPanel');

    this.listView = cfg.listView;

    this.model.on('destroy', function () {
      this.$el.slideUp(150, function () {
        this.remove();
      });
    }, this);

    this.model.on('show', function () {
      this.$el.show();
    }, this);

    this.model.on('hide', function () {
      var $el = this.$el;
      this.$el.hide();
    }, this);
  },

  render: function () {
    this.$el.html(template('template-note', {
      title: this.model.escape('title'),
      color: this.model.get('color')
    }));
    return this;
  },

  openNote: function (ev) {
    ev.preventDefault();
    Router.navigate('note/' + this.model.get('id'), { trigger: true });
  },
  
  toggleOptionPanel: function (ev) {
    ev.preventDefault();
    this.listView.removeActiveNote();
    this.$el.find('.js-link-panel').toggle();
    this.$el.find('.js-options-panel').toggle();
    
    this.listView.setActiveNote(this);
  },
  
  hideOption: function () {
    var $option = this.$el.find('.js-options-panel');
    if ($option.is(':visible')) {
      this.$el.find('.js-link-panel').toggle();
      $option.toggle();
    }
  },
  
  removeItem: function () {
    this.model.destroy();
  },
  
  showColorPanel: function (ev) {
    console.log(ev);
    new SRCNotes.ColorView({
      model: this.model,
      parent: this,
      x: ev.clientX,
      y: ev.clientY
    });
  }
});

SRCNotes.Router = Backbone.Router.extend({
  routes: {
    '': 'showListView',
    'note/:id': 'showEditView'
  },
  initialize: function (cfg) {
    _.bindAll(this, 'showEditView', 'openNote', 'showListView');
    this.items = new SRCNotes.Notes();

    Backbone.history.start();
  },

  showEditView: function (id) {
    if (!this.items.fetched) {
      this.items.fetch();
      this.items.once('reset', function () {
        this.openNote(id);
      }, this);
    } else {
      this.openNote(id);
    }
  },

  openNote: function (id) {
    item = this.items.get(id);
    if (item) {
      if (this.listView) {
        this.listView.hide();
      }
      this.editView = new SRCNotes.EditView({
        model: item,
        '$parent': $('#srcnotes'),
        'show': true
      });
    } else {
      // console.error('note not found');
      // @todo need to open new page not found or redirect to list view
    }
  },

  showListView: function () {

    if (!this.listView) {
      this.listView = new SRCNotes.ListView({
        items: this.items
      });
    } else {
      this.listView.show(true);
      if (this.editView) {
        this.editView.hide();
      }
    }
  }
});

Router = new SRCNotes.Router();
}).call(this, jQuery, _, Backbone);
