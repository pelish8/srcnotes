SRCNotes.NoteInfoView = Backbone.View.extend({
  tagName: 'div',
  className: 'note-info',
  
  initialize: function () {
    _.bindAll(this, 'render');
    
    this.$main = $('#srcnotes');
    
    this.render();
  },
  
  render: function () {
    this.$el.append(template('tempate-note-info-item'));
    this.$main.append(this.el);
  }
});
