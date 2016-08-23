var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
var auth;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  name: 'server-session-cookie-id',
  secret: 'my express secret',
  saveUninitialized: true,
  resave: true,
  cookie: {maxAge: 600}
}));

app.use(function printSession(req, res, next) {

  console.log('req.cookie', req.session.cookie);
  console.log('req.session', req.session);
  return next();
});

// auth = {
//   isLoggedIn: function(req, res, next) {
//     if (req.user) {
//       console.log('user loggedin!');
//       next();
//     } else {
//       console.log('user not loggedin', req.user);
//       res.redirect('/login');
//       // res.rend
//     }
//   }
// };

var checkUser = function (req, res) {
  if (!req.session || !req.session.cookie || req.session.cookie._expires < Date.now()) {
    res.redirect('/login');
      console.log('GOT HERE!!');
    res.send();
  }
};

// checkUser grabs the user's last login and checks if the last login was in the last 30 mins of now
  // if 
    // redirect

// check if req.session.cookie._expires is before now    

app.get('/',
function(req, res) {
  checkUser(req, res);
  console.log('NOPE IT KEEPS GOING!');
  if (req.user) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/create', 
function(req, res) {
  if (req.user) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links', 
function(req, res) {
  if (req.user) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  } else {
    res.redirect('/login');
    // res.render('index');
  }
});

app.get('/login', function(req, res) {
  console.log('DOES THE SESSION WORK?', req.session);
  res.render('login');
});


app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  console.log(' POST REQUEST');
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', function (req, res) {
  Users.create({
    username: req.body.username,
    password: req.body.password,
    lastLogin: db.knex.fn.now()
  }).then(function(userObj) {
    // found return the submission from the user on signup page
    if (userObj) {
      console.log(userObj.attributes.username, '<--------------------- USERNAME');
      console.log(userObj.attributes.password, '<--------------------- PASSWORD');
      res.redirect('/');
      res.send(userObj.attributes.username);   
    }
  });
});


app.post('/login', function (req, res) {
  console.log(req.body.username);
  db.knex('users').select('username').where('username', '=', req.body.username).then(function (user) {
    console.log(user, '<+++++++++++++++++++');
    if (user.length === 0) {
      res.redirect('/login');
      res.send();
    } else {
      db.knex('users').select('username').where('username', '=', req.body.username).update({lastLogin: db.knex.fn.now()}).then(function (updated) {
        if (updated) {
          res.redirect('/');
          res.send();
        }
      });
    }
  });

});

/*{ username: 'Svnh', password: 'Svnh' }*/
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
