
//
// Recently closed
//

/*
6 Tabs
show tab titles in link title attr.
open new window with tabs
last tab selected
var recent_tab_src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozMUJCMTE0RjEwMjA2ODExODIyQUI0Q0UzM0EzRUU5RSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1NjA2NTZCMEM0ODcxMUUxQUZBQ0M1NjBBMzY5NzYxRCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1NjA2NTZBRkM0ODcxMUUxQUZBQ0M1NjBBMzY5NzYxRCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NkE3RkQ0RTQyNjIwNjgxMThBNkRBQTQ1MzA5MjkxNzIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MzFCQjExNEYxMDIwNjgxMTgyMkFCNENFMzNBM0VFOUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7Km3O2AAAAOElEQVQ4y2M4ceLEYSD+TyY+zECBZjCGG4AOQGLPnj1DwTgNwAWIMQSvAYTAqAGjBgwuAyjJzkcAtmTCw0j9ScUAAAAASUVORK5CYII=";
*/

(function(){

var opened = false;

byId('recently-closed-button').onclick = function() {
  var list = byId('recently-closed');
  if (opened) {
    close();
  }
  else {
    document.addEventListener("click", close, false);
    list.style.visibility = 'hidden';


    //var minimumTabInc = +stored['minimumTabInc'];
    var closedTabCount = +stored['closedTabCount'];
    var max = +stored['uniqueTabInc'] - 1;//minimumTabInc + closedTabCount;
    var min = max - Math.min(10, stored.closedTabCount);
    var html = "";

    if ("undefined" != typeof stored['closedTabCount']) {
    // "4231%%1334599149375%%http://imgclck.com/supp0rt/www/delivery/afr.php?zoneid=1%%13%%Advertisement%%0"
      for (var i = max; i > min; i--) {
        var parts = stored['ClosedTab-' + i].split("%%");
        html += '<a href="'+ parts[2] +'" target="_blank"><img src="chrome://favicon/'+ parts[2] +'">'+ parts[4] +'</a>';
      }
    } else {
      html = "<div style='padding:20px 40px'>List is empty. Only the tabs closed <b>after</b> installing this extension will appear here.</div>";
    }

    
    list.innerHTML = html;

    var width = list.offsetWidth;

    list.style.webkitTransition = "none";
    //list.style.right = (-width) + "px"; // 
    list.style.webkitTransform = "translateX("+ width +"px)";
    list.style.visibility = 'visible';
    
    setTimeout(function(){
      list.style.webkitTransition = "";
      //list.style.right =  "0px";
      list.style.webkitTransform = "translateX(0)";
    }, 1)
    
    list.addEventListener("webkitTransitionEnd", function transitionEnd(e) {
      list.removeEventListener("webkitTransitionEnd", transitionEnd);
      opened = true;
    }, false);
  }

 function close(e) {
    if (!opened) return;
    
    //list.style.right =  -width + "px";
    list.style.webkitTransform = "translateX("+ width +"px)";

    list.addEventListener("webkitTransitionEnd", function transitionEnd(e) {
      list.removeEventListener("webkitTransitionEnd", transitionEnd);
      list.style.visibility = 'hidden';  
      opened = false;
    }, false);
  }
};

})();