SRCNotes.sync = {
  action: function (method, model, options) {
    var _this = this;
    switch (method) {
    case 'create':
      this.createAction(model, options);
      break;
    case 'read':
      // this.readAction(model, options);
      this.getStoreKeys(function (keys) {
        if (!keys) {
          return;
        }
        _this.readAction.call(_this, keys, model, options);
      });
      break;
    case 'update':
      this.getStoreKeys(function (keys) {
        if (keys) {
          _this.updateAction.call(_this, keys, model, options);
        }
      });
      break;
    case 'delete':
      this.deleteAction(model, options);
      break;
    }
  },

  createAction: function (model, options) {
    var _this = this,
      localId = model.get('localId');

    localforage.setItem(localId, JSON.stringify(model.toJSON()), function () {
      _this.setStoreKey(localId);
      options.success(model.toJSON());
    });
  },

  readAction: function (keys, model, options) {
    var store = [],
      length = keys.length,
      _this = this;

    if (!length) {
      // store is empty
      model.reset(store);
    } else {
      _.each(keys, function (key, index) {
        localforage.getItem(key, function (val) {
          // if key value does not exist remove key
          if (!val) {
            _this.removeStoreKey(key);
            return;
          }
          var item = JSON.parse(val);
          item.date = new Date(item.date);
          item.modified = new Date(item.modified);
          store.push(item);
          if (index + 1 === length) {
            // last
            model.reset(store);//, {silent: true});
          }
        });
      }, this);
    }
  },

  updateAction: function (keys, model, options) {
    var newAttrs = model.toJSON(),
    prevAttrs = model.previousAttributes();
    
    if (_.isEqual(newAttrs, prevAttrs)) {
      return;
    }
    if (_.indexOf(keys, model.get('localId')) === -1) {
      return this.createAction(model, options);
    }
    localforage.setItem(model.get('localId'), JSON.stringify(model.toJSON()), function () {
      options.success(model.toJSON());
    });
    this.setStoreKey(model.get('localId'));
  },

  deleteAction: function (model, options) {
    var _this = this,
      key = model.get('localId');
    localforage.removeItem(key, function () {
      _this.removeStoreKey(key);
      options.success(model);
    });
  },
  
  getStoreKeys: function (callback) {
    localforage.getItem('srcnote-key', function (keys) {
      if (_.isString(keys)) {
        keys = JSON.parse(keys);
      } else {
        keys = [];
      }
      callback(keys);
    });
  },
  setStoreKey: function (newKey) {
    this.getStoreKeys(function (keys) {
      var index = _.indexOf(keys, newKey);
      if (index === -1) {
        // move key to be last to awoide sorting 
        // keys.splice(index, 1);
        keys.push(newKey);
      }
      localforage.setItem('srcnote-key', JSON.stringify(keys));
    });
  },
  removeStoreKey: function (key) {
    this.getStoreKeys(function (keys) {
      var index = _.indexOf(keys, key);
      if (index !== -1) {
        keys.splice(index, 1);
      }
      localforage.setItem('srcnote-key', JSON.stringify(keys));
    });
  }
};

Backbone.sync = function (method, model, options) {
  SRCNotes.sync.action(method, model, options);
};