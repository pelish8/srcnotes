SRCNotes.EditView = Backbone.View.extend({
  tagName: 'div',
  className: 'edit-form',

  showList: false,

  events: {
    'submit form.js-edit-form': 'saveContent',
    'click a.js-back': 'goBack',
    'keyup': 'keyUp'
  },

  initialize: function (cfg) {
    _.bindAll(this, 'saveContent', 'render', 'keyUp',
                    'onBeforeunLoad', 'saveSuccess',
                    'goBack');

    this.$parent = cfg.$parent;

    this.render();

    var interval = setInterval($.proxy(function () {
      var el = this.$('.js-edit-form');

      if ($.contains(document, el[0])) {
        this.$('.js-edit-form').submit();
      } else {
        clearInterval(interval);
      }
    }, this), 30000);

    window.onbeforeunload = this.onBeforeunLoad;
  },

  onBeforeunLoad: function () {
    this.model.save({
      title: this.$('.js-edit-note-name').val(),
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
    // this.$('textarea').focus();

    this.editor = CodeMirror.fromTextArea(this.$('#text-editor').get(0), {
      lineNumbers: false,
      lineWrapping: true,
      mode: 'markdown',
      autofocus: true
    });

  },

  saveContent: function (ev) {
    ev.preventDefault();
    var $target = $(ev.target);

    this.model.save({
      title: $target.find('.js-edit-note-name').val(),
      content: this.editor.getValue()
    }, {
      success: this.saveSuccess
    });
  },

  saveSuccess: function (model, resp, options) {
    if (options.changed) {
      new SRCNotes.InfoView({
        message: 'Note saved.',
        type: 'info'
      });
    }
    if (this.showList) {
      Backbone.history.navigate('', true);
      this.hide();
      this.showList = false;
    }
  },

  goBack: function (ev) {
    ev.preventDefault();
    // remove event
    window.onbeforeunload = null;
    this.showList = true;
    this.$('.js-edit-form').submit();
  },

  keyUp: function (ev) {
    if (ev.which === 27) {
      var $name = $(ev.target);
      if ($name.hasClass('js-edit-note-name')) {
        $name.val(this.model.get('title'));
      } else {
        this.goBack(ev);
      }
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
