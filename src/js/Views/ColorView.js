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
    this.$el.find('.color-' + this.model.get('color')).addClass('is-active');
    
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