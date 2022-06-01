const passport = require('passport')
//const SamlStrategy = require('passport-saml').Strategy;
const express = require('express');
const app = express()
const pool = require('./db')
const constants = require('./constants')
var saml = require('passport-saml');

app.use(express.json())
// app.use(express.urlencoded())

let cert = require('fs').readFileSync(__dirname + '/AWS_SSO_for_Custom SAML 2.0 application_certificate.pem', 'utf8')
var samlStrategy = new saml.Strategy({
    //decryptionPvk: pvk,
    cert: cert
}, function (profile, done) {
    console.log('Profile: %j', profile);
    return done(null, profile);
});

passport.use(samlStrategy);

app.post('/SSOapi/authorizeUser', (req, res) => {
    passport.authenticate('saml', { failureRedirect: 'https://csrg.lightstorm.in/ltc/login' }),
        function (req, res) {
            res.redirect('https://csrg.lightstorm.in/ltc/asset');
        }
})

app.post('/SSOapi/authorizeUsertest', (req, res) => {
    console.log("authorize User !!");
    pool.query(`select EmailId from usermst where EmailId = '${req.body.emailId}'  `, (err, result, fields) => {
        if (err) {
            res.status(500).send({ error: err })
        }
        else {
            console.log(result)
            if (result.length && result[0].EmailId) {
                //res.status(200).send("done")
                res.redirect('/')
            }
            else {
                res.status(403).send()
            }

        }
    })
})

app.get("/SSOapi/sample", function (req, res) {
    console.log("Sample API called!!");
    res.status(200).json({ Success: true, Message: "Welcome Hello ", Data: null });
});


app.listen(constants.PORT_NO, () => console.log("Server is listening on port", constants.PORT_NO))