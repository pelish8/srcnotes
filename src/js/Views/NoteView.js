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
    
    this.model.on('change:color', function () {
      console.log(123);
      this.render();
      return false;
    }, this);
    
  },

  render: function () {
    console.log(this.model.get('color'));
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
