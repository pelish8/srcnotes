SRCNotes.Note = Backbone.Model.extend({
  defaults: {
    type: 'srcnote',
    color: 'default'
  },

  initialize: function (atributes, options) {
    atributes.date = atributes.date || new Date();
    atributes.id = atributes.id || helpers.hash(atributes.title);
    atributes.localId = atributes.localId || helpers.guid();
    this.set(atributes, options);
  },

  validate: function (attrs, options) {
    if (!attrs.title.length) {
      return 'Name cannot be empty.';
    }

    if (this.get('title') !== attrs.title) {
      var model = this.collection.findWhere({title: attrs.title});
      if (model) {
        return 'Note with name "' + attrs.title + '" already exists.';
      }
    }
  }
});
