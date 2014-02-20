SRCNotes.ListView = Backbone.View.extend({
  el: '#srcnotes',

  events: {
    'keydown input.js-note-name': 'findItem',
    'keyup input.js-note-name': 'filterNotes',
    'submit form.js-add-new-item': 'addItem',
    'keydown #notes': 'moveCursor',
    'focus input.js-note-name': 'noteNateFocus'
  },

  templates: {},

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'addItem',
              'moveFocus', 'clearSearch',
              'moveCursor', 'filterNotes',
              'noteNateFocus');
    
    // Router = new SRCNotes.Router({
    //   listView: this
    // });
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
      ev.preventDefault();
      break;
    case 38:
      this.moveUp(ev);
      ev.preventDefault();
      break;
    case 13:
      // open note when enter key is pressed
      this.openNote(ev);
      ev.preventDefault();
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
  
  noteNateFocus: function () {
    this.removeActiveNote();
  },
  
  // note where option is visible
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
