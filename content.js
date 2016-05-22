;(function($){
    var debug = function(){};
    //debug = console.log.bind(window.console);

    debug('GMLS: starting...');

    var storage = chrome.storage.local;
    var cache = false;
    var keyLookup = {};
    var labelLookup = {};
    /* key changes when label change in options dialog */
    var key = 'GMailLabelStyler';

    function updateClasses() {
        var icon = $('[role=button][data-tooltip="Print all"]');
        icon = icon.length ? icon : $('[role=button][title="Print all"]');

        if (icon.length) {
            var table = icon.closest('table');
            var styled = false;
            var pills = table.find('[name][role=button][title^=Search]');
            var keys = [];

            pills.each(function(){
                var text = $(this).text().toString().trim();
                if (labelLookup[text]) {
                    styled = true;
                    var key = labelLookup[text].key;
                    keys.push(key);
                    if ($('.'+key).length==0) {
                        table.addClass(key);
                        debug('Found missing key for: ' + text);
                    }
                }
            });

            for (cls in table.classList) {
                if (cls.search(/^GMLS/)==0 && !(cls in keyLookup)) {
                    table.removeClass(cls);
                    debug('Found extra key for: ' + cls);
                }
            }

            if (styled) {
                var notice = $('#GMailLabelStyler_notice');
                if (!notice.length) {
                    notice = $('<div id="GMailLabelStyler_notice" title="Message styled by the GMail Label Styler extension">Styled</div>');
                    pills.last().closest('table').after(notice);
                }
                notice.off('click').on('click',function(evt){
                    table.toggleClass("GMLS-disabled");
                });
            } else {
                $('#GMailLabelStyler_notice').remove();
            }
        }

    }

    /* install and update our stylesheet */
    function updateStylesheet() {
        var styles = "";
        $.each(keyLookup,function(key, entry){
            style = '.'+key+':not(.GMLS-disabled) .ii { \n' +
                (entry.viewer_css || '') + '\n' +
                '}\n' +
                '.'+key+':not(.GMLS-disabled) [aria-label="Message Body"] { \n' +
                (entry.editor_css || '') + '\n' +
                '}\n\n';
            styles += style;
        });

        $('#GMailLabelStyler_styles').remove();
        var new_ss = $('<style id="GMailLabelStyler_styles"> \n'+ styles +
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
            '} \n' +
            '.GMLS-disabled #GMailLabelStyler_notice:before {\n' +
            '  content: "!"; \n' +
            '} \n</style>');
        new_ss.appendTo('head')
    }

    /* setup data cache on initial load and changes so we update live when user saves in settings */
    function updateCache(items) {
        debug('GMLS: Updating cache: %s', JSON.stringify(items));
        if (!cache) {
            cache = items;
        }
        entryByLabelKey = {};
        labelLookup = {};

        if (items.sections) {
            for (int = i = 0; i < items.sections.length; i++) {
                var entry = items.sections[i];
                if (entry.label) {
                    var label = entry.label.trim();
                    var labelKey = 'GMLS_'+label.replace(/[^-_\w]/g,'•');
                    entry.key = labelKey;
                    keyLookup[labelKey] = entry;
                    labelLookup[label] = entry;
                }
            }
        }
        cache = true;
    }

    /* initial cache fill */
    storage.get(['sections'], function(items) {
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
        updateStylesheet();
    });

    /* watch for changes to know when we will attach id */
    var cacheHeight = 0;
    var counter = 0;
    var cacheTitle = null;
    var timer = setInterval(function(){
        var height = (document.getElementById(key) || { clientHeight: -1 }).clientHeight;
        var title = ($('h2').slice(-1)[0] || {}).innerText;
        counter++;
        if (height!==cacheHeight || counter>6 || title !== cacheTitle) {
            debug("Fired because:"
                + (height!==cacheHeight?" HEIGHT":"")
                + (counter>6?" COUNTER":"")
                + (title !== cacheTitle?" TITLE":"")
            );
            if (cache) {
                updateClasses();
                cacheHeight = height;
                cacheTitle = title;
                counter = 0;
            }
            if (height<0) {
                $('[role=main]').attr('id', key);
            }
        }
    }, 250);

}(Zepto));