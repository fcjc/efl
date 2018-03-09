var mongoose = require('mongoose');

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
 rosterCountTemp: Number,
 possibleRoster: Number,
 lastLogin: Number,
 last2ndLogin: Number,
});
var Team = mongoose.model('Team', TeamSchema);

module.exports = {
 Team: Team
}
