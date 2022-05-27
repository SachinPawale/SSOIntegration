var https = require('https');
var fs = require('fs');
var express = require("express");
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var saml = require('passport-saml');

var cert = fs.readFileSync('./certs/my-server-https-cert.crt', 'utf-8');
var pvk = fs.readFileSync('./certs/my-server-private.key', 'utf-8');
var uwIdpCert = fs.readFileSync('./certs/our-idp-server-https-cert.pem', 'utf-8');

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

var samlStrategy = new saml.Strategy({
    callbackUrl: 'https://my-domain-name.whatever.edu/login/callback',
    entryPoint: 'https://my-university/idp/entry/point',
    issuer: 'my-entity-id (domain name registered with university IdP)',
    decryptionPvk: pvk,
    cert: uwIdpCert
}, function(profile, done){
    console.log('Profile: %j', profile);
    return done(null, profile); 
});

passport.use(samlStrategy);

var app = express();
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret: fs.readFileSync('./certs/session-secret.txt', 'utf-8')}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', 
    passport.authenticate('saml', {failureRedirect: '/login/fail'}), 
    function(req, res) {
        res.send('Hello World!');
    }
);

app.post('/login/callback',
  passport.authenticate('saml', { failureRedirect: '/login/fail', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/login/fail', 
    function(req, res) {
        res.send(401, 'Login failed');
    }
);

app.get('/Shibboleth.sso/Metadata', 
    function(req, res) {
        res.type('application/xml');
        res.send(200, samlStrategy.generateServiceProviderMetadata(cert));
    }
);