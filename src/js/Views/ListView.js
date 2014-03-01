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
