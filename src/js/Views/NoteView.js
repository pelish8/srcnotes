SRCNotes.NoteView = Backbone.View.extend({
  tagName: 'li',
  className: 'list-item js-list-item',
  events: {
    'click a.js-open-link': 'openNote',
    'click a.js-option-open': 'toggleOptionPanel',
    'click a.js-option-close': 'hideOption',
    'click a.js-options-delete': 'removeItem'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'render', 'openNote', 'toggleOptionPanel', 'hideOption', 'removeItem');
    this.listView = cfg.listView;

    this.model.on('destroy', function () {
      this.$el.slideUp(400, function () {
        this.remove();
      });
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
    this.listView.$el.find('.l-note').addClass('edit-form-active');
    this.editForm = new SRCNotes.EditView({
      model: this.model,
      '$parent': this.listView.$el
    });
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
  }
});
