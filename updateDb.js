var mongoose = require('mongoose');

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
 rosterCount: Number,
 lastLogin: Date
});
var Team = mongoose.model('Team', TeamSchema);

var BidSchema = new mongoose.Schema({
 pos: String,
 secPos: String,
 thirdPos: String,
 firstName: String,
 lastName: String,
 bid: Number,
 team: String,
 bidTime: Date,
 nominate: Boolean,
 close: Boolean
});
var Bid = mongoose.model('Bid', BidSchema);

/*var addBid = new Bid({
 pos: '1B',
 secPos: '',
 thirdPos: '',
 firstName: 'Willie',
 lastName: 'McCovey',
 bid: '30',
 team: 'ACE',
 bidTime: new Date,
 nominate: 0,
 close: 0,
}).save(function (err) {
 console.log('player added');
});
*/

/*var TeamOne = new Team({
 name: 'Minor League',
 owner: 'Peti',
 login: 'peti',
 password: 'temp',
 shortName: 'MiLB',
 startBudget: 280,
 availBudget: 280,
 ifWonAllBudget: 280,
 rosterCount: 14,
 lastLogin: Date()
}).save(function (err) {
 console.log('item saved');
});
*/

/*Team.where({ shortName: 'Pastry' }).update({ $set: {rosterCount: 14} }, function (err, data) {
 console.log(data);
});
*/

Team.where({ shortName: 'Sailors' }).update({ $inc: {availBudget: -10, rosterCount: +1}}, function(err, data) {
 console.log('done');
});

