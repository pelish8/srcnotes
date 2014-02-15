SRCNotes.ListView = Backbone.View.extend({
  el: '#srcnotes',

  events: {
    'keyup input.js-note-name': 'findItem',
    'submit form.js-add-new-item': 'addItem'
  },

  templates: {},

  initialize: function () {
    _.bindAll(this, 'render', 'addItem', 'moveFocus', 'clearSearch');

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
    var name = this.$el.find('.js-note-name').val(),
    pattern = new RegExp('^' + name);//, 'i'); case insensitive
    if (ev && ev.keyCode === 40) {
      $(ev.target).blur();
    } else {
      this.items.each(function (model) {
        if (!pattern.test(model.get('title'))) {
          model.trigger('hide');
        } else {
          model.trigger('show');
        }
      });
    }
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
  }
});
