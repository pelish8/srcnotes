SRCNotes.Notes = Backbone.Collection.extend({
  model: SRCNotes.Note,
  fetched: false,

  initialize: function () {
    _.bindAll(this, 'resetEvent', 'invalidEvent');

    this.listenTo(this, 'reset', this.resetEvent);
    this.listenTo(this, 'invalid', this.invalidEvent);
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
  },
  errorList: [],

  invalidEvent: function (model, msg) {
    // prevent displaying the same error multiple times
    if (_.indexOf(this.errorList, msg) > -1) {
      return;
    }

    this.errorList.push(msg);
    var _this = this;
    this.error = new SRCNotes.InfoView({
      message: msg,
      type: 'error'
    });
    // wait for user to close the message dialog so that we can display it again
    this.listenToOnce(this.error, 'remove', function () {
      var index = _.indexOf(_this.errorList, msg);
      if (index > -1) {
        _this.errorList.splice(index, 1);
      }
      _this.error = null;
    });
  }
});

