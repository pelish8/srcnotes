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
    
    this.$el.html(template('tempate-inof-item', {
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
    switch (this.type) {
    case 'info':
      var _this = this;
      setTimeout(function () {
        _this.close();
      }, 4000);
      break;
    default:
      
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