SRCNotes.sync = {
    action: function (method, model, options) {
        switch (method) {
        case 'create':
            this.createAction(model, options);
            break;
        case 'read':
            this.readAction(model, options);
            break;
        case 'update':
            this.updateAction(model, options);
            break;
        case 'delete':
            this.deleteAction(model, options);
            break;
        }
    },
    
    createAction: function (model, options) {
        localStorage.setItem(model.get('id'), JSON.stringify(model.toJSON()));
        options.success(model.toJSON());
    },
    
    readAction: function (model, options) {
        var store = [];
        
        for (var key in localStorage) {
            var item = this.getItem(key);
            if (item.type === 'srcnote') {
                store.push(item);
            }
        }
        options.success(store);
    },
    
    updateAction: function (model, options) {
        var item = this.getItem(model.get('id'));
        if (!item) {
            return this.createAction(model, options);
        }
        
        var title = model.get('title');
        if (item.title !== title) {
            localStorage.removeItem(item.id);
        }
        model.set('id', helpers.hash(title));
        localStorage.setItem(model.get('id'), JSON.stringify(model.toJSON()));
        
        options.success(model.toJSON());
    },
    
    deleteAction: function (model, options) {
        localStorage.removeItem(item.id);
    },
    
    getItem: function (id) {
        var item = localStorage.getItem(id);
        if (item) {
            return JSON.parse(item);
        }
        
        return null;
    }
};

Backbone.sync = function (method, model, options) {
    SRCNotes.sync.action(method, model, options);
};