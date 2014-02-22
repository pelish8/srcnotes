SRCNotes.EditView = Backbone.View.extend({
  tagName: 'div',
  className: 'edit-form',

  events: {
    'submit form.js-edit-form': 'saveContent',
    'click a.js-back': 'showList',
    'keyup': 'keyUp'
  },
    
  initialize: function (cfg) {
    _.bindAll(this, 'saveContent', 'render', 'keyUp', 'onBeforeunLoad');
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
    
    window.onbeforeunload = this.onBeforeunLoad;
  },
  
  onBeforeunLoad: function () {
    this.model.save({
      title: this.$el.find('input').val(),
      content: this.editor.getValue()
    });
    // return 'It looks like you have been editing something -- if you leave before submitting your changes will be lost.';
  },

  render: function (item) {
    if (item) {
      this.model = item;
    }
    this.$el.html(template('template-edit-view', {
      title: this.model.escape('title'),
      content: this.model.escape('content')
    }));
    this.$parent.append(this.el);
    this.$el.find('textarea').focus();

    this.editor = CodeMirror.fromTextArea(this.$el.find('#text-editor').get(0), {
      lineNumbers: false,
      lineWrapping: true,
      mode: 'markdown'
    });
  
  },
    
  saveContent: function (ev) {
    ev.preventDefault();
    var $target = $(ev.target);

    this.model.save({
      title: $target.find('input').val(),
      content: this.editor.getValue()
    });
  },

  showList: function (ev) {
    ev.preventDefault();
    this.$el.find('.js-edit-form').submit();
    Router.navigate('', { trigger: true });
    this.hide();
  },
  
  keyUp: function (ev) {
    if (ev.keyCode === 27) {
      this.showList(ev);
    }
  },
  hide: function () {
    this.$el.hide();
    this.remove();
  },
  show: function () {
    this.$el.show();
  }
});
