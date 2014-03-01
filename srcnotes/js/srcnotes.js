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

    if (!model.changedAttributes()) {
      options.changed = false;
      options.success(model.toJSON(), options);
      return;
    }

    options.changed = true;
    if (_.indexOf(keys, model.get('localId')) === -1) {
      return this.createAction(model, options);
    }
    localforage.setItem(model.get('localId'), JSON.stringify(model.toJSON()), function () {
      options.success(model.toJSON(), options);
    });
    this.setStoreKey(model.get('localId'));
  },

  deleteAction: function (model, options) {
    var _this = this,
      key = model.get('localId');
    localforage.removeItem(key, function () {
      _this.removeStoreKey(key);
      options.success(model, options);
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
    atributes.id = atributes.id || helpers.hash(atributes.title);
    atributes.localId = atributes.localId || helpers.guid();
    this.set(atributes, options);
  },

  validate: function (attrs, options) {
    if (!attrs.title.length) {
      return 'Name cannot be empty.';
    }

    if (this.get('title') !== attrs.title) {
      var model = this.collection.findWhere({title: attrs.title});
      if (model) {
        return 'Note with name "' + attrs.title + '" already exists.';
      }
    }
  }
});

SRCNotes.Notes = Backbone.Collection.extend({
  model: SRCNotes.Note,
  fetched: false,

  initialize: function () {
    _.bindAll(this, 'resetEvent', 'invalidEvent');

    this.listenTo(this, 'reset', this.resetEvent);
    this.listenTo(this, 'invalid', this.invalidEvent);
  },

  resetEvent: function () {
    this.fetched = true;
  },

  comparator: function (a, b) {
    a = a.get('modified') ? a.get('modified').getTime() : a.get('date').getTime();
    b = b.get('modified') ? b.get('modified').getTime() : b.get('date').getTime();
    return a > b ?  1
          : a < b ? -1
          :          0;
  },
  errorList: [],

  invalidEvent: function (model, msg) {
    // prevent displaying the same error multiple times
    if (_.indexOf(this.errorList, msg) > -1) {
      return;
    }

    this.errorList.push(msg);
    var _this = this;
    this.error = new SRCNotes.InfoView({
      message: msg,
      type: 'error'
    });
    // wait for user to close the message dialog so that we can display it again
    this.listenToOnce(this.error, 'remove', function () {
      var index = _.indexOf(_this.errorList, msg);
      if (index > -1) {
        _this.errorList.splice(index, 1);
      }
      _this.error = null;
    });
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
    this.$('.color-' + this.model.get('color')).addClass('is-active');
    
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
    // ev.preventDefault();
    // var _this = this;
    // this.$el.transition({
      // opacity: 0
    // }, 100, function () {
    this.remove();
    // });
  },

  changeColor: function (ev) {
    ev.preventDefault();
    var color = $(ev.target).parent().data('color'),
      _this = this;

    this.$el.transition({
      opacity: 0
    }, 100, function () {
      _this.model.save({'color': color}, {silent: true});
      _this.parent.render();
      _this.remove();
    });
    
  }
});
SRCNotes.EditView = Backbone.View.extend({
  tagName: 'div',
  className: 'edit-form',

  showList: false,

  events: {
    'submit form.js-edit-form': 'saveContent',
    'click a.js-back': 'goBack',
    'keyup': 'keyUp'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'saveContent', 'render', 'keyUp',
                    'onBeforeunLoad', 'saveSuccess',
                    'goBack');

    this.$parent = cfg.$parent;

    this.render();

    var interval = setInterval($.proxy(function () {
      var el = this.$('.js-edit-form');

      if ($.contains(document, el[0])) {
        this.$('.js-edit-form').submit();
      } else {
        clearInterval(interval);
      }
    }, this), 30000);

    window.onbeforeunload = this.onBeforeunLoad;
  },

  onBeforeunLoad: function () {
    this.model.save({
      title: this.$('.js-edit-note-name').val(),
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
    // this.$('textarea').focus();

    this.editor = CodeMirror.fromTextArea(this.$('#text-editor').get(0), {
      lineNumbers: false,
      lineWrapping: true,
      mode: 'markdown',
      autofocus: true
    });

  },

  saveContent: function (ev) {
    ev.preventDefault();
    var $target = $(ev.target);

    this.model.save({
      title: $target.find('.js-edit-note-name').val(),
      content: this.editor.getValue()
    }, {
      success: this.saveSuccess
    });
  },

  saveSuccess: function (model, resp, options) {
    if (options.changed) {
      new SRCNotes.InfoView({
        message: 'Note saved.',
        type: 'info'
      });
    }
    if (this.showList) {
      Backbone.history.navigate('', true);
      this.hide();
      this.showList = false;
    }
  },

  goBack: function (ev) {
    ev.preventDefault();
    // remove event
    window.onbeforeunload = null;
    this.showList = true;
    this.$('.js-edit-form').submit();
  },

  keyUp: function (ev) {
    if (ev.which === 27) {
      var $name = $(ev.target);
      if ($name.hasClass('js-edit-note-name')) {
        $name.val(this.model.get('title'));
      } else {
        this.goBack(ev);
      }
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

SRCNotes.InfoView = Backbone.View.extend({

  tagName: 'div',
  className: 'message',

  events: {
    'click .js-info-close': 'close'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'wayToClose', 'close');

    this.$main = $('#info-panel');

    this.message = cfg.message;
    this.type = cfg.type || 'info';

    this.render();
  },

  render: function () {

    this.$el.html(template('tempate-info-item', {
      message: this.message,
      className: this.type + '-message'
    }));

    this.$main.append(this.$el);

    this.$main.show();

    this.$el.show().transition({
      opacity: 1
    }, 1000);
    this.wayToClose();
  },

  wayToClose: function () {
    var _this = this;
    switch (this.type) {
      case 'info':
        setTimeout(function () {
          _this.close();
        }, 4000);
        break;
      case 'error':
        setTimeout(function () {
          _this.close();
        }, 15000);
        break;
    }
  },

  close: function (ev) {
    if (ev) {
      ev.preventDefault();
    }
    var _this = this;
    this.$el.transition({
      opacity: 0
    }, 500, function () {
      _this.remove();
      _this.trigger('remove');
    });
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
              'clearSearch', 'moveCursor',
              'filterNotes', 'noteNameFocus',
              'addEvent', 'changeEvent');

    this.items = cfg.items;
    if (!this.items.fetched) {
      this.items.fetch();
    } else {
      this.render();
    }

    this.listenTo(this.items, 'add', this.addEvent);
    this.listenTo(this.items, 'change', this.changeEvent);
    this.listenTo(this.items, 'reset', this.render);
  },

  addEvent: function (model) {
    // check to see if error message exists and do not render note view
    if (!model.validateError) {
      var tpl = new SRCNotes.NoteView({
        model: model,
        'listView': this
      });
      this.$notes.prepend(tpl.render().el);
      // save template for later
      this.templates[model.id] = tpl;
      // go to edit view
      Router.navigate('note/' + model.get('id'), true);
    }
  },

  changeEvent: function (model) {
    if (!model.validateError) {
      model.set({modified: new Date()}, {silent: true});
      if (this.templates[model.id]) {
        this.$notes.prepend(this.templates[model.id].render().el);
      } else {
        console.log(model);
      }
    }
  },

  render: function () {
    var $app = $(template('template-list-view-l'));
    this.$el.append($app);
    this.$notes = this.$('#notes');
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
    var key = ev.which;

    if (key === 40) {
      // focus notes
      this.focusNotes(ev);
      ev.preventDefault();
    } else if (ev.shiftKey && key === 13) {
      // shift + enter opens first note in list
      ev.preventDefault();
      this.$notes.find('li.js-list-item:visible').eq(0).find('.js-open-link').trigger('click');
    } else if (key === 27) {
      // clean name value
      $(ev.target).val('');
    }
  },

  // @todo waite for user to stop writing name
  filterNotes: function () {
    var name = helpers.escapeRegExp(this.$('.js-note-name').val()),
      pattern = new RegExp('^' + name),//, 'i'); case insensitive
      listItems = 0;

    this.items.each(function (model) {
      if (!pattern.test(model.get('title'))) {
        model.trigger('hide');
      } else {
        model.trigger('show');
        listItems++;
      }
    });
    if (!listItems) {
      console.log('List is empty.');
      this.$notes.find('.js-list-info').show();
    } else {
      this.$notes.find('.js-list-info').hide();
    }
  },

  addItem: function (ev) {
    ev.preventDefault();
    var title = $('.js-note-name').val(),
    item = this.items.get(helpers.hash(title));
    if (item) {
      Backbone.history.navigate('note/' + item.get('id'), true);
    } else {
      this.items.create({title: title}, {validate: true});
    }
  },

  clearSearch: function () {
    this.$('.js-note-name').val('');
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
      this.$notes.scrollToElement(this.$visibleNotes.eq(this.index).addClass('focus'));
    } else {
      this.$visibleNotes = null;
    }
  },

  moveCursor: function (ev) {
    switch (ev.keyCode) {
    case 40:
      ev.preventDefault();
      this.moveDown(ev);
      break;
    case 38:
      ev.preventDefault();
      this.moveUp(ev);
      break;
    case 13:
      ev.preventDefault();
      // open note when enter key is pressed
      this.openNote(ev);
      break;
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
      var nameInput = this.$('.js-note-name');
      nameInput.focus();
      nameInput.get(0).selectionEnd = nameInput.val().length;
      this.index--;
    }
    this.$visibleNotes.eq(this.index + 1).removeClass('focus');
  },

  openNote: function () {
    this.$visibleNotes.eq(this.index).find('.js-open-link').trigger('click');
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
    this.$('.l-note').show();
    if (reset) {
      this.clearSearch();
      this.$('.js-note-name').focus().trigger('keyup');
    }
  },

  hide: function () {
    this.$('.l-note').hide();
  }
});

SRCNotes.NoteInfoView = Backbone.View.extend({
  tagName: 'div',
  className: 'note-info',
  
  initialize: function () {
    _.bindAll(this, 'render');
    
    this.$main = $('#srcnotes');
    
    this.render();
  },
  
  render: function () {
    this.$el.append(template('tempate-note-info-item'));
    this.$main.append(this.el);
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
    'click a.js-option-color': 'showColorPanel',
    'click a.js-option-info': 'showNoteInfoPanel'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'openNote',
            'toggleOptionPanel', 'hideOption',
            'removeItem', 'showColorPanel',
            'destroyEvent', 'showEvent',
            'hideEvent', 'showNoteInfoPanel');

    this.listView = cfg.listView;
    
    this.listenTo(this.model, 'destroy', this.destroyEvent);
    this.listenTo(this.model, 'show', this.showEvent);
    this.listenTo(this.model, 'hide', this.hideEvent);
  },

  destroyEvent: function () {
    this.$el.slideUp(150, function () {
      this.remove();
    });
  },
  
  showEvent: function () {
    this.$el.show();
  },
  
  hideEvent: function () {
    this.$el.hide();
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
    Router.navigate('note/' + this.model.get('id'), true);
  },
  
  toggleOptionPanel: function (ev) {
    ev.preventDefault();
    this.listView.removeActiveNote();
    this.$('.js-link-panel').toggle();
    this.$('.js-options-panel').toggle();
    
    this.listView.setActiveNote(this);
  },
  
  hideOption: function () {
    var $option = this.$('.js-options-panel');
    if ($option.is(':visible')) {
      this.$('.js-link-panel').toggle();
      $option.toggle();
    }
  },
  
  removeItem: function () {
    this.model.destroy({
      success: function () {
        new SRCNotes.InfoView({
          message: 'Note deleted.',
          type: 'info'
        });
      }
    });
  },
  
  showColorPanel: function (ev) {
    new SRCNotes.ColorView({
      model: this.model,
      parent: this,
      x: ev.clientX,
      y: ev.clientY
    });
  },
  
  showNoteInfoPanel: function (ev) {
    ev.preventDefault();
    new SRCNotes.NoteInfoView();
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
    this.$srcnotes = $('#srcnotes');
    this.$srcnotes.append('<div id="info-panel"></div>');
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
        '$parent': this.$srcnotes,
        'show': true
      });
    } else {
      // console.error('note not found');
      // @todo need to open new page not found or redirect to list view
      Backbone.history.navigate('', true);
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
