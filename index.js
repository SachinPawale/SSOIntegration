const passport = require('passport')
const SamlStrategy = require('passport-saml').Strategy;
const express = require('express');
const app = express()
const pool = require('./db')
const constants = require('./constants')
const expressSession = require('express-session')
const xml2js = require('xml2js');
const flash = require('connect-flash')


app.use(express.json())

app.use(express.urlencoded({ extended: false }))
app.use(expressSession({
    resave: false,
    saveUninitialized: true,
    secret: 'cat'
}));

passport.serializeUser(function (user, done) {
    console.log('userrrrrrrrrrrr', user)
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('userrrrrrrrrrrr1111111111111', user)
    done(null, user);
});


// app.use(express.urlencoded())

//let cert1 = require('fs').readFileSync(__dirname + '/testFiles/AWS_SSO_for_Custom SAML 2.0 application_certificate.pem', 'utf8')

let cert = require('fs').readFileSync(__dirname + '/AWS_SSO_for_Custom SAML 2.0 application_certificate.pem', 'utf8')
var samlStrategy = new SamlStrategy({
    callbackUrl: constants.SSO_CALLBACK_URL,
    entryPoint: constants.SSO_ENTRY_POINT_URL,
    issuer: constants.SSO_ISSUER_URL,
    logoutUrl: constants.SSO_LOGOUT_URL,
    cert: cert
}, function (profile, done) {
    console.log('Profile: %j', profile);
    return done(null, profile);
});

passport.use(samlStrategy);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())

app.get('/ssoapi/login/fail', (req, res) => res.send(`${req.flash("error")}  <p> test </p>`))

app.get('/ssoapi', (req, res) => res.send(`${req.flash("info")} <p> AttemptedUrl </p>`))

//app.get('/.well-known/pki-validation/:Id', (req, res) => )


app.get('/ssoapi/',
    passport.authenticate('saml', { failureRedirect: '/ssoapi/login/fail' }),
    (req, res) => {
        res.send('Hello World!');
    }
);

app.post('/ssoapi/login/callback',
    passport.authenticate('saml', { failureRedirect: '/ssoapi/login/fail', failureFlash: true }),
    async (req, res) => {
        try {
            console.log('reqqqqqqqqq', req.headers)
            let xmlData = Buffer.from(req.body.SAMLResponse, 'base64').toString()
            //console.log('xmlData', xmlData)
            let email = await parseXml(xmlData)
            console.log("Emailllllllllllll", email)
            req.flash('info', `Welcome ${email}`)
            res.redirect('/ssoapi')
            //add the email validation logic here in index.js

            //res.send(JSON.stringify(req.body));
        } catch (error) {
            console.log('error', error)
            req.flash('error', 'Access Denied')
            res.redirect('/ssoapi/login/fail');

        }


    }
);

// app.post('/api/authorizeUser', (req, res) => {
//     pool.query(`select EmailId from usermst where EmailId = '${req.body.emailId}'  `, (err, result, fields) => {
//         if (err) {
//             res.status(500).send({ error: err })
//         }
//         else {
//             console.log(result)
//             if (result.length && result[0].EmailId) {
//                 //res.status(200).send("done")
//                 res.redirect('/')
//             }
//             else {
//                 res.status(403).send()
//             }

//         }
//     })
// })


app.listen(constants.PORT_NO, () => console.log("Server is listening on port", constants.PORT_NO))

async function parseXml(xmlData) {
    return new Promise((resolve, reject) => {
        let parser = new xml2js.Parser();
        parser.parseString(xmlData, function (err, result) {
            //Extract the value from the data element
            //extractedData = result['config']['data'];
            if (err) {
                reject(err)
            } else {
                resolve(result["saml2p:Response"]["saml2:Assertion"][0]["saml2:Subject"][0]["saml2:NameID"][0]["_"]);

            }
            //console.log(result);
        })
    })
}