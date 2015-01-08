
(function(){

var stored = {};///

//var latitude = 37.416275;
//var longitude = -122.025092;
// http://developer.yahoo.com/weather/#codes

function get_woeid(coords, callback) {
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text%3D%22" + coords.latitude + "%2C" + coords.longitude + "%22%20and%20gflags%3D%22R%22&format=json&diagnostics=false&callback="

	getJSON(url, function (response) {
		console.log(response)
		callback(response.query.results.Result.woeid);
	});
}

function save_coordinates(geo) {
	stored.loc_longitude = geo.coords.longitude;
	stored.loc_latitude  = geo.coords.latitude;
	get_woeid(geo.coords, function (woeid) {
		console.log(woeid)
		stored.loc_woeid = woeid;
		refresh_weather();
	});
}

function permission_error() {
	alert("Can't display weather information without Location permission.");
}

function refresh_weather() {
	// http://weather.yahooapis.com/forecastrss?w=2502265&u=c
	// var url = "http://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20location%3D%22" + stored.loc_woeid + "%22&format=json";

	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20%0Awhere%20url%20%3D%20%22http%3A%2F%2Fweather.yahooapis.com%2Fforecastrss%3Fw%3D" + stored.loc_woeid + "%26u%3Dc%22&format=json&callback=";

	getJSON(url, function (response) { 
		console.log(response);
		
		var item = response.query.results.item;
		/*
		item.link
		item.condition.code
		item.condition.temp
		item.forecast[0].high
		item.forecast[0].low
		*/
		console.log(item.condition.temp);
	});
}

function getJSON(url, callback) {
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.onerror = function() {
	  console.log("an error occurred");
	};
	req.onload = function() {
	  if (this.status == 200) {
	    callback(JSON.parse(this.responseText))
	  } 
	};
	req.send(null);
}

if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(save_coordinates, permission_error);
}


// code = code.replace(/ /g, '-').replace('(day)', 'd').replace('(night)', 'n')
// class = wc-CODE
var codes = {
0: "tornado",
1: "tropical storm",
2: "hurricane",
3: "severe thunderstorms",
4: "thunderstorms",
5: "mixed rain and snow",
6: "mixed rain and sleet",
7: "mixed snow and sleet",
8: "freezing drizzle",
9: "drizzle",
10: "freezing rain",
11: "showers",
12: "showers",
13: "snow flurries",
14: "light snow showers",
15: "blowing snow",
16: "snow",
17: "hail",
18: "sleet",
19: "dust",
20: "foggy",
21: "haze",
22: "smoky",
23: "blustery",
24: "windy",
25: "cold",
26: "cloudy",
27: "mostly cloudy (night)",
28: "mostly cloudy (day)",
29: "partly cloudy (night)",
30: "partly cloudy (day)",
31: "clear (night)",
32: "sunny",
33: "fair (night)",
34: "fair (day)",
35: "mixed rain and hail",
36: "hot",
37: "isolated thunderstorms",
38: "scattered thunderstorms",
39: "scattered thunderstorms",
40: "scattered showers",
41: "heavy snow",
42: "scattered snow showers",
43: "heavy snow",
44: "partly cloudy",
45: "thundershowers",
46: "snow showers",
47: "isolated thundershowers",
3200: "not available" 
};

})();
