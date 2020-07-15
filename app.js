const   express = require('express'),
        bodyParser = require('body-parser'),
        session = require("express-session"),
        passport = require('./passport'),
        ejs = require('ejs'),
        router = require('./router'),
        app = express();

app.set('view engine','ejs');
app.use(express.static('./public'));
app.use(session({ secret: 'keyboard cat' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', router);

app.set( 'port', ( process.env.PORT || 5000 ));

// Start node server
app.listen( app.get( 'port' ), function() {
  console.log( 'Node server is running on port ' + app.get( 'port' ));
  });
