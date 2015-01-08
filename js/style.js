
function byId(id, base) { return (base||document).getElementById(id); }


var stored = localStorage;
var settings = stored.settings ? JSON.parse(stored.settings) : {};
defaults(settings, default_settings);

function check_page() {
  if (!byId('page')) {
    setTimeout(check_page, 10);
    return;
  }
  change_background_style()
  change_background()
  change_background_gradient()
}
setTimeout(check_page, 10);

function change_background() {
  var bg = settings.background_image;
  var img = new Image;
  byId('page').style.opacity = 0;

  img.onload = img.onerror = function() {
    if (settings.background_fadein) {
      byId('page').style.webkitTransition = 'opacity .5s';
    }
    byId('page').style.backgroundImage = 'url(' + bg + ')';
    byId('page').style.opacity = 1;
  };
  img.src = bg;
  
}

function change_background_gradient() {
  if (!settings.background_gradient) {
    byId('page-gradient').style.background = 'transparent';
  } else {
    byId('page-gradient').style.background = '';
  }
}

function change_background_style() {
  var page = byId('page');
  var style = settings.background_style;
  if ('fill' == style) {
    page.style.backgroundSize = 'cover';
    //page.style.backgroundRepeat = 'repeat';
  } else if  ('stretch' == style) {
    page.style.backgroundSize = '100% 100%';
  } else {
    page.style.backgroundSize = '';
  }
}

function clone(obj) {
  var copy = {};
  for (var i in obj)
    if (obj.hasOwnProperty(i))
      copy[i] = obj[i];
  return copy;
}

function defaults(a, b) {
  for (var i in b)
    if (!a.hasOwnProperty(i) && b.hasOwnProperty(i))
      a[i] = b[i];
  return a;
}