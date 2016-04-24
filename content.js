console.log('starting...');

;(function($){
    var self = this;
    window.GMailLabelStyler = this;
    var storage = chrome.storage.local;
    var cache = false;
    var label_dict = {};
    var key = 'GMailLabelStyler';

    function restyle() {
        var icon = $('[data-tooltip="Expand all"]');
        var table = icon.closest('table').attr('id','GMailLabelStyler');
        var stars = table.find('[role=checkbox][aria-label*=Starred],[role=checkbox][aria-label*=-star]');
        for(var i = 0; i<stars.length; i++) {
            var container = $(stars[i]).closest('table').parent().parent();

            var tab = $(stars[i]).closest('table');
            for(var j = 0; j<6 ; j++) {
                var test = tab.find('div[id] [role=checkbox][aria-label*=Starred], div[id] [role=checkbox][aria-label*=-star]')
                console.log('%d test: %d height: %d', j, test.length, tab[0].clientHeight);
                tab = tab.parent();
            }

            console.log('Container: %s', container.height());
            container.addClass('GMailLabelStyler');
        }
    }

    function updateStylesheet() {
        $('#GMailLabelStyler_styles').remove();
        var new_ss = $('<style id="GMailLabelStyler_styles"> \n'+
            '#GMailLabelStyler div.GMailLabelStyler div[id] { \n'+
            (cache.viewer_css || '') +
            '} \n' +
            '#GMailLabelStyler [aria-label="Message Body"] {\n' +
            '  color: darkblue; \n' +
            (cache.editor_css || '') +
            '} \n</style>');
        new_ss.appendTo('head')
    }

    function updateCache(items) {
        console.log('Updating cache: %s', JSON.stringify(items));
        if (!cache) {
            cache = items;
        }
        if (items.labels) {
            labels_dict = {};
            var labels = items.labels.split(',');
            for (var i = 0; i<labels.length; i++) {
                var label = labels[i].trim();
                console.log(i + ': "' + label + '"');
                label_dict[label] = true;
            }
            key = 'GMailLabelStyler_' + labels.join('_').replace(/[^-a-z0-9_]+/gi,'-');
            cache.items = items.labels;
        }
        cache.viewer_css = items.viewer_css ? items.viewer_css : cache.viewer_css;
        cache.editor_css = items.editor_css ? items.editor_css : cache.editor_css;
        if (items.viewer_css || items.editor_css) {
            updateStylesheet();
        }
    }

    storage.get(['viewer_css', 'editor_css', 'labels'], function(items) {
        updateCache(items);
        updateStylesheet();
        for(var p in items) {
            console.log("%s: %s", p, items[p]);
        }
    });

    chrome.storage.onChanged.addListener(function(changes, area){
        var items = {};
        for(var key in changes) {
            items[key] = changes[key].newValue;
        }
        updateCache(items);
    });

    var timer = setInterval(function(){
        var root = document.getElementById('GMailLabelStyler');
        if (root) {
            var h = root.clientHeight
            if (h !== root.GMailLabelStyler_height) {
                root.GMailLabelStyler_height = h;
                restyle();
            }
        } else {
            var icon = document.querySelector('[data-tooltip="Expand all"]:not(.'+key+')');
            if (icon && cache) {
                console.log("Styling... %s", key);
                icon.classList.add(key);
                restyle();
            }
        }
    }, 250);


}(Zepto));