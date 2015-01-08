

function byId(id, base) { return (base||document).getElementById(id); }
function bench(text) { console.log( (text||"") + ": " + (+new Date - start) ); }


var default_settings = {
  fetch_interval: '1',
  time_format:    '24',
  notifications: {}
};

var stored = localStorage;
//var settings = stored.settings ? JSON.parse(stored.settings) : default_settings;
var html = document.documentElement;
var requestAnimationFrame = window.webkitRequestAnimationFrame; //function(fn){ setTimeout(fn, 7); }//

var bg = chrome.extension.getBackgroundPage();
var apps;
var ordered = [];
var tabs = {};
var tabs_history = {};
var recently_closed_tabs = new Array(10);
var page = byId("page");
var ITEM_SEPARATOR = "\\c";
var FIELD_SEPARATOR = "\\a";
var start = +new Date;
var last_sound = +new Date;
var MAX_NOTIFICATIONS = 10; // shown / stored
var MAX_NOTIFICATIONS_SHOWN = 10; // shown / stored

var ICONS = {
  'tweet':      'icons/twitter.png',/// TODO remove later
  'twitter':    'icons/twitter.png',
  'mail':       'icons/mail.png',
  'gmail':      'icons/gmail.png',
  'yahoo-mail': 'icons/yahoo-mail.png',
  'hotmail':    'icons/hotmail.png',
  'news':       'icons/news.png',
  'facebook':   'icons/facebook.png'
};

var indicators = {
  'pjkljhegncpnkpknbcohdijeoejaedia': 'gmail',
  'pjjhlfkghdhmijklfnahfkpgmhcmfgcm': 'greader',
  'dlppkpafhbajpcmmoheippocdidnckmm': 'gplus',
  'yahoo-mail': 'yahoo-mail',
  'hotmail':    'hotmail',
  'facebook':   'facebook'
};


function easing(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };


function rec() {
  launch_app_animation(rec)
}
//rec();

function launch_app_animation(callback) {
  setTimeout(callback,1); return; ///

  var el = document.getElementsByClassName('open-app')[0];
  var overlay = document.getElementsByClassName('open-app-overlay')[0];

  //el.style.cssText += "; top:0; right:0; bottom:0; left:0;";
  el.style.display = "block";
  overlay.style.display = "block";

  var start = +new Date;
  var duration = 3000//300;

  function step(timestamp) {
    timestamp || (timestamp = +new Date);
    var pos  = (timestamp - start) / (duration) + 0.1;
    var pos2 = (timestamp - start) / (duration*0.5) + 0.05;
    var pos3 = (timestamp - start) / (duration);
    pos  = pos  < 1 ? pos  : 1;
    pos2 = pos2 < 1 ? pos2 : 1;
    pos2 = pos3 < 1 ? pos3 : 1;
    var percentage = (50 - easing(pos) * 50) + "%";
    el.style.top    = percentage
    el.style.right  = percentage;
    el.style.bottom = percentage;
    el.style.left   = percentage;
    el.style.opacity = easing(pos2);
    overlay.style.opacity = easing(pos3);
    if (pos < 1) {
      requestAnimationFrame(step);
    }
    else setTimeout(callback,1);
  }
  requestAnimationFrame(step);
}

function get_domain(url) {
  return url.split("/")[2];
}

function hide_overlays() {
  var overlay_foreground = document.getElementsByClassName('open-app')[0];
  var overlay_background = document.getElementsByClassName('open-app-overlay')[0];
  overlay_foreground.style.display = "none";
  overlay_background.style.display = "none";
}

function select_tab(id) {
  chrome.tabs.update(id, {active: true});
}

function launch_app(el, new_tab) {

  var url   = el.dataset.url;
  var app   = apps[el.id];
  var newTabId = app.tabId;

  // we have a running tab for the app
  if (newTabId) {
    launch_app_animation(function(){
      select_tab(newTabId);
      hide_overlays();
    });
    return;
  }

  function create_tab(url) {
    chrome.tabs.create({
      url: url,
      active: true//true///false
    }, function(tab) {
      newTabId = tab.id;
    });
  }

  // different ways to open the app
  if (!url)
    chrome.management.launchApp(app.id);
  else if (new_tab)
    create_tab(url);
  else 
    chrome.tabs.update({url: url});

  /*
  launch_app_animation(function(){
    app.tabId = newTabId;
    app.domain = get_domain(url);
    tabs[newTabId] = app;

    //create_tab();

    select_tab(newTabId);
    hide_overlays();
  });
  */
}


chrome.extension.onMessage.addListener(function(message) {
  message.name && 
  'function' == typeof window[message.name] && 
  window[message.name].apply(window, message.args);
});

function set_indicator(id, count) {
  var key = "indicator-" + id;
  var el = document.getElementById(key);
  el.innerHTML = count;
  if (+count)
    el.style.display = "block";
  else
    el.style.display = "none";
  stored[key] = count;
  cache_set_app_html(el.parentNode);
}

function generate_indicator(name) {
  var count = +stored["indicator-"+name];
  var style = count ? "display:block" : "";
  return '<div class="indicator" id="indicator-'+name+'" style="'+style+'">'+ count +'</div>';
}

function create_notification(icon, title, body) {

  /*
  if (icon == 'tweet' && +new Date - last_sound > 1000)  {
    last_sound = +new Date;
    byId('twittersound', bg.document).currentTime = 0;
    byId('twittersound', bg.document).play();
  }
  */

  icon = ICONS[icon] || icon;

  // update UI
  var container = byId('notifications');
  var items = container.getElementsByClassName('box-text');
  var item = document.createElement('div');
  item.className = 'box-text';
  item.style.opacity = 0;
  item.innerHTML = '<img src="'+ icon +'" class="ticker-icon" /><div class="bd"><strong>'+ title +'</strong> '+ body + '</div>';
  container.insertBefore(item, container.firstChild);
  if (items.length > MAX_NOTIFICATIONS_SHOWN) {
    container.removeChild(container.lastChild);
  }

  // notification animation

  // start at zero height
  var height = item.offsetHeight;
  item.style.webkitTransition = "none";
  item.style.height = 0;
  //item.style.webkitTransform = "rotateX(90deg)";

  // open up and fade in
  setTimeout(function(){
    item.style.webkitTransition = "";
    item.style.height = height + "px";
    item.style.opacity = 1;
    //item.style.webkitTransform = "";
  }, 10);

  // reset auto height after animation finished
  item.addEventListener("webkitTransitionEnd", function transitionEnd(e) {
    if (e.propertyName == "height") {
      item.removeEventListener("webkitTransitionEnd", transitionEnd);
      item.style.webkitTransition = "none";
      item.style.height = "";
    }
  });
}

function play_notification_sound(type) {
}

function show_recent_notifications() {
  var container = byId('notifications');
  var notifications = stored.notifications.split(ITEM_SEPARATOR);
  var max = Math.min(notifications.length, MAX_NOTIFICATIONS_SHOWN);
  var html = "";
  if (!notifications[0]) return;
  for (var i = 0; i < max; i++) {
    var parts = notifications[i].split(FIELD_SEPARATOR);
    html += '<div class="box-text"><img src="'+ parts[0] +'" class="ticker-icon" /><div class="bd"><strong>'+ parts[1]  +'</strong> '+ parts[2]  + '</div></div>';
  }
  container.innerHTML = html;
}

function clickable_links() {}

function save_ordered() {
  stored.icons_order = ordered.join(',');
}

function load_ordered() {
  if (stored.icons_order)
    return stored.icons_order.split(',');
}

function get_app_html(app) {
  if (app.name.indexOf("Google ") > -1)
    app.name = app.name.replace('Google ', '');
  if (app.name == "Store")
    app.name = "Install apps";
  var name = app.name.length <  14 ? app.name : app.name.slice(0,12) + '.';
  var icon = app.icons.filter(function(icon){ return icon.size == 128; })[0];
  icon = (app.id == 'ejjicmeblgpmajnghnpcppodonldlgfn') ? get_calendar_icon() : '<img src="'+ icon.url +'">';
  return '<div class="test-item" id="'+ app.id +'" data-url="'+ app.appLaunchUrl +'">' +
            (indicators[app.id] ? generate_indicator(indicators[app.id]) : '') +
            '<div class="test-item-launcher">' +
              icon +
            '<\/div>' +
            '<div class="test-item-text">' + name + '<\/div>' +
         '<\/div>';
}

function get_apps_page_html() {

  var fragments = [];

  // build html (ignoring disabled apps)
  ///
  //for (var i = 0; i < ordered.length; i++) {
  //  var page_items = ordered[i];
  var page_items = ordered;
    for (var j = 0; j < page_items.length; j++) {
      var id  = page_items[j];
      var app = apps[id];
      // if the app got deleted (e.g.: Google removed it from the store)
      // we should ignore it
      if (!app) {
        //delete ordered[id]; 
        continue;
      }
      if (app.id == "pfpeapihoiogbcmdmnibeplnikfnhoge") {
        continue; ///original hotmail
      }
      var html = cache_get_app_html(app);
      if (!html) {
        html = get_app_html(app);
        cache_set_app_html(app, html);
      }
      fragments.push(html);
    }
  //}

  return fragments.join('');
}

function cache_set_app_html(app, html) {
  var id = (typeof app == 'string') ? app : app.id;
  html || (html = get_app_html(apps[id]));
  stored['app_html_' + id] = html;
}

function cache_get_app_html(app) {
  ///get_app_html(app);
  /// cachin turned off currently

  /// no caching for webstore (temporary)
  if (app.name == 'Store')
    return get_app_html(app);

  // no caching for live Calendar icon
  if (app.id == 'ejjicmeblgpmajnghnpcppodonldlgfn')
    return get_app_html(app);
  // everything else is fine
  var id = (typeof app == 'string') ? app : app.id;
  return stored['app_html_' + app.id];

}

function apps_init() {

  bg = chrome.extension.getBackgroundPage();

  // when launching the browser, wait for the bg page to be ready
  if (!bg || !bg.apps) {
    setTimeout(apps_init, 10);
    return;
  }

  
  apps = bg.apps;
  ordered = load_ordered();

  build_apps_pages();
}


function push_to_empty_index(array2d, item) {
  for (var i = 0; i < array2d.length; i++) {
    if (array2d[i].length < 20) {
      array2d[i].push(item);
      return;
    }
  }
  // new page, first item
  array2d[i] = [item];
}

function build_apps_pages() {
  var apps_page = byId('apps-pages-list')/// document.getElementsByClassName('apps-page')[0];
  apps_page.innerHTML = get_apps_page_html();
  window.draggable_init();
}

function purge_html_cache() {
  delete stored.icons_order;
  for (var i = 0; i < ordered.length; i++)
    delete stored['app_html_' + ordered[i]];
}

function dom_ready() {
  ///bench('ready');///
  refresh_date_loop();
  refresh_event_start();
  apps_init();
  show_recent_notifications();
  //new ApplicationPanel(byId('apps-wrapper'));
}

var months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function refresh_date() {
  var date = new Date;
  var hours = date.getHours();
  if (settings.time_format == '12') {
    hours = (hours == 12) ? 12 : hours % 12;
  }
  // date.toLocaleDateString().slice(0, -6);
  byId("date").innerHTML = days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' +  date.getDate();
  byId("time").innerHTML = prefix_with_zero(hours) +
                           ":" + prefix_with_zero(date.getMinutes());
  return date;
}

function refresh_date_loop() {
  var date = refresh_date();
  setTimeout(refresh_date_loop, (60 - date.getSeconds()) * 1000);
}

function prefix_with_zero(num) {
  return num < 10 ? '0' + num : ''+num;
}

function format_time(date) {
  var hours = date.getHours();
  var mins = date.getMinutes();
  var ampm = (hours < 12) ? 'AM' : 'PM';
  hours = (hours == 12) ? 12 : hours % 12;
  return hours + ':' +  prefix_with_zero(mins) + ' ' + ampm;
}

// it assumes a date in the future (google calendar)
function format_day(date) {
  var today = new Date;
  if (today.toDateString() == date.toDateString()) {
    return 'Today';
  } 

  var tomorrow = new Date;
  tomorrow.setDate(tomorrow.getDate()+1);
  if (tomorrow.toDateString() == date.toDateString()) {
    return 'Tomorrow';
  } 

  var end_of_week = new Date()
  var day = today.getDay();
  end_of_week.setDate( 7 + today.getDate() - day + (day == 0 ? -6 : 1)  );
  end_of_week.setHours(0)
  end_of_week.setMinutes(0);
  if (+date < +end_of_week) {
    return days[date.getDay()];
  }

  var end_of_next_week = new Date(end_of_week)
  end_of_next_week.setDate( end_of_week.getDate() + 7 );
  if (+date < +end_of_next_week) {
    return 'Next ' + days[date.getDay()];
  }
}

function refresh_event_start() {
  // listen to all new events
  chrome.extension.onMessage.addListener(function(message){
     if (message.name == 'upcoming-event') {
        refresh_event(message.data)
     }
  });
  // fetch current calendar events
  chrome.extension.sendMessage("get-calendar-events", refresh_event);
}

function refresh_event(events) {

  // calendar notifications turned off
  if (settings.notifications['ejjicmeblgpmajnghnpcppodonldlgfn'] === false) {
    byId('upcoming-event').innerHTML = "";
    return;
  }

  // no events found (or url is down)
  if (!events.length) {  
    byId('upcoming-event').innerHTML = "";
    return;
  }

  // everything is ok
  var event = events[0];
  event.start = new Date(event.startTime);
  event.end = new Date(event.endTime);

  var start = format_time(event.start);
  var end = format_time(event.end);
  var day = format_day(event.start);

  var arr = [];
  event.title && arr.push(event.title);
  // event.description  && arr.push(event.description);
  event.location  && arr.push(event.location);

  day && arr.push(day); /// NOTE: doesn't support multi-day events

  if (event.end - event.start != 86400000) {
    arr.push(start + ' - ' + end);
  } else {
    arr.push('All Day');
  }
  
  byId('upcoming-event').innerHTML = arr.join('<br/>');
  byId('upcoming-event').href = event.url;
}


window.addEventListener("DOMContentLoaded", dom_ready, false);

function get_calendar_icon() {

  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var date = new Date;

  var week_day = days[date.getDay()];
  var year = date.getFullYear();
  var month = months[date.getMonth()];
  var month_day = date.getDate();

  return '<div id="cal-icon-overlay"></div>' +
         '<div id="cal-icon">' +
          '<div id="cal-icon-content">' +
            '<div id="cal-icon-header">'+ month +'</div>' +
            '<div id="cal-icon-month-day">'+ month_day +'</div>' +
            '<div id="cal-icon-week-day">'+ week_day +'</div>' +
          '</div>' +
        '</div>';
}

byId("qnote-text").onfocus = function(e) {
  byId("qnote-editor").style.opacity = 1;
}

byId("qnote-text").onblur = function(e) {
  byId("qnote-editor").style.opacity = 0;
}

byId("qnote-editor").onmousedown = function(e) {
  e.preventDefault();
}
byId("qnote-editor").onclick = function(e) {
  byId("qnote-text").focus();
  var cmd = e.target.dataset.cmd;
  if (cmd)
    document.execCommand (cmd, false, null);
}

// panel
var apps_el = document.getElementById('apps-wrapper');
apps_el.addEventListener("contextmenu", context_click, false);
var panel = document.getElementsByClassName('panel')[0];
panel.style.display = "none";
panel.addEventListener("click", panel_click, false);

function panel_click(e) {
  var id = panel.dataset.appid;
  var action = e.target.innerHTML;
  var className = e.target.className;
  var app = apps[id];
  if (id) {
    if (className && className == 'panel-app-name') {
      chrome.tabs.create({ 'url': app.appLaunchUrl });
    }
    else if (action == "Options") {
      if (app.optionsUrl)
        chrome.tabs.create({ 'url': app.optionsUrl });
    }
    else if (action == "Hide") {
      /// TODO: ...
    }
    else if (action == "Remove") {
      /// TODO: prompt, animation
      hide_panel();
      if (confirm('Remove "' + apps[id].name + '"?')) {
        chrome.management.uninstall(id, function () {
          bg.onUninstalled(id);
          location.reload();
        });
      }
    }
  }
}

function context_click(e) {
  if (!e.which == 3) return;
  // it was a click on an icon
  if (e.target.nodeName == 'IMG'|| /^cal/.test(e.target.id)) {

    var el = e.target.parentNode.parentNode;
    var app = apps[el.id];
    panel.dataset.appid = el.id;
    panel.innerHTML = '' +
      '<li class="panel-app-name">'+ app.name +'</li>' +
      '<hr />' +
      '<li '+ (!app.optionsUrl ? 'class="disabled"' : '') +'>Options</li>' +
      '<li class="disabled">Hide</li>' +
      '<hr />' +
      '<li>Remove</li>';

    panel.style.left = e.pageX + 'px';
    panel.style.top = e.pageY  + 'px';
    show_panel();
    e.preventDefault();
  } else {
    hide_panel();
  }
}

function hide_panel() {
  panel.style.webkitTransition = "opacity .2s ease-out";
  panel.style.opacity = 0;
  setTimeout(function(){
    panel.style.display = "none";
  }, 200)
}

function show_panel() {
  panel.style.webkitTransition = "";
  panel.style.opacity = 1;
  panel.style.display = "block";
}


document.addEventListener("click", hide_panel, false);
document.addEventListener("keydown", hide_panel, false);
//chrome.management.getAll(function(apps_arr) {
//  console.dir(apps_arr);
//});



// launch app w click
document.addEventListener("click", function(e){
  if (e.target.parentNode.classList.contains('test-item-launcher')) {
     var new_tab = (e.which == 2);
     launch_app(e.target.parentNode.parentNode, new_tab);
     return false;
  }
}, false);

byId("time").onclick = function(e) {
  settings.time_format = (settings.time_format == '12') ? '24' : '12';
  refresh_date();
  save_options();
}

byId("clear-notifications").onclick = function(e) {
  byId('notifications').innerHTML = '';
  stored.notifications = '';
}


function save_options() {
  stored.settings = JSON.stringify(settings);
}

chrome.extension.onMessage.addListener(function(message) {
  if (message.name == "add_new_app" && message.id) {
    apps = bg.apps;
    var app = apps[message.id];
    html = get_app_html(app);
    cache_set_app_html(app, html);

    add_new_app_html(html);
  }
});




// remove old Lorem ipsum notes
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'update') {
    if (stored.notes1.indexOf('Lorem ipsum') > -1) {
      delete stored.notes1;
    }
  }
});


// bugix
/*
window.addEventListener("load", function() {
  if (localStorage.notes1 === "undefined")
    delete localStorage.notes1;
  setTimeout(function(){
    if (!document.getElementsByClassName('test-item').length &&
       bg.localStorage.bug1_fixed != "true") {
      bg.localStorage.bug1_fixed = "true";
      if (bg.localStorage.notes1)
      var notes1 = bg.localStorage.notes1;
      var settings = bg.localStorage.settings;
      bg.localStorage.clear();
      if (notes1)
        bg.localStorage.notes1 = notes1;
      if (settings)
        bg.localStorage.settings = settings;
      bg.location.reload();
      setTimeout(function(){
        window.location.reload();
      }, 1000);
    }
  }, 1000)
}, false);
*/





/*
chrome.management.onInstalled.addListener(function(app) {
  if (app.isApp) {
    chrome.tabs.query({ currentWindow: true, active: true }, function(array) {
      console.dir(array[0])
    })
    window.location.hash = "#last";
    location.reload();
  }
});
*/