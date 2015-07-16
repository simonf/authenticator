// Required Modules
var express    = require("express");
var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require("jsonwebtoken");
var mongoose   = require("mongoose");
var app        = express();

var port = process.env.PORT || 3001;
var User     = require('./user');

// load configuration
var config = require('./config.json');

// Connect to DB
mongoose.connect(config.mongo_url);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan(config.log_level));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

app.post('/login', function(req, res) {
    User.findOne({email: req.body.email, password: req.body.password}, function(err, user) {
        if (err) {
          console.log(err);
            res.status(500).end();
        } else {
            if (user) {
              user.token = jwt.sign(user, config.jwt_secret);
              updateUserWithNewExpiryDate(user, function(usernameAndToken){
                if(usernameAndToken) {
                  res.json(usernameAndToken);
                } else {
                  res.status(500).end();
                }
              });
            } else {
                console.log("Bad login: "+req.body.email);
                res.status(403).end();
            }
        }
    });
});

app.get('/authorise', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (err) {
            console.log(err);
            res.status(500).end();
        } else {
          if(user) {
            if(! isExpired(user)) {
              updateUserWithNewExpiryDate(user, function(usernameAndToken){
                if(usernameAndToken) {
                  res.json(usernameAndToken);
                } else {
                  res.status(500).end();
                }
              });
            } else {
              expireToken(user.token, function(ok){
                if(ok) res.status(403).end();
                else res.status(500).end();
              });
            }
          } else {
            console.log("Bad authorisation request for token: "+req.token);
            res.status(403).end();
          }
        }
    });
});

app.get('/logout', ensureAuthorized,function(req,res) {
  expireToken(req.token,function(ok){
    if(ok) res.status(200).end();
    else res.status(500).end();
  });
});

function expireToken(token, cb) {
  User.findOneAndUpdate({token: token}, { $unset: { token: "", expires: "" } }, function(err, user) {
      if (err) {
          console.log(err);
          cb(false);
      }
      else {
        cb(true);
      }
  });
}

function isExpired(userWithToken) {
  var d = new Date();
  return d.getTime() > userWithToken.expires.getTime();
}

function updateUserWithNewExpiryDate(user,callback) {
  var epochExpiry = new Date().getTime() + config.expiry_interval;
  user.expires = new Date(epochExpiry);
  user.save(function(err, user1) {
    if(err) {
      console.log(err);
      callback(null);
    } else {
      callback({
        username: user1.username,
        organisation: user1.organisation,
        token: user1.token,
        expires: user1.expires
      });
    }
  });
}

function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.status(403).end();
    }
}

process.on('uncaughtException', function(err) {
    console.log(err);
});

// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});
