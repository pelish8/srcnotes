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