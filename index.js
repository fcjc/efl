var express = require('express');
var cookieParser = require('cookie-parser');
var teamController = require('./controllers/teamController');
var boardController = require('./controllers/boardController');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//fire controllers
teamController(app);
boardController(app);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
