SRCNotes.sync = {
    action: function (method, model, options) {
        switch (method) {
        case 'create':
            this.actionCreate(model, options);
            break;
        case 'read':
            this.actionRead(model, options);
            break;
        case 'update':
            this.actionUpdate(model, options);
            break;
        case 'delete':
            this.actionDelete(model, options);
            break;
        }
    },
    
    actionCreate: function (model, options) {
        localStorage.setItem(model.get('id'), JSON.stringify(model.toJSON()));
        options.success(model);
        
        console.log('actionCreate');
    },
    
    actionRead: function (model, options) {
        var store = [];
        
        for (var key in localStorage) {
            var item = this.getItem(key);
            if (item.type === 'srcnote') {
                store.push(item);
            }
        }
        console.log(store);
        options.success(store);
        console.log('actionRead');
    },
    
    actionUpdate: function (model, options) {
        console.log(model.get('id'));
        var item = this.getItem(model.get('id'));
        if (!item) {
            return this.actionCreate(model, options);
        }
        
        var title = model.get('title');
        if (item.title !== title) {
            localStorage.removeItem(item.id);
        }
        model.set('id', helpers.hash(title));
        // console.log(model.toJSON());
        localStorage.setItem(model.get('id'), JSON.stringify(model.toJSON()));
        
        options.success(model);
        console.log('actionUpdate');
    },
    
    actionDelete: function (model, options) {
        localStorage.removeItem(item.id);
        console.log('actionDelete');
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
    console.log(arguments);
    SRCNotes.sync.action(method, model, options);
    
    // switch (method) {
    // case 'update':
    //     localStorage[model.escape('id')] = JSON.stringify(model);
    //     break;
    // case 'read':
    //     var store = [];
    //     _.each(localStorage, function (val, index) {
    //         console.log(index);
    //         store.push(JSON.parse(val));
    //     });
    //     options.success(store);
    //     break;
    // 
    // case 'create':
    //     break;
    // 
    // case 'delete':
    //     break;
    // default:
    //     
    // }
};