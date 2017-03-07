var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});

mongoose.Promise = global.Promise;
//Connect to the database
mongoose.connect('mongodb://jc:jc_pass@ds113000.mlab.com:13000/efl');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
 // we're connected!
 console.log('connected using boardControllers');
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

var BidSchema = new mongoose.Schema({
 pos: String,
 secPos: String,
 thirdPos: String,
 firstName: String,
 lastName: String,
 bid: Number,
 team: String,
 nominate: Boolean,
 close: Boolean
});
var Bid = mongoose.model('Bid', BidSchema);

module.exports = function(app) {

 app.get('/auction_board.html', function(req, res) {
  Bid.find({}, function(err, data) {
   res.render('pages/auction_board', {BidData: data});
  }
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
     Team.find({}, function(err, data) {
      TeamData = data;
     });
     res.render('pages/login', {errmsg: ''});
    });
   });
  }
 });

app.get('/login.html', function(req, res) {
 if (req.cookies.team) {
  res.writeHead(301, {Location: '/auction_board.html'});
  res.end();
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
    res.writeHead(301, {Location: '/login.html'});
    res.end();
   } else {
    res.render('pages/login', {errmsg: 'incorrect'});
   }
  });
 });
});

app.get('/auction_board.html', function (req, res) {
  res.render('pages/auction_board');
 });

};

