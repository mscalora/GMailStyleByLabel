;(function($){
    var debug = function(){};
    debug = console.log.bind(window.console);

    debug('GMLS: starting...');

    var storage = chrome.storage.local;
    var cache = false;
    var label_dict = {};
    /* key changes when labels change in options dialog */
    var key = 'GMailLabelStyler';

    function attachId() {
        var icon = $('[data-tooltip="Expand all"]');

        if (icon.length) {
            var table = icon.closest('table');
            var found = false;
            var labels = table.find('[name][role=button][title^=Search]');
            labels.each(function(){
                var text = $(this).text().toString().trim();
                if (label_dict[text]) {
                    debug('GMLS: Found: ' + text);
                    found = true;
                }
            });
            
            if (found) {
                table.attr('id', key);
                var notice = $('#GMailLabelStyler_notice');
                if (!notice.length) {
                    notice = $('<div id="GMailLabelStyler_notice" title="Message styled by the GMailLabelStyler extension">Styled</div>');
                    labels.last().closest('table').after(notice);
                }
                notice.off('click').on('click',function(evt){
                    table.toggleClass("GMLS-disabled");
                });
            }
        }

    }

    /* install and update our stylesheet */
    function updateStylesheet() {
        $('#GMailLabelStyler_styles').remove();
        var new_ss = $('<style id="GMailLabelStyler_styles"> \n'+
            '#' + key + ':not(.GMLS-disabled) div[id] * { \n'+
            (cache.viewer_css || '') +
            '} \n' +
            '#' + key + ':not(.GMLS-disabled) [aria-label="Message Body"] * {\n' +
            (cache.editor_css || '') +
            '} \n' +
            '#GMailLabelStyler_notice {\n' +
            '  display: inline-block; \n' +
            '  font: 11px arial,sans-serif; \n' +
            '  font-weight: 500; \n' +
            '  color: white !important; \n' +
            '  background: black; \n' +
            '  padding: 2px 4px; \n' +
            '  vertical-align: top; \n' +
            '  margin-top: 3px; \n' +
            '  cursor: pointer; \n' +
            '} \n' +
            '#GMailLabelStyler_notice:hover {\n' +
            '  background: #444; \n' +
            '} \n</style>');
        new_ss.appendTo('head')
    }

    /* setup data cache on initial load and changes so we update live when user saves in settings */
    function updateCache(items) {
        debug('GMLS: Updating cache: %s', JSON.stringify(items));
        if (!cache) {
            cache = items;
        }
        if (items.labels) {
            labels_dict = {};
            var labels = items.labels.split(',');
            for (var i = 0; i<labels.length; i++) {
                var label = labels[i].trim();
                debug('GMLS: %d: "%s"', i, label);
                label_dict[label] = true;
            }
            /* create valid class/id from list of labels */
            key = 'GMailLabelStyler_' + labels.join('_').replace(/[^-a-z0-9_]+/gi,'-');
            cache.items = items.labels;
        }
        cache.viewer_css = items.viewer_css ? items.viewer_css : cache.viewer_css;
        cache.editor_css = items.editor_css ? items.editor_css : cache.editor_css;
        updateStylesheet();
    }

    /* initial cache fill */
    storage.get(['viewer_css', 'editor_css', 'labels'], function(items) {
        updateCache(items);
        updateStylesheet();
        for(var p in items) {
            debug('GMLS: loaded data "%s": "%s"', p, items[p]);
        }
    });

    /* update cache on change */
    chrome.storage.onChanged.addListener(function(changes, area){
        var items = {};
        for(var key in changes) {
            items[key] = changes[key].newValue;
        }
        updateCache(items);
    });

    /* watch for changes to know when we will attach id */
    var timer = setInterval(function(){
        var root = document.getElementById(key);
        if (!root) {
            var icon = document.querySelector('[data-tooltip="Expand all"]');
            if (icon && cache) {
                debug('GMLS: Attaching... %s', key);
                attachId();
            }
        }
    }, 200);

}(Zepto));