var storage = chrome.storage.local;

// Get at the DOM controls used in the sample.
var resetButton = document.querySelector('button.reset');
var submitButton = document.querySelector('button.submit');
var textarea = document.querySelector('textarea');

// Load any CSS that may have previously been saved.
loadChanges();

submitButton.addEventListener('click', saveChanges);
resetButton.addEventListener('click', reset);

function saveChanges() {

  var labels = document.getElementById('labels').value;
  if (!labels) {
    message('Error: No labels specified');
    return;
  }

  var viewer_css = document.getElementById('viewer_css').value || '';
  var editor_css = document.getElementById('editor_css').value || '';

  storage.set({viewer_css: viewer_css, editor_css: editor_css, labels: labels}, function() {
    message('Settings saved');
  });
}

function loadChanges() {
  storage.get(['viewer_css', 'editor_css', 'labels'], function(items) {
    for (var prop in items) {
      var node = document.getElementById(prop);
      if (node) {
        node.value = items[prop] || '';
      }
      message('Loaded saved settings');
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
