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