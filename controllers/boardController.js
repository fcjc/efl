var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var Bid = require("../apps/models/bid").Bid;
var Team = require("../apps/models/team").Team;

mongoose.Promise = global.Promise;
//Connect to the database
//mongoose.connect('mongodb://jc:jc_pass@ds113000.mlab.com:13000/efl');

var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));
//db.once('open', function() {
 // we're connected!
// console.log('connected using boardControllers');
//});

/*
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
*/
var message;

module.exports = function(app) {

 app.get('/auction_board.html', function(req, res) {
  var tempBudget = [];
  Team.find({}, null, {sort: {shortName: 1}}, function(err, teamdata) {
   if (err) {
    console.log('error! app.get-auction_board');
    return res.redirect('/login.html');
   }
   for (var i = 0; i < 12; i++) { 
    tempBudget.push([teamdata[i].shortName, teamdata[i].startBudget, teamdata[i].availBudget, teamdata[i].availBudget]);
   }
   //console.log(tempBudget);

   Bid.find({}, null, {sort: {lastName: 1, bid: -1}}, function(err, data) {
   if (err) {
    console.log('error! app.get-auction_board bid.find');
    return res.redirect('/login.html');
   }
    var openAuctions = [];
    var closedAuctions = [];
    var curPlayer;
    var closedPlayer;
    var prevPlayer;
    data.forEach(function(newData) {
     curPlayer = newData.pos + newData.firstName + newData.lastName;
     if (newData.close) {
      closedPlayer = curPlayer;
     }
     if (curPlayer !== closedPlayer) {
      openAuctions.push(newData);
      if (curPlayer !== prevPlayer) {
       for (var i = 0; i < 12; i++) {
        if (tempBudget[i][0] == newData.team) {
         //console.log('deduct ' + newData.bid + ' from ' + tempBudget[i][0]);
         tempBudget[i][3] = tempBudget[i][3] - newData.bid;
        }
       }
      }
      prevPlayer = curPlayer;
     } else {
      closedAuctions.push(newData);
     }
    });
    console.log(tempBudget);
    res.render('pages/auction_board', {BidData: openAuctions, closed: closedAuctions, budget: tempBudget});
   });
  });
 });


 app.get('/bid.html', function(req, res) {
  if (!req.cookies.team) {
   return res.redirect('/login.html');
  }
  Bid.find({}, null, {sort: {lastName: 1, bid: -1}}, function(err, data) {
   if (err) {
    console.log('error! app.get-bid');
    return res.redirect('/login.html');
   }
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

  /* is this the bug!!!!
  //Bid check not live yet
  Team.findOne({ shortName: req.body.team }, function(err, data) {
   if (err) {
    console.log('error! app.post-bid');
    return res.redirect('/login.html');
   }
   console.log('debug bid2');
   if (req.body.bid > data.ifWonAllBudget) {
    console.log('Cannot afford bid of ' + req.body.bid);
   }
   console.log('debug bid2end');
  });
  */

  Bid.find({pos: playerPos[0], firstName: playerInfo[1], lastName: playerInfo[2]}, null, {sort: {bid: -1}}, function(err, data) {
   if (err) {
    console.log('error! app.post-bid bid.find');
    return res.redirect('/login.html');
   }
   console.log('debug bid3');
   console.log('this bid is for ' + req.body.player + ' for the amount ' + req.body.bid + ' from team:' + req.body.team);
   if (req.body.bid > data[0].bid) {
    console.log('debug bid3end');
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
     console.log(req.body.player + " bid added");
    });
    return res.redirect('/auction_board.html');
   } else {
    console.log('debug bid3end2');
    console.log(data[0].lastName + ' bid too small');
    return res.redirect('/biderror.html');
   }
  });
  //res.render('pages/bid_confirm', {Player: req.body.player, Team: req.body.team, Bid: req.body.bid});
 });

 app.get('/biderror.html', function(req, res) {
  res.render('pages/biderror', {errmsg: 'bid too small'});
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
  console.log('debug bid4');
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
   if (err) {
    console.log('error! app.post-nominate');
    return res.redirect('/login.html');
   }
   console.log(req.body.pos + ' ' + req.body.firstName + ' ' + req.body.lastName + ' nominated');
  });
  console.log('debug bid5');

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
       Team.where({ shortName: data.team }).update({ $inc: {availBudget: -(data.bid), rosterCount: +1}}, function(err, data3) {
        console.log('closed ' + data.firstName + data.lastName);
        console.log('deducted ' + data.bid + ' from ' + data.team); 
       });
      });
     }
    }
    prevPlayer = curPlayer;
   });
   res.render('pages/close', {BidData: data});
  })
 });

};

