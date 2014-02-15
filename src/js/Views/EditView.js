SRCNotes.EditView = Backbone.View.extend({
  tagName: 'div',
  className: 'edit-form',

  events: {
    'submit form.js-edit-form': 'saveContent',
    'click a.js-back': 'showList',
    'keyup': 'closeEditView'
  },
    
  initialize: function (cfg) {
    _.bindAll(this, 'saveContent', 'render', 'closeEditView');
    this.$parent = cfg.$parent;

    this.render();

    var interval = setInterval($.proxy(function () {
      var el = this.$el.find('.js-edit-form');

      if ($.contains(document, el[0])) {
        this.$el.find('.js-edit-form').submit();
      } else {
        clearInterval(interval);
      }
    }, this), 30000);
  },

  render: function () {
    $(this.el).append(template('template-edit-view', {
      title: this.model.escape('title'),
      content: this.model.escape('content')
    }));
    this.$parent.append(this.el);
    this.$el.find('textarea').focus();
  },
    
  saveContent: function (ev) {
    ev.preventDefault();
    var $target = $(ev.target);

    this.model.save({
      title: $target.find('input').val(),
      content: $target.find('textarea').val()
    });
  },

  showList: function (ev) {
    ev.preventDefault();
    this.$el.find('textarea').blur();
    this.$el.find('.note-name').blur();
    this.$parent.find('.l-note').removeClass('edit-form-active');
    this.$parent.find('.js-note-name').focus().trigger('keyup');
    this.$el.find('.js-edit-form').submit();
    this.$parent.trigger('clearSearch');
    this.remove();
  },
  
  closeEditView: function (ev) {
    if (ev.keyCode === 27) {
      this.showList(ev);
    }
  }
});
