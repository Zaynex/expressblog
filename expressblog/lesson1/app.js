var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);

var routes = require('./routes/index');
var settings = require("./setting");
var flash = require("connect-flash");

var app = express();

module.exports = app;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.set('port', 4000);
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge:1000*60*60*24*30},//30days
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port,
    url:'mongodb://localhost/blog' //要加一个url,
  })
}));


routes(app);

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});