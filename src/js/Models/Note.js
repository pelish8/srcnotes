SRCNotes.Note = Backbone.Model.extend({
  defaults: {
    type: 'srcnote',
    color: 'default'
  },
  initialize: function (atributes, options) {
    atributes.date = atributes.date || new Date();
    atributes.id = helpers.hash(atributes.title);
    atributes.localId = atributes.localId || helpers.guid();
    this.set(atributes, options);
  }
});
