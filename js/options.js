
// animation
/*
var options_el = document.getElementsByClassName('options')[0];
options_el.style.webkitTransform = "translate3d(0, "+ (window.innerHeight*0.8) +"px, 0)";
setTimeout(function(){
  options_el.style.webkitTransition = "-webkit-transform 1s";
  options_el.style.webkitTransform = "";
}, 1);
*/

function byId(id, base) { return (base||document).getElementById(id); }

var apps_with_notification = {
  'pjkljhegncpnkpknbcohdijeoejaedia': 'Gmail',
  'pjjhlfkghdhmijklfnahfkpgmhcmfgcm': 'Google Reader',
  'dlppkpafhbajpcmmoheippocdidnckmm': 'Google Plus',
  'ejjicmeblgpmajnghnpcppodonldlgfn': 'Google Calendar',
  'yahoo-mail': 'Yahoo Mail',
  'hotmail':    'Hotmail',
  'facebook':   'Facebook'
  //,'twitter':    'Twitter'
};

//var stored = localStorage;
//var settings = stored.settings ? JSON.parse(stored.settings) : clone(default_settings);
var bg = chrome.extension.getBackgroundPage();
var apps = bg.apps, custom_apps = bg.custom_apps;
var el = byId("notification-options");

// load settings on init
for (var i in apps_with_notification) {
  if (i == 'ejjicmeblgpmajnghnpcppodonldlgfn' ||      // Calendar doesn't need to be installed
      apps[i] && (apps[i].enabled || custom_apps[i])) { // others do
    el.insertAdjacentHTML("beforeend", generate_notification_html(apps, i));
  }
}

function generate_notification_html(apps, i) {
  var checked = ("undefined" == typeof settings.notifications[i] || settings.notifications[i]) ? "checked='checked'" : '';
  return '<label><input type="checkbox" '+ checked +' id="'+ i +'" /> '+ 
                 apps_with_notification[i] + ' ' +
         '</label>';
}


byId('fetch_interval').value = settings.fetch_interval;
byId('time_format').value    = settings.time_format;

byId('background_style').value      = settings.background_style;
byId('background_gradient').checked = settings.background_gradient;
byId('background_fadein').checked   = settings.background_fadein;
byId('background-preview').src      = settings.background_image;


function handle_file_select(e, callback) {
  var file = e.target.files[0]; // FileList object

 // Only process image files.
  if (!file.type.match('image.*')) {
    alert("Error: Only image files are allowed for background!")
    return;
  }

  var reader = new FileReader();

  // Closure to capture the file information.
  reader.onload =  function(e) {
    byId('background-preview').src = e.target.result;
    save_file(file.name, e.target.result, callback);
    if (settings.background_image)
      remove_file(extract_filename(settings.background_image))
  };

  // Read in the image file as a data URL.
  reader.readAsDataURL(file);
}

//byId('files').addEventListener('change', handle_file_select, false);


function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function extract_extension(filename) {
  return filename.split(".").pop();
}

function extract_filename(path) {
  return path.split('/').pop();
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    var array = []
    for(var i = 0; i < byteString.length; i++) {
        array.push(byteString.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: mimeString});
}

function read_file(file, callback) {
  var reader = new FileReader();
  reader.onload = function (event) {
    callback(event.target.result);
  };
  reader.readAsDataURL(file);
}

function save_file(filename, dataURI, callback) {
  fs.root.getFile(filename, {create: true}, function(fileEntry) {
    fileEntry.createWriter(function(fileWriter) {
      fileWriter.onwriteend = function(e) {
        callback && callback(fileEntry.toURL());
      };
      fileWriter.write(dataURItoBlob(dataURI));
    }, error_handler);
  }, error_handler);
}

function remove_file(filename, callback) {
  fs.root.getFile(filename, {create: false}, function(fileEntry) {
    fileEntry.remove(function() {
      callback && callback();
    }, error_handler);
  }, error_handler);
}

var list_files = function(callback) {
  var entries = [];
  var reader = fs.root.createReader();
  function read_entries() {
    reader.readEntries(function (results) {
      if (!results.length) {
        callback(entries.sort());
      } else {
        entries = entries.concat(toArray(results));
        read_entries();
      }
    }, error_handler);
  }
  read_entries();
}


// save on every change
function on_change(e) {

  // notification settings
  if (e.target.type && e.target.type == "checkbox") {
    if (e.target.parentNode.parentNode.id == 'notification-options') {
      settings.notifications[e.target.id] = e.target.checked;
    } else {
      settings[e.target.id] = e.target.checked;
    }
    if (e.target.id == 'background_gradient') {
      change_background_gradient();
    }
  }
  // other settings
  else if (e.target.nodeName == "SELECT") {
    settings[e.target.id] = e.target.value;
    if (e.target.id == 'background_style') {
      change_background_style();
    }
  }
  // background image settings
  else if (e.target.type && e.target.type == "file") {
    handle_file_select(e, function (url) {
      byId('default-background').disabled = false;
      settings[e.target.id] = url;
      change_background();
      save_settings();
    });
  }
  save_settings();
}

function save_settings() {
  stored.settings = JSON.stringify(settings);
  bg.settings = settings;
  bg.FETCH_INTERVAL = settings.fetch_interval * 60  * 1000;
}

document.addEventListener("change", on_change, true);


var error_handler = (function () {
  var codes = ['Unknown Error'];
  for (var err_msg in FileError) {
    var err_code = FileError[err_msg];
    if ('number' == typeof err_code && 
        err_msg.indexOf('ERR') > -1) {
      codes[err_code] = err_msg;
    }
  }   
  return function (e) {
    console.log(codes[e.code||0]);
  }
})();

byId('default-background').onclick = function() {
  // reset form default values
  byId('default-background').disabled = true;
  byId('background_gradient').checked = true;
  byId('background_style').value = default_settings.background_style;
  byId('background-preview').src = default_settings.background_image;
  // reset default settings
  settings.background_style = default_settings.background_style;
  settings.background_gradient = default_settings.background_gradient;
  settings.background_image = default_settings.background_image;
  save_settings();
  // update UI
  change_background_style();
  change_background();
  change_background_gradient();
}

if (settings.background_image == default_settings.background_image) {
  byId('default-background').disabled = true;
}


// init PERSISTENT file system
var fs;
function on_init_file_system(filesystem) { fs = filesystem; }
window.requestFileSystem || (window.requestFileSystem = window.webkitRequestFileSystem);
window.requestFileSystem(window.PERSISTENT, 50*1024*1024, on_init_file_system, error_handler);
