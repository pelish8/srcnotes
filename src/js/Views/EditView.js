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