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
        var entries = [],
            keys = [];
        var pills = document.querySelectorAll('[name][role=button][title^=Search]'),
            noticeContainer;
        for (let pill of Array.from(pills)) {
            let labelName = (pill.innerText || '').trim().toLowerCase(),
                entry = labelLookup[labelName];
            if (entry) {
                if (JSON.stringify(labelLookup).includes('GMLS-DEBUG')) {
                    pill.style.border = '2px solid red';
                }
                entries.push(entry);
                keys.push(labelLookup[labelName].key);
            }
            noticeContainer = pill.closest('table').closest('div');
        }
        for (let key of Object.keys(keyLookup)) {
            if (keys.includes(key)) {
                document.body.classList.add(key);
            } else {
                document.body.classList.remove(key);
            }
        }
        if (entries.length) {
            let tab = pills[0].closest('table[role="presentation"]'),
                msg = tab && tab.querySelector('[data-message-id]'),
                contentNode = msg && msg.children.item(1) && msg.children.item(1).children.item(2);
            if (contentNode) {
                for (let entry of entries) {
                    contentNode.classList.add('GMLS-viewer-content');
                }
            }
            if (noticeContainer) {
                var notice = document.querySelector('#GMailLabelStyler-notice');
                if (!notice) {
                    html = '<div id="GMailLabelStyler-notice" title="Message styled by the GMail Label Styler extension">Styled</div>';
                    noticeContainer.insertAdjacentHTML('beforeend', html);
                    notice = document.querySelector('#GMailLabelStyler-notice');
                    notice.addEventListener('click', e => document.body.classList.toggle("GMLS-disabled"));
                }
            }
        } else {
            $('#GMailLabelStyler-notice').remove();
        }
    }

    /* install and update our stylesheet */
    function updateStylesheet() {
        var styles = "";
        $.each(keyLookup,function(key, entry){
            style = `
              body:not(.GMLS-disabled).${key} .GMLS-viewer-content div {
                ${entry.viewer_css}
              }
              body:not(.GMLS-disabled).${key} [aria-label="Message Body"] {
                ${entry.editor_css}
              }
            `;
            styles += style;
        });

        $('#GMailLabelStyler_styles').remove();
        var new_ss = $(`<style id="GMailLabelStyler_styles"> 
            ${styles}
              #GMailLabelStyler-notice {
                display: inline-block; 
                font: 11px arial,sans-serif; 
                font-weight: 500; 
                color: white !important; 
                background: black; 
                padding: 2px 4px; 
                vertical-align: top; 
                margin-top: 3px; 
                cursor: pointer; 
              } 
              #GMailLabelStyler-notice:hover {
                background: #444; 
              } 
              .GMLS-disabled #GMailLabelStyler-notice:before {
                content: "!"; 
              }
            </style>`);
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
                    var labelKey = 'GMLS-label-'+label.replace(/[^-_\w]/g,'•');
                    entry.key = labelKey;
                    keyLookup[labelKey] = entry;
                    labelLookup[label.toLowerCase()] = entry;
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
