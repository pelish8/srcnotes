_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};


var helpers = {
  // hash String function http://www.cse.yorku.ca/~oz/hash.html
  hash: function (str) {
    var hash = '',
        c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      hash += c;
    }
    return 'id-' + parseInt(hash, 16);
  }
};

function template(id, data) {
  var tpl = _.template($('#' + id).text());
  return tpl(data);
}
