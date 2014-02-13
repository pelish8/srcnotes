SRCNotes.ListView = Backbone.View.extend({
    el: '#srcnotes',

    events: {
        'keyup input.js-note-name': 'findItem',
        'submit form.js-add-new-item': 'addItem'
    },
    
    initialize: function () {
        _.bindAll(this, 'render', 'addItem', 'moveFocus');

        this.items = new SRCNotes.Notes();
        
        this.listenTo(this.items, 'sync', $.proxy(function (items) {
            items.sortBy(function (item) {
                return item.get('date').getTime();
            });
            console.log(items);
        }, this));
        this.items.on('add', function (model) {
        
            var t = new SRCNotes.NoteView({
                model: model,
                '$parent': this.$el
            });
        
            this.$notes.prepend(t.render().el);
        }, this);

    },

    render: function () {
        var $app = $(template('template-list-view-l'));
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