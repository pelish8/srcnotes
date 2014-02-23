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
            'removeItem', 'showColorPanel',
            'destroyEvent', 'showEvent',
            'hideEvent');

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
  }
});
