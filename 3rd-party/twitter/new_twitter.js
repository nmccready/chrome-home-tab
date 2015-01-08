var CONSUMER_KEY = 'yBCXdELej2bco4symYnCg';
var CONSUMER_SECRET = 'lddqaFoDkWbcPfdfuwOAaiW9wcvWcz0nDZIzspZE4';

// Step 1: Encode consumer key and secret
var base64_consumer_key_secret = window.btoa(CONSUMER_KEY + ':' + CONSUMER_SECRET);

// Step 2: Obtain a bearer token
var request = urllib2.Request("https://api.twitter.com/oauth2/token")
request.add_header('Authorization', 'Basic ' + base64_consumer_key_secret)
request.add_header("Content-Type", 'application/x-www-form-urlencoded;charset=UTF-8')
request.add_data('grant_type=client_credentials')

resp = urllib2.urlopen(request)
data = json.load(resp)
if data['token_type'] != 'bearer':
    throw("Bad token_type: " + data['token_type'])
access_token = data['access_token']

print("access_token: " + access_token)
print('')


function authenticateApplication() {
  var url = "https://api.twitter.com/oauth2/token";
  var req = new XMLHttpRequest();
  req.open("POST", url, true);
  req.setRequestHeader('Authorization', 'Basic ' + base64_consumer_key_secret);
  req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
  req.onerror = function() {
    console.log("an error occurred");
  };
  req.onload = function() {
    if (this.status == 200) {
      console.log(JSON.parse(this.responseText));
    }
  };
  req.send('grant_type=client_credentials');
}
