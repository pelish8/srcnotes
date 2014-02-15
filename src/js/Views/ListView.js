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
