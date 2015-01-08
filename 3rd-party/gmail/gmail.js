
(function(){

var instanceId = 'gmc' + parseInt(Date.now() * Math.random(), 10);
var pollIntervalMin = FETCH_INTERVAL || 1000 * 30//* 60;  // 1 minute
var pollIntervalMax = FETCH_INTERVAL || 1000 * 60//* 60 * 60;  // 1 hour
var requestFailureCount = 0;  // used for exponential backoff
var requestTimeout = 1000 * 2;  // 5 seconds
var unreadCount = -1;
var requestTimerId;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.url && isGmailUrl(changeInfo.url)) {
    getInboxCount(function(count) {
      updateUnreadCount(count);
    });
  }
});

function getGmailUrl() {
  var url = "https://mail.google.com/";
  if (localStorage.customDomain)
    url += localStorage.customDomain + "/";
  else
    url += "mail/"
  return url;
}

function getFeedUrl() {
  // "zx" is a Gmail query parameter that is expected to contain a random
  // string and may be ignored/stripped.
  return "https://mail.google.com/mail/feed/atom?zx=" + encodeURIComponent(instanceId);
}

function isGmailUrl(url) {
  // This is the Gmail we're looking for if:
  // - starts with the correct gmail url
  // - doesn't contain any other path chars
  var gmail = getGmailUrl();
  if (url.indexOf(gmail) != 0)
    return false;

  return url.length == gmail.length || url[gmail.length] == '?' ||
                       url[gmail.length] == '#';
}


function scheduleRequest() {
  if (requestTimerId) {
    window.clearTimeout(requestTimerId);
  }
  var randomness = Math.random() * 2;
  var exponent = Math.pow(2, requestFailureCount);
  var multiplier = Math.max(randomness * exponent, 1);
  var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
  delay = Math.round(delay);

  requestTimerId = window.setTimeout(startRequest, delay);
}

// ajax stuff
function startRequest() {
  getInboxCount(
    function(count) {
      updateUnreadCount(count);
      scheduleRequest();
    },
    function() {
      scheduleRequest();
    }
  );
}

function getData(item, key) {
  return item.getElementsByTagName(key)[0].textContent;
} 

function getElem(item, key) {
  return item.getElementsByTagName(key)[0];
} 

stored.gmail || (stored.gmail = "[]");
var MAX_GMAIL = 20;

// @param items - a collection of XML nodes
function processGmails(items) {

  if (!items.length) return;

  var since_id = stored.gmail_since_id;
  var new_items = [];
  var notifications = [];

  for (var i = 0; i < items.length; i++) {
    if (getData(items[i], "id") == since_id) break;
    var item = items[i];
    new_items.push({
      id: getData(item, "id"),
      title: getData(item, "title"),
      issued: getData(item, "issued"),
      link: getElem(item, "link").getAttribute("href"),
      summary: getData(item, "summary"),
      author: getData(getElem(item, "author"), "name")
    });
    notifications.push([
      'gmail', 
      "<a href='"+ getElem(item, "link").getAttribute("href") +"' target='_blank'>" + getData(getElem(item, "author"), "name") + "</a> " + getData(item, "title"), 
      getData(item, "summary")
    ]);
  }

  // going backwards intentionally for notifications to appear in order
  for (var i = notifications.length; i--;) {  
    create_notification.apply(null, notifications[i]);
  }

  stored.gmail_since_id = getData(items[0], "id");

  var old_items = JSON.parse(stored.gmail);
  new_items.concat(old_items);
  new_items = new_items.slice(0, MAX_GMAIL);

  setTimeout(function() {
    stored.gmail = JSON.stringify(new_items);
  }, 1000);
}

function getInboxCount(onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();  // synchronously calls onreadystatechange
  }, requestTimeout);

  function handleSuccess(count) {
    requestFailureCount = 0;
    window.clearTimeout(abortTimerId);
    if (onSuccess)
      onSuccess(count);
  }

  var invokedErrorCallback = false;
  function handleError() {
    ++requestFailureCount;
    window.clearTimeout(abortTimerId);
    if (onError && !invokedErrorCallback)
      onError();
    invokedErrorCallback = true;
  }

  try {
    xhr.onreadystatechange = function(){
      if (xhr.readyState != 4)
        return;

      if (xhr.responseXML) {
        var xmlDoc = xhr.responseXML;

        // unread count
        var fullCountSet = xmlDoc.evaluate("/gmail:feed/gmail:fullcount",
            xmlDoc, gmailNSResolver, XPathResult.ANY_TYPE, null);
        var fullCountNode = fullCountSet.iterateNext();
        if (fullCountNode) {
          handleSuccess(fullCountNode.textContent);
        } else {
          console.error(chrome.i18n.getMessage("gmailcheck_node_error"));
          handleError();
        }

        // notifications
        /// TODO: if modified since?
        var items = xmlDoc.getElementsByTagName("entry");
        processGmails(items);
        
      } else {
         handleError();
      }
    }

    xhr.onerror = function(error) {
      handleError();
    }

    xhr.open("GET", getFeedUrl(), true);
    xhr.send(null);
  } catch(e) {
    console.error(chrome.i18n.getMessage("gmailcheck_exception", e));
    handleError();
  }
}

function gmailNSResolver(prefix) {
  if(prefix == 'gmail') {
    return 'http://purl.org/atom/ns#';
  }
}

function updateUnreadCount(count) {
  //if (unreadCount != count) {
    unreadCount = count;
    set_indicator("gmail", count);
  //}
}

//window.addEventListener("DOMContentLoaded", scheduleRequest, false);
startRequest();

})();