(function ($, _, Backbone) {
 var SRCNotes = {};

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};


var helpers = {
    // check if elemen is in scroll view
    isInView: function (elem) {
        var docViewTop = $(window).scrollTop(),
            docViewBottom = docViewTop + $(window).height(),
            elemTop = $(elem).offset().top,
            elemBottom = elemTop + $(elem).height();

        return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) &&
                (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop));
    },
    
    listViewArrowDown: function (ev) {
        var $target = $(ev.target),
            active = $('#srcnotes').find('.js-list-item.focus'),
            next = active.next();

        if ($target.hasClass('js-note-name')) {
            // move foucs to the first note
            $('#srcnotes').find('.js-list-item:first').addClass('focus');

        } else if (next.size()) {
            if (!this.isInView(next)) {
                $('#notes').animate({
                    scrollTop: next.offset().top
                });
            }
            active.removeClass('focus');
            next.addClass('focus');
        }
    },
    
    listViewArrowUp: function (ev) {
        $target = $(ev.target);
        active = $('#srcnotes').find('.js-list-item.focus');
        if (!$target.hasClass('js-note-name')) {
            active.removeClass('focus');
            var prev = active.prev();
            if (prev.size()) {
                if (!this.isInView(prev)) {
                    $('#notes').animate({
                        scrollTop: prev.offset().top
                    });
                }
                prev.addClass('focus');
            } else {
                $('#srcnotes .js-note-name').focus();
            }
        }
    },
    
    // hash String function http://www.cse.yorku.ca/~oz/hash.html
    hash: function (str) {
        var hash = 0,
            c;
        for (i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
            hash += c;
        }
        return hash;
    }
};
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
SRCNotes.Notes = Backbone.Collection.extend({
    model: SRCNotes.Note
});
SRCNotes.EditView = Backbone.View.extend({
    tagName: 'div',
    className: 'edit-form',
    // el: $('#srcnotes'),
    events: {
        'submit form.js-edit-form': 'saveContent',
        'click a.js-back': 'showList'
    },
    
    template: _.template(
        '<form action="#" method="post" class="pure-form js-edit-form pure-g">' +
            '<div class="pure-g action-menu">' +
                '<div class="pure-u-5-24">' +
                    '<a class="js-back pure-button"><i class="fa fa-angle-left"></i></a>' +
                '</div>' +
                '<div class="pure-u-19-24">' +
                    '<input type="text" value="{{ title }}" class="note-name">' +
                '</div>' +
            '</div>' +
            '<div class="note-content">' +
                '<textarea placeholder="Note...">{{ content }}</textarea>' +
            '</div>' +
        '</form>'
    ),
    
    initialize: function (cfg) {
        _.bindAll(this, 'saveContent', 'render');
        this.$parent = cfg.$parent;
        
        this.render();
        
        var interval = setInterval($.proxy(function () {
            var el = this.$el.find('.js-edit-form');
            
            if ($.contains(document, el[0])) {
                this.$el.find('.js-edit-form').submit();
            } else {
                clearInterval(interval);
            }
        }, this), 30000);
    },
    
    render: function () {
        $(this.el).append(this.template({
            title: this.model.escape('title'),
            content: this.model.escape('content')
        }));
        this.$parent.append(this.el);
        this.$el.find('textarea').focus();
    },
    
    saveContent: function (ev) {
        ev.preventDefault();
        var $target = $(ev.target);
        
        this.model.save({
            title: $target.find('input').val(),
            content: $target.find('textarea').val()
        });
        
    },
    
    showList: function (ev) {
        ev.preventDefault();
        this.$parent.find('.l-note').removeClass('edit-form-active');
        this.$parent.find('.js-note-name').focus();
        this.$parent.find('.js-note-name').trigger('keyup');
        this.$el.find('.js-edit-form').submit();
        this.remove();
    }
});
SRCNotes.ListView = Backbone.View.extend({
    el: $('#srcnotes'),

    events: {
        'keyup input.js-note-name': 'findItem',
        'submit form.js-add-new-item': 'addItem'
    },

    template: _.template(
        '<div class="l-note"><ul id="notes"></ul></div>'
    ),

    template_search_feld: _.template(
        // '<div id="header">BnoteOX</div>' +
        '<form action="#" method="post" class="pure-form js-add-new-item">' +
        '<input type="text" class="note-name js-note-name" placeholder="Note name"/></form>'
    ),
    
    initialize: function () {
        _.bindAll(this, 'render', 'addItem', 'moveFocus');

        this.items = new SRCNotes.Notes();

        this.items.on('add', function (model) {

            var t = new SRCNotes.NoteView({
                model: model,
                '$parent': this.$el
            });

            this.$notes.prepend(t.render().el);
        }, this);

    },

    render: function () {
        var $app = $(this.template()).prepend(this.template_search_feld());
        this.$el.append($app);
        this.$notes = this.$el.find('#notes');
        $app.find('.js-note-name').focus();
    },
    
    findItem: function (ev) {
        var name = $('.js-note-name').val(),
            pattern = new RegExp('^' + name);//, 'i'); case insensitive
        if (ev.keyCode === 40) {
            console.log(ev.keyCode);
            $(ev.target).blur();
        } else {
            this.items.each(function (model) {
                if (!pattern.test(model.get('title'))) {
                    model.set('show', false);
                } else {
                    model.set('show', true);
                }
            });
        }
    },
     
    addItem: function (ev) {
        ev.preventDefault();
        var title = $('.js-note-name').val(),
            item = this.items.get(helpers.hash(title));
        if (!item) {
            item = this.items.create({title: title});
            // item.save();
        }
        this.$el.find('.l-note').addClass('edit-form-active');
        this.editForm = new SRCNotes.EditView({
            model: item,
            '$parent': this.$el,
            'show': true
        });
    },
    
    moveFocus: function (position) {
        var $notes = this.$el.find('#notes');
        $notes.focus();
        $notes.find(':first').addClass('move');
    }
    
});
SRCNotes.NoteView = Backbone.View.extend({
    
    tagName: 'li',
    className: 'list-items js-list-item',
    events: {
        'click a': 'openNote'
    },
    
    template: _.template(
        '<a href="{{ title }}" class="js-open-note">{{ title }}</a>'
    ),
    
    initialize: function (cfg) {
        _.bindAll(this, 'render', 'openNote');
        this.$parent = cfg.$parent;
        
        this.model.on('remove', function () {
            $(this.el).remove();
        }, this);
        
        this.model.on('change', function () {
            this.render();
        }, this);
    },
    
    render: function () {
        this.$el.html(this.template({title: this.model.escape('title')}));
        if (this.model.get('show')) {
            this.$el.show('fast');
        } else {
            this.$el.hide('fast');
        }
        return this;
    },
    
    openNote: function (ev) {
        ev.preventDefault();
        this.$parent.find('.l-note').addClass('edit-form-active');
        this.editForm = new SRCNotes.EditView({
            model: this.model,
            '$parent': this.$parent
        });
    }
});
$(document).keydown(function (ev) {
    switch (ev.keyCode) {
        case 13:
            $('#srcnotes').find('.js-list-item.focus').find('a').click();
            break;
        case 40:
            helpers.listViewArrowDown(ev);
            break;
        case 38:
            helpers.listViewArrowUp(ev);
            break;
    }
});




var app = new SRCNotes.ListView();
// new SRCNotes.Notes();
app.render();
app.items.fetch();
}).call(this, jQuery, _, Backbone);
