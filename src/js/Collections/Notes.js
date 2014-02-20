SRCNotes.Notes = Backbone.Collection.extend({
  model: SRCNotes.Note,
  fetched: false,
  
  initialize: function () {
    this.on('reset', function () {
      this.fetched = true;
    }, this);
  },
  
  comparator: function (a, b) {
    a = a.get('modified') ? a.get('modified').getTime() : a.get('date').getTime();
    b = b.get('modified') ? b.get('modified').getTime() : b.get('date').getTime();
    return a > b ?  1
          : a < b ? -1
          :          0;
  }
});
