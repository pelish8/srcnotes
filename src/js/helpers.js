_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};


var helpers = {
  
  S4: function () {
    return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
  },

  guid: function () {
    return this.S4() + this.S4() + '-' + this.S4() + '-' + this.S4() +
      '-' + this.S4() + '-' + this.S4() + this.S4() + this.S4();
  },

  // hash String function http://www.cse.yorku.ca/~oz/hash.html
  hash: function (str) {
    var hash = '',
        c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      hash += c;
    }
    return 'id-' + parseInt(hash, 16);
  },
  migrateFromLocalStore: function () {
    var keyss = [];
    for (var key in localStorage) {
      var item = localStorage.getItem(key),
       json;
      try {
        json = JSON.parse(item);
      } catch (variable) {
        continue;
      }
      if (json.type === 'srcnote') {
        json.localId = this.guid();
        json.date = new Date(json.date);
        json.modified = new Date(json.modified);
        keyss.push(json.localId);
        
        localforage.setItem(json.localId, JSON.stringify(json));
      }
    }
    
    localforage.setItem('srcnote-key', JSON.stringify(keyss));
  },
  escapeRegExp: function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }
};

function template(id, data) {
  var tpl = _.template($('#' + id).text());
  return tpl(data);
}

// helpers.migrateFromLocalStore();