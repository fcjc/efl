var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var urlencodedParser = bodyParser.urlencoded({extended: false});

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
var TeamSchema = new mongoose.Schema({
 name: String,
 owner: String,
 login: String,
 password: String,
 shortName: String,
 startBudget: Number,
 availBudget: Number,
 ifWonAllBudget: Number,
 lastLogin: Date
});
var Team = mongoose.model('Team', TeamSchema);

var TeamData;
Team.find({}, function(err, data) {
 TeamData = data;
});

module.exports = function(app) {

 app.get('/', function(req, res) {
  res.render('pages/register', {teams: TeamData, errmsg: ''});
 });
 app.post('/', urlencodedParser, function(req, res) {
  var message;
  if (req.body.password !== req.body.password2) 
   message = 'Your passwords did not match';
  if (!req.body.login || !req.body.password)
   message = 'Please fill out all fields';
  for (var i = 0; i < TeamData.length; i++) {
   if (req.body.login === TeamData[i].login)
    message = 'Login ID already exists';
  }
  if (message) {
   res.render('pages/register', {teams: TeamData, errmsg: message});
  } else {
   bcrypt.hash(req.body.password, null, null, function(err, bcryptedPassword) {
    Team.where({ shortName: req.body.shortName }).update({ $set: {login: req.body.login, password: bcryptedPassword, lastLogin: Date()} }, function (err, data) {
     res.render('pages/login');
    });
   });
  }
 });
 app.get('/auction_board.html', function (req, res) {
  res.render('pages/auction_board');
 });

};

