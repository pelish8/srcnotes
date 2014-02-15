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
