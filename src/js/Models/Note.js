SRCNotes.Note = Backbone.Model.extend({

    initialize: function (atributes, options) {
        console.log(atributes);
        this.set('id', helpers.hash(atributes.title));
        this.set('title', atributes.title);
        this.set('content', atributes.content);
        this.set('date', atributes.date);
        this.set('type', 'srcnote');
    }
});