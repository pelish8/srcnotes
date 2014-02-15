SRCNotes.Note = Backbone.Model.extend({
  defaults: {
    type: 'srcnote'
  },
  initialize: function (atributes, options) {
    atributes.date = atributes.date || new Date();
    atributes.id = helpers.hash(atributes.title);
    this.set(atributes, options);
  }
});
