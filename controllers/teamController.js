var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var Team = require("../apps/models/team").Team;

mongoose.Promise = global.Promise;
//Connect to the database
mongoose.connect('mongodb://jc:jc_pass@ds113000.mlab.com:13000/efl');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
 // we're connected!
 console.log('connected');
});

//Schema
/*
var TeamSchema = new mongoose.Schema({
 name: String,
 owner: String,
 login: String,
 password: String,
 shortName: String,
 startBudget: Number,
 availBudget: Number,
 ifWonAllBudget: Number,
 lastLogin: Number
});
var Team = mongoose.model('Team', TeamSchema);
*/

module.exports = function(app) {

 app.get('/', function(req, res) {
  if (req.cookies.team) {
   return res.redirect('/auction_board.html');
  }
  Team.find({}, function(err, data) {
   res.render('pages/register', {teams: data, errmsg: ''});
  });
 });


 app.post('/', urlencodedParser, function(req, res) {
  var message;
  if (req.body.password !== req.body.password2) 
   message = 'Your passwords did not match';
  if (!req.body.login || !req.body.password)
   message = 'Please fill out all fields';
  Team.find({}, function(err, data) {
   for (var i = 0; i < data.length; i++) {
    if (req.body.login === data[i].login)
     message = 'Login ID already exists';
   }
   if (message) {
    res.render('pages/register', {teams: data, errmsg: message});
   } else {
    bcrypt.hash(req.body.password, null, null, function(err, bcryptedPassword) {
     Team.where({ shortName: req.body.shortName }).update({ $set: {login: req.body.login, password: bcryptedPassword} }, function (err, data) {
      res.render('pages/login', {errmsg: ''});
     });
    });
   }
  });
 });

 app.get('/login.html', function(req, res) {
  if (req.cookies.team) {
   return res.redirect('/auction_board.html');
  }
  res.render('pages/login', {errmsg: ''});
 });

 app.post('/login.html', urlencodedParser, function(req, res) {
  Team.findOne({ login: req.body.login }, function(err, data) {
   if (!data) {
    res.render('pages/login', {errmsg: 'login id not found'});
    return;
   }
   bcrypt.compare(req.body.password, data.password, function(err, passRes) {
    if (err) {
     console.log(err);
    }
    if (passRes) {
     //console.log("password is correct");
     res.cookie('team', data.shortName, {expires: new Date() + 9999999999, maxAge: 9999999999});
     return res.redirect('/auction_board.html');
    } else {
     res.render('pages/login', {errmsg: 'password incorrect'});
    }
   });
  });
 });

};
