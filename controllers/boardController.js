var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});

mongoose.Promise = global.Promise;
//Connect to the database
//mongoose.connect('mongodb://jc:jc_pass@ds113000.mlab.com:13000/efl');

var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));
//db.once('open', function() {
 // we're connected!
// console.log('connected using boardControllers');
//});

var BidSchema = new mongoose.Schema({
 pos: String,
 secPos: String,
 thirdPos: String,
 firstName: String,
 lastName: String,
 bid: Number,
 team: String,
 bidTime: Number,
 nominate: Boolean,
 close: Boolean
});
var Bid = mongoose.model('Bid', BidSchema);

var message;

module.exports = function(app) {

 app.get('/auction_board.html', function(req, res) {
  Bid.find({}, null, {sort: {lastName: 1, bid: -1}}, function(err, data) {
   var openAuctions = [];
   var closedAuctions = [];
   var curPlayer;
   var closedPlayer;
   data.forEach(function(newData) {
    curPlayer = newData.pos + newData.firstName + newData.lastName;
    if (newData.close) {
     closedPlayer = curPlayer;
    }
    if (curPlayer !== closedPlayer) {
     openAuctions.push(newData);
    } else {
     closedAuctions.push(newData);
    }
   });
   res.render('pages/auction_board', {BidData: openAuctions, closed: closedAuctions});
  });
 });


 app.get('/bid.html', function(req, res) {
  if (!req.cookies.team) {
   return res.redirect('/login.html');
  }
  Bid.find({}, null, {sort: {lastName: 1, bid: -1}}, function(err, data) {
   var openAuctions = [];
   var curPlayer;
   var closedPlayer;
   data.forEach(function(newData) {
    curPlayer = newData.pos + newData.firstName + newData.lastName;
    if (newData.close) {
     closedPlayer = curPlayer;
    }
    if (curPlayer !== closedPlayer) {
     openAuctions.push(newData);
    }
   });
   res.render('pages/bid', {BidData: openAuctions, teamShort: req.cookies.team});
  });
 });

 app.post('/bid.html', urlencodedParser, function(req, res) {
  var playerInfo = req.body.player.split(" ");
  if (playerInfo[0].length > 2) {
   var playerPos = playerInfo[0].split("/");
  } else {
   var playerPos = [playerInfo[0], ''];;
  }
  var unixtime = new Date().getTime() / 1000;
  new Bid({ 
   pos: playerPos[0],
   secPos: playerPos[1],
   firstName: playerInfo[1],
   lastName: playerInfo[2],
   bid: req.body.bid,
   team: req.body.team,
   bidTime: unixtime,
   nominate: 0,
   close: 0,
  }).save(function (err) {
   if (err) console.log(err);
   console.log(req.body.player + " added");
  });

  return res.redirect('/auction_board.html');
  //res.render('pages/bid_confirm', {Player: req.body.player, Team: req.body.team, Bid: req.body.bid});
 });


 app.get('/nominate.html', function(req, res) {
  if (req.cookies.team) {
   res.render('pages/nominate', {teamShort: req.cookies.team});
  } else {
   return res.redirect('/login.html');
  }
 });

 app.post('/nominate.html', urlencodedParser, function(req, res) {
  var unixtime = new Date().getTime() / 1000;
  new Bid({
   pos: req.body.pos,
   secPos: req.body.posSec,
   firstName: req.body.firstName,
   lastName: req.body.lastName,
   bid: req.body.bid,
   team: req.body.team,
   bidTime: unixtime,
   nominate: true,
   close: 0,
  }).save(function (err) {
   console.log(req.body.pos + ' ' + req.body.firstName + ' ' + req.body.lastName + ' nominated');
  });

  return res.redirect('/auction_board.html');
  //res.render('pages/bid_confirm', {Player: req.body.player, Team: req.body.team, Bid: req.body.bid});
 });

 app.get('/close_check.html', function(req, res) {
  Bid.find({}, null, {sort: {lastName: 1, bid: -1}}, function(err, data) {
   var curPlayer;
   var prevPlayer;
   var curTime = new Date().getTime() / 1000;
   var oneDay = 86400;
   data.forEach(function(data) {
    curPlayer = data.pos + data.secPos + data.firstName + data.lastName;
    if ((curPlayer !== prevPlayer) && (!data.close)) {
     //console.log(curPlayer + ' ' + data.bidTime);
     if (curTime > (data.bidTime + oneDay)) {
      console.log('need to close ' + curPlayer);
      Bid.where({ firstName: data.firstName, lastName: data.lastName, bidTime: data.bidTime }).update({ $set: {close: true}}, function(err, data2) {
       console.log('closed ' + data.firstName + data.lastName);
      });
     }
    }
    prevPlayer = curPlayer;
   });
   res.render('pages/close', {BidData: data});
  })
 });

};

