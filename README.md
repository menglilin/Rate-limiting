# Rate-limiting

### Store methods

In Generally, for request rate limiting, there are two methods mainly be used: memory and Redis key-value.
The principle of these two methods is to store the key-value pairs of the accessed IP and count number, and clear them every hour.

However, when the situation is as below, this key-value method cannot be controlled every 60 minutes, and the user requests to access only 100 times: When a user requests once in the first minute, then 99 times in the 59th minute, and then in the 62nd minute, limitation refreshed, he can request 100 times. As a result, in the 60 minutes from 59th minutes to 118th minutes, he requested 199 times.

- In this development, I have challenged to used the **Redis list** method to avoid this situation, so that the rate limiting can be achieved smoothly within every 60 minutes.

### Suggestion

Compared with the key-value, Redis list also has disadvantages: its performance is not as good as key-value and its time complexity is higher. Because every user stores more content, the memory utilization is low. So, if there is no special requirement that must control the user to limit the access frequency in every 60 minutes, it is recommended to use the Redis key-value.

## Run the demo for testing

### install

    npm install

* Please install Redis on your device and run it before run the demo

### Document structure

* The rate-limiting files are: rateLimiting.js and redisList.js

    app
      controllers
        demo.controller.js    -- Demo for testing
      lib
        rateLimiting.js       -- **rateLimiting**
        redisList.js          -- **store file of rateLimiting**
      routes
        demo.routes.js        -- Demo for testing
      views
        demo.pug              -- Demo for tesing
        rest.pug              -- Demo for reset Key
    public
      js
        main.js               -- Demo for reset Key
    app.js                    -- entrance of Demo

### Run

    node app.js

Then visit the website on http://127.0.0.1:3001/demo

The unit testing : user could request 5 times in every 2minuts.
The remaining time will be dispayed in the page when user reach the limitation.

    Rate limit exceeded. Try again in 117 seconds

If you want to reset the rate limiting of the demo, please goto http://127.0.0.1:3001/reset
And click the **reset** button. Then this user could request 5 times again. This function is just for the Demo, so the IP address is defined.

## Usage

As a API to apply the rate limiting on the demo page:

```javascript
var rateLimit = require("./app/lib/rateLimiting.js");
const rateLimiting = rateLimit({
  appName: "test",
  expire: 2 * 60 * 1000, // 2 minutes
  max: 5
});
app.use("/demo", rateLimiting);
```

As a API to reset rate limiting with IP:

```javascript
var rateLimit = require("./app/lib/rateLimiting.js");
const rateLimiting = rateLimit({
  appName: "test"
});
rateLimiting.resetKey(key, function(err, result) {
  if (!err) {
    res.json(result);
  } else {
    console.log(err);
  }
});
```

### Configuration options

#### redisURL: url

The url address of redis to be connected, underfined means 127.0.0.1:6379

#### appName: string

Will be added in the predix of redis key

#### expire : milliseconds

How long of the set of rate limiting

#### max : int

How many times of user could request

#### message: string

Message return to user when reach the max

#### statusCode: int

The statusCode to return to user when reach the max

#### skipFailedRequests : boolean

Do not count failed requests, status >= 400 and status != statusCode( which was set before)

#### handler(res,req,next) : function

The function used the request is limited
