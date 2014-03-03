SRCNotes.Router = Backbone.Router.extend({
  routes: {
    '': 'showListView',
    'note/:id': 'showEditView',
    ':id': 'showNoteOnListView'
  },
  initialize: function (cfg) {
    _.bindAll(this, 'showEditView', 'openNote', 'showListView',
                    'showNoteOnListView');
    this.items = new SRCNotes.Notes();

    Backbone.history.start();
    this.$srcnotes = $('#srcnotes');
    this.$srcnotes.append('<div id="info-panel"></div>');
  },

  showEditView: function (id) {
    if (!this.items.fetched) {
      this.items.fetch();
      this.items.once('reset', function () {
        this.openNote(id);
      }, this);
    } else {
      this.openNote(id);
    }
  },

  openNote: function (id) {
    item = this.items.get(id);
    if (item) {
      if (this.listView) {
        this.listView.hide();
      }
      this.editView = new SRCNotes.EditView({
        model: item,
        '$parent': this.$srcnotes,
        'show': true
      });
    } else {
      // console.error('note not found');
      // @todo need to open new page not found or redirect to list view
      Backbone.history.navigate('', true);
    }
  },

  showListView: function (id) {

    if (!this.listView) {
      this.listView = new SRCNotes.ListView({
        items: this.items,
        listView: this.listView,
        router: this,
        activeNoteId: id
      });
    } else {
      this.listView.show(true);
      this.listView.changeContent(id);
      if (this.editView) {
        this.editView.hide();
      }
    }
  },

  showNoteOnListView: function (id) {
    if (!this.$listContent) {
      this.$listContent = $('#list-note-content');
    }

    if (this.$listContent.is(':visible')) {
      this.showListView(id);
    } else if (!this.$listContent.size()) {
      this.showListView(id);
    } else {
      Backbone.history.navigate('note/' + id, true);
    }
  }
});
