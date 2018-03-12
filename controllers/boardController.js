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

  app.get('/activity_log.html', function(req, res) {
   Team.findOne({ shortName: req.cookies.team }, function(err, dataTeam) {

   Bid.find({}, null, {sort: {bidTime: -1}}, function(err, data) {
   if (err) {
    console.log('error! app.get-activity_log bid.find');
    return res.redirect('/login.html');
   }
    var tickerLog = [];
    var announceBid;
    var announceClose;
    var curPlayer;
    data.forEach(function(newData) {
     curPlayer = newData.pos + '  ' + newData.firstName.charAt(0) + '.' + newData.lastName;
     if (newData.nominate) {
      announceBid = 'Nom: ' + newData.team + ' - ' + curPlayer + ' for ' + newData.bid;
     } else {
      announceBid = 'Bid: ' + newData.team + ' - ' + curPlayer + ' for ' + newData.bid;
     }
     tickerLog.push([newData.bidTime, announceBid, newData.nominate]);
     if (newData.close) {
      announceClose = 'Win: ' + newData.team + ' - ' + curPlayer + ' for ' + newData.bid;
      tickerLog.push([newData.bidTime + 86400, announceClose, 2]);
     }
    });

    //resort array
    tickerLog.sort(sortFunction);
    function sortFunction(a, b) {
     if (a[0] === b[0]) {
      return 0;
     } else {
      return (a[0] > b[0]) ? -1 : 1;
     }
    }
    res.render('pages/activity_log', {activityData: tickerLog, lastLogin: dataTeam.last2ndLogin});
   });
  });
 });

 app.get('/auction_board.html', function(req, res) {
  if (!req.cookies.team) {
   return res.redirect('/login.html');
  }
  var unixtime = new Date().getTime() / 1000;
  var curTeamLastLogin;

  var tempBudget = [];
  Team.find({}, null, {sort: {shortName: 1}}, function(err, teamdata) {
   if (err) {
    console.log('error! app.get-auction_board');
    return res.redirect('/login.html');
   }
   for (var i = 0; i < 12; i++) {
    if (teamdata[i].shortName == req.cookies.team) {
     curTeamLastLogin = teamdata[i].lastLogin;
    }
    tempBudget.push([teamdata[i].shortName, teamdata[i].startBudget, teamdata[i].availBudget, teamdata[i].ifWonAllBudget]);
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
    var tickerLog = [];
    var announceBid;
    var announceClose;
    var curPlayerShort;
    data.forEach(function(newData) {
     curPlayer = newData.pos + newData.firstName + newData.lastName;
     curPlayerShort = newData.pos + '  ' + newData.firstName.charAt(0) + '.' + newData.lastName;
     if (newData.nominate) {
      announceBid = 'Nom: ' + newData.team + ' - ' + curPlayerShort + ' for ' + newData.bid;
     } else {
      announceBid = 'Bid: ' + newData.team + ' - ' + curPlayerShort + ' for ' + newData.bid;
     }
     tickerLog.push([newData.bidTime, announceBid, newData.nominate]);

     if (newData.close) {
      closedPlayer = curPlayer;
      announceClose = 'Win: ' + newData.team + ' - ' + curPlayerShort + ' for ' + newData.bid;
      tickerLog.push([newData.bidTime + 86400, announceClose, 2]);
     }
     if (curPlayer !== closedPlayer) {
      openAuctions.push(newData);
      /*
      if (curPlayer !== prevPlayer) {
       for (var i = 0; i < 12; i++) {
        if (tempBudget[i][0] == newData.team) {
         //console.log('deduct ' + newData.bid + ' from ' + tempBudget[i][0]);
         tempBudget[i][3] = tempBudget[i][3] - newData.bid;
        }
       }
      }
      */
      prevPlayer = curPlayer;
     } else {
      closedAuctions.push(newData);
     }
    });

    //resort array
    tickerLog.sort(sortFunction);
    function sortFunction(a, b) {
     if (a[0] === b[0]) {
      return 0;
     } else {
      return (a[0] > b[0]) ? -1 : 1;
     }
    }

    //Team.where({ shortName: req.cookies.team }).update({ $set: {last2ndLogin: curTeamLastLogin, lastLogin: unixtime, rosterCountTemp: curBids}}, function(err) {
    Team.where({ shortName: req.cookies.team }).update({ $set: {last2ndLogin: curTeamLastLogin, lastLogin: unixtime}}, function(err) {
     console.log(req.cookies.team + ' has accessed the auctionboard: ' + new Date(unixtime * 1000));
    });
 

    //console.log(tempBudget);
    res.render('pages/auction_board', {BidData: openAuctions, closed: closedAuctions, budget: tempBudget, activityData: tickerLog, lastLogin: curTeamLastLogin});
   });
  });
 });

 app.get('/bid.html', function(req, res) {
  if (!req.cookies.team) {
   return res.redirect('/login.html');
  }
  var playerID = null;
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
   res.render('pages/bid', {BidData: openAuctions, teamShort: req.cookies.team, playerID: playerID});
  });
 });

 app.get('/bid.html/:playerID', function(req, res) {
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
   res.render('pages/bid', {BidData: openAuctions, teamShort: req.cookies.team, playerID: req.params.playerID});
  });
 });

 app.post('/bid.html', urlencodedParser, function(req, res) {
  var playerInfo = req.body.player.split(" ");
  if (playerInfo[0].length > 2) {
   var playerPos = playerInfo[0].split("/");
  } else {
   var playerPos = [playerInfo[0], ''];;
  }

  // is this the bug!!!!
  //Bid check
  Team.findOne({ shortName: req.body.team }, function(err, data) {
   if (err) {
    console.log('error! app.post-bid');
    return res.redirect('/login.html');
   }
   console.log('checking bid, found team ' + data.shortName);
   var highBidAllowed = data.ifWonAllBudget - (24 - data.rosterCountTemp);
   if (req.body.bid > highBidAllowed) {
    console.log('Cannot afford bid of ' + req.body.bid + ' because highest bid allowed is: ' + highBidAllowed);
    return res.redirect('/biderror.html/cannot%20afford%20bid');
   }
//   console.log('debug bid2end');
  //

   Bid.find({pos: playerPos[0], firstName: playerInfo[1], lastName: playerInfo[2]}, null, {sort: {bid: -1}}, function(err, data) {
    if (err) {
     console.log('error! app.post-bid bid.find');
     return res.redirect('/login.html');
    }
    console.log('this bid is for ' + req.body.player + ' for the amount ' + req.body.bid + ' from team:' + req.body.team);
    if (req.body.bid > data[0].bid) {
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

     //update team db for rosterCountTemp and ifWonAllBudget
     Team.where({ shortName: req.body.team }).update({ $inc: {rosterCountTemp: +1, ifWonAllBudget: -(req.body.bid)}}, function(err) {
      if (err) {
       console.log('error! app.post-bid team.where add');
       return res.redirect('/login.html');
      }
     console.log(req.body.team + ' has rosterCountTemp added 1 and ifWonAllBudget deducted by ' + req.body.bid);
     });

     //team who lost the highest bidder needs to be updated too
     Team.where({ shortName: data[0].team }).update({ $inc: {rosterCountTemp: -1, ifWonAllBudget: +(data[0].bid)}}, function(err) {
      if (err) {
       console.log('error! app.post-bid team.where subtract');
       return res.redirect('/login.html');
      }
      console.log(data[0].team + ' has rosterCountTemp subtracted 1 and ifWonAllBudget added by ' + data[0].bid);
     });

     return res.redirect('/auction_board.html');
    } else {
     console.log(data[0].lastName + ' bid too small');
     return res.redirect('/biderror.html/bid%20too%20small%20');
    }
   });

  });
  //res.render('pages/bid_confirm', {Player: req.body.player, Team: req.body.team, Bid: req.body.bid});
 });

 app.get('/biderror.html/:errmsg', function(req, res) {
  res.render('pages/biderror', {errmsg: req.params.errmsg});
 });

 app.get('/budget.html', function(req, res) {
  if (!req.cookies.team) {
   return res.redirect('/login.html');
  }
  var unixtime = new Date().getTime() / 1000;
  var curTeamLastLogin;

  var tempBudget = [];
  Team.find({}, null, {sort: {shortName: 1}}, function(err, teamdata) {
   if (err) {
    console.log('error! app.get-budget');
    return res.redirect('/login.html');
   }
   for (var i = 0; i < 12; i++) {
    if (teamdata[i].shortName == req.cookies.team) {
     curTeamLastLogin = teamdata[i].lastLogin;
     Team.where({ shortName: req.cookies.team }).update({ $set: {last2ndLogin: teamdata[i].lastLogin, lastLogin: unixtime}}, function(err) {
      console.log(req.cookies.team + ' has accessed the budget page: ' + new Date(unixtime * 1000));
     });
    }
    tempBudget.push([teamdata[i].shortName, teamdata[i].startBudget, teamdata[i].availBudget, teamdata[i].ifWonAllBudget]);
   }

   res.render('pages/budget', {budget: tempBudget});
  });
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

  Team.findOne({ shortName: req.body.team }, function(err, data) {
   if (err) {
    console.log('error! app.post-bid');
    return res.redirect('/login.html');
   }

   console.log('checking nomination for team ' + data.shortName);
   var highBidAllowed = data.ifWonAllBudget - (24 - data.rosterCountTemp);
   if (req.body.bid > highBidAllowed) {
    console.log('Cannot afford nomination  of ' + req.body.bid + ' because highest bid allowed is: ' + highBidAllowed);
    return res.redirect('/biderror.html/cannot%20afford%20nomination');
   }

   req.body.firstName = req.body.firstName.replace(/\s+/g,"");
   req.body.firstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1);
   req.body.lastName = req.body.lastName.replace(/\s+/g,"");
   req.body.lastName = req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1);

   //check to see if player is already nominated
/*   Bid.findOne({ lastName: req.body.lastName, firstName: req.body.firstName }, function(err, bidcheck) {
    if (err) {
     console.log('error! app.post-nominate bid.findOne');
     return res.redirect('/login.html');
    }
    if (bidcheck.lastName) {
     console.log(bidcheck.lastName + ' has already been nominated');
     return res.redirect('/biderror.html/error!%20Player%20has%20already%20been%20nominated');
    } else {
*/    
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

     Team.where({ shortName: req.body.team }).update({ $inc: {rosterCountTemp: +1, ifWonAllBudget: -(req.body.bid)}}, function(err) {
      if (err) {
       console.log('error! app.post-nominate team.where');
       return res.redirect('/login.html');
      }
      console.log(req.body.team + ' has rosterCountTemp added 1 and ifWonAllBudget deducted by ' + req.body.bid);
     });


     return res.redirect('/auction_board.html');

//    }
//   });

  //res.render('pages/bid_confirm', {Player: req.body.player, Team: req.body.team, Bid: req.body.bid});
  });
 });

 app.get('/closed_board.html', function(req, res) {
  if (!req.cookies.team) {
   return res.redirect('/login.html');
  }

   Bid.find({}, null, {sort: {lastName: 1, bid: -1}}, function(err, data) {
   if (err) {
    console.log('error! app.get-closed_board bid.find');
    return res.redirect('/login.html');
   }
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
      prevPlayer = curPlayer;
     } else {
      closedAuctions.push(newData);
     }
    });

    res.render('pages/closed_board', {closed: closedAuctions});
   });
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

