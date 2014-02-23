SRCNotes.Notes = Backbone.Collection.extend({
  model: SRCNotes.Note,
  fetched: false,
  
  initialize: function () {
    _.bindAll(this, 'resetEvent');

    this.listenTo(this, 'reset', this.resetEvent);
  },
  
  resetEvent: function () {
    this.fetched = true;
  },
  
  comparator: function (a, b) {
    a = a.get('modified') ? a.get('modified').getTime() : a.get('date').getTime();
    b = b.get('modified') ? b.get('modified').getTime() : b.get('date').getTime();
    return a > b ?  1
          : a < b ? -1
          :          0;
  }
});
