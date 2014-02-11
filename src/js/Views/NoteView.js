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