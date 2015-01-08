var homeTabId;
var return_to_home_hook;
var apps;
var stored = localStorage;
var ordered = [];
var custom_apps = stored.custom_apps ? JSON.parse(stored.custom_apps) : {}; // id -> bool (enabled state)

function return_to_home() {

  if (!return_to_home_hook) {
     chrome.tabs.update(homeTabId, {active: true});
     return;
  }
  chrome.tabs.captureVisibleTab(null, {
    //format: "jpeg"
    //,quality: 100
  }, function(dataUrl) {
    /*
    console.log(dataUrl.length);
    var img = document.createElement("img");
    img.src = dataUrl;
    document.body.appendChild(img);
    */
    return_to_home_hook(dataUrl, function(){
      chrome.tabs.update(homeTabId, {active: true});
    });
  });
}

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.name == "get-home-tab-id") {
      sendResponse(homeTabId);
    } else if (request.name == "return-to-home") {
      return_to_home();
    }
  });




// INSTALL & ENABLE

function remove_custom_app() {

}

chrome.management.onInstalled.addListener(function(app) {
  ///stored.icons_order += "," + app.id;

  if (!app.isApp) return;

  apps[app.id] = app;

  // all views should update the UI
  chrome.extension.sendMessage({ name: "add_new_app", id: app.id });

  // active view should scroll to show the newly installed app
  chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {name: "go_last_page"})
  });
});

chrome.management.onEnabled.addListener(function(app) {
  if (app.isApp)
    stored.icons_order += "," + app.id;
});


// UNINSTALL & DISABLE

function onUninstalled(id) {
  var ordered = stored.icons_order.split(',');
  for (var i = 0; i < ordered.length; i++)
    if (ordered[i] == id)
      ordered.splice(i, 1);
  stored.icons_order = ordered.join(',');
  apps[id].enabled = false;
  if (custom_apps[id]) {
    custom_apps[id] = false;
    stored.custom_apps = JSON.stringify(custom_apps);
  }
}

// callded in main.js because of custom apps
///chrome.management.onUninstalled.addListener(onUninstalled);

chrome.management.onDisabled.addListener(function(app) {
  onUninstalled(app.id);
});


/*
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.executeScript(tabId, {
    file: chrome.extension.getURL("content_script.js"),
    allFrames: true
  });
});
*/




var default_settings = {
  fetch_interval: '1',
  time_format:    '24',
  notifications: {}
}

var settings = stored.settings ? JSON.parse(stored.settings) : default_settings;

/* temporary fix for old settings */

if ("undefined" != typeof settings.showClear) {
  settings = default_settings;
}

stored.settings = JSON.stringify(settings);


var FETCH_INTERVAL = settings.fetch_interval ? settings.fetch_interval * 60  * 1000 :  30 * 1000;//30 * 1000;
var ITEM_SEPARATOR = "\\c";
var FIELD_SEPARATOR = "\\a";
var MAX_NOTIFICATIONS = 10; // shown / stored

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

stored.notifications || (stored.notifications = "");


function set_indicator(id, count) {
  // broadcast indicator change
  chrome.extension.sendMessage({
    name: "set_indicator",
    args: [id, count]
  });
  // store indicator change
  var key = "indicator-" + id;
  stored[key] = count;
}

function is_notification_enabled(i) {
  return ("undefined" == typeof settings.notifications[i] || settings.notifications[i]);
}

function create_notification(icon, title, body) {

  if (!icon || !title) return;

  if (icon == 'gmail'      && !is_notification_enabled('pjkljhegncpnkpknbcohdijeoejaedia')) return;
  if (icon == 'news'       && !is_notification_enabled('pjjhlfkghdhmijklfnahfkpgmhcmfgcm')) return;
  if (icon == 'yahoo-mail' && !is_notification_enabled('yahoo-mail')) return;
  if (icon == 'hotmail'    && !is_notification_enabled('hotmail')) return;
  if (icon == 'facebook'   && !is_notification_enabled('facebook')) return;
  if (icon == 'twitter'    && !is_notification_enabled('twitter')) return;

  // broadcast new notification
  chrome.extension.sendMessage({
    name: "create_notification",
    args: [icon, title, body]
  });

  /*
  if (icon == 'tweet' && +new Date - last_sound > 1000)  {
    last_sound = +new Date;
    byId('twittersound', bg.document).currentTime = 0;
    byId('twittersound', bg.document).play();
  }
  */

  icon = ICONS[icon] || icon;
  var new_item = icon + FIELD_SEPARATOR + title + FIELD_SEPARATOR + body;

  // fetch stored notifications and refresh list
  var notifications = stored.notifications ? stored.notifications.split(ITEM_SEPARATOR) : [];
  notifications.unshift(new_item);
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.pop();
  }

  // update storage
  stored.notifications = notifications.join(ITEM_SEPARATOR);
}

function play_notification_sound(type) {
}


function include_js(url, callback) {
  var script = document.createElement('script');
  script.onload = callback;
  script.src = url;
  document.head.appendChild(script);
}


function build_apps_list(apps_arr) {
  ///bench('build start');///

  // save default custom apps' states upon first launch
  if ("undefined" == typeof custom_apps["webstore"]) {
    custom_apps = {"contacts":true,"webstore":true,"yahoo-mail":true,"hotmail":true,"facebook":true,"twitter":true};
    stored.custom_apps = JSON.stringify(custom_apps);
  }

  if (apps_arr) {
    apps_arr.unshift({
      name: "Contacts",
      id:   "contacts",
      icons: [{size: 128, url: "icons/app/contacts-128.png"}],
      appLaunchUrl: "https://www.google.com/contacts/#contacts",
      isApp:   true,
      enabled: custom_apps["contacts"]
    });

    apps_arr.unshift({
      name: "Store",
      id:   "webstore",
      icons: [{size: 128, url: "chrome://extension-icon/ahfgeienlihckogmohjhadlkjgocpleb/128/0"}],
      appLaunchUrl: "https://chrome.google.com/webstore/category/popular?utm_source=chrome-ntp-icon",
      isApp:   true,
      enabled: custom_apps["webstore"]
    });

    apps_arr.push({
      name: "Yahoo! Mail",
      id:   "yahoo-mail",
      icons: [{size: 128, url: "icons/app/yahoo-mail-128.png"}],
      appLaunchUrl: "http://us.mg40.mail.yahoo.com/neo/launch?.rand=" + (+new Date),
      isApp:   true,
      enabled: custom_apps["yahoo-mail"]
    });

    apps_arr.push({
      name: "Hotmail",
      id:   "hotmail",
      icons: [{size: 128, url: "icons/app/hotmail-128.png"}],
      appLaunchUrl: "http://mail.live.com/default.aspx?rru=inbox", /// http vs https
      optionsUrl: "https://mail.live.com/P.mvc#!/mail/options.aspx",
      isApp:   true,
      enabled: custom_apps["hotmail"]
    });

    apps_arr.push({
      name: "Facebook",
      id:   "facebook",
      icons: [{size: 128, url: "icons/app/facebook-128.png"}],
      appLaunchUrl: "https://www.facebook.com/",
      optionsUrl: "https://www.facebook.com/settings",
      isApp:   true,
      enabled: custom_apps["facebook"]
    });

    apps_arr.push({
      name: "Twitter",
      id:   "twitter",
      icons: [{size: 128, url: "icons/app/twitter-128.png"}],
      appLaunchUrl: "https://twitter.com/",
      optionsUrl: "https://twitter.com/settings/account",
      isApp:   true,
      enabled: custom_apps["twitter"]
    });

  }

  var in_ordered = {};

  // stored list of apps in custom order
  ///
  /*for (var i = 0; i < ordered.length; i++) {
    for (var j = 0; j < ordered[i].length; j++) {
      in_ordered[ordered[i][j]] = true;
    }
  }*/
    for (var j = 0; j < ordered.length; j++) {
      in_ordered[ordered[j]] = true;
    }

  apps = {};

  // check for missing apps (recently added)
  for (var i = 0; i < apps_arr.length; i++) {
    var app = apps_arr[i];
    if (!app.isApp) continue;
    apps[app.id] = app;
    if (!in_ordered[app.id] && app.enabled)
      ///push_to_empty_index(ordered, app.id);
      ordered.push(app.id);
  }

  stored.icons_order = ordered.join(',')///JSON.stringify(ordered);
}


if (stored.icons_order) {
  ordered = stored.icons_order.split(',');//JSON.parse(stored.icons_order);
}


chrome.management.getAll(function(array) {
    build_apps_list(array);
    include_3rd_party_services();
});


function include_3rd_party_services() {

    include_js("3rd-party/closed-tab/bg.js");

    // optional services

    if (apps['pjkljhegncpnkpknbcohdijeoejaedia'] &&
        apps['pjkljhegncpnkpknbcohdijeoejaedia'].enabled) {
      include_js("3rd-party/gmail/gmail.js");
    }

    if (apps['dlppkpafhbajpcmmoheippocdidnckmm'] &&
        apps['dlppkpafhbajpcmmoheippocdidnckmm'].enabled) {
      include_js("3rd-party/gplus/gplus.js");
    }

    if (apps['yahoo-mail'].enabled) {
      include_js("3rd-party/yahoo-mail/yahoo-mail.js");
    }

    if (apps['facebook'].enabled) {
      include_js("3rd-party/facebook/facebook.js");
    }

    if (apps['hotmail'].enabled) {
      include_js("3rd-party/hotmail/hotmail.js");
    }

    //if (apps['ejjicmeblgpmajnghnpcppodonldlgfn'] &&
    //    apps['ejjicmeblgpmajnghnpcppodonldlgfn'].enabled) {
      include_js("3rd-party/gcalendar/gcalendar.js");
    //}  
}

// temporary force update
var hotmail_html = stored.app_html_hotmail
if (hotmail_html && hotmail_html.indexOf('col002') > -1) {
  delete stored.app_html_hotmail;
}
