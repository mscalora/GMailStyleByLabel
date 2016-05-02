var storage = chrome.storage.local;

// Get at the DOM controls used in the sample.
var submitButton = document.querySelector('button.submit');
var addButton = $('button.add');
var subButton = $('button.sub');
var textarea = document.querySelector('textarea');

function saveSettings() {

  var sections = [];

  $('section').each(function(){
    sections.push({
      label: $('[name=label]', this).val()||'',
      viewer_css: $('[name="viewer_css"]', this).val()||'',
      editor_css: $('[name="editor_css"]', this).val()||''
    });
  });

  storage.set({sections: sections}, function() {
    message('Settings saved');
  });
}

function loadSettings() {
  storage.get(['sections'], function(items) {
    for(var i = 0; i < items.sections.length; i++) {
      if (i) {
        autosize($('section').first().clone().appendTo('article').find('input, textarea').val(''));
      }
      var entry = items.sections[i];
      var section = $('section').last();
      $('[name=label]', section).val(entry.label||'');
      $('[name="viewer_css"]', section).val(entry.viewer_css||'');
      $('[name="editor_css"]', section).val(entry.editor_css||'');
    }
  });
}

function reset() {
  // Remove the saved value from storage. storage.clear would achieve the same
  // thing.
  storage.remove('css', function(items) {
    message('Reset stored CSS');
  });
  // Refresh the text area.
  textarea.value = '';
}

function message(msg) {
  var message = document.querySelector('.message');
  message.innerText = msg;
  setTimeout(function() {
    message.innerText = '';
  }, 5000);
}

autosize($('textarea'));

addButton.on('click', function(){
  autosize($('section').first().clone().appendTo('article').find('input, textarea').val(''));
});

subButton.on('click', function(){
  if ($('section').length>1) {
    $('section').last().remove();
  }
});

// Load any CSS that may have previously been saved.
loadSettings();

submitButton.addEventListener('click', saveSettings);
