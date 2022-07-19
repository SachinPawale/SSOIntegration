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

app.use(express.urlencoded())
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

let cert1 = require('fs').readFileSync(__dirname + '/testAppFiles/AWS_SSO_for_Custom SAML 2.0 application_certificate2.pem', 'utf8')

var samlStrategy = new SamlStrategy({
    //callbackUrl: 'http://43.204.223.103:3001/api/login/callback',
    callbackUrl: 'https://43.204.237.53/ssoapi/login/callback',
    //entryPoint:'https://portal.sso.ap-south-1.amazonaws.com/saml/assertion/MTAyODgxNzE3MjkyX2lucy02ZjZiMzYwMmJjYWM3NTFl',
    entryPoint: "https://d-9f672cf8b6.awsapps.com/start#/",
    issuer: "https://portal.sso.ap-south-1.amazonaws.com/saml/assertion/MzczNzYxNTEwMDExX2lucy1hYWYyNjdmZmU4NjhjNzNk",
    logoutUrl: "https://portal.sso.ap-south-1.amazonaws.com/saml/logout/MzczNzYxNTEwMDExX2lucy1hYWYyNjdmZmU4NjhjNzNk",
    cert: cert1
}, function (profile, done) {
    console.log('Profile: %j', profile);
    return done(null, profile);
});


passport.use(samlStrategy);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())
app.get('/login/fail', (req, res) => res.send(`${req.flash("error")} <p> test </p>`))

app.get('/', (req, res) => {
    res.send(
        `${req.flash("info")}
    <p> AttemptedUrl </p>`)
})

app.get('/.well-known/pki-validation/:Id', (req, res) => res.sendFile(__dirname + '/' + req.params.Id))


app.get('/ssoapi',
    passport.authenticate('saml', { failureRedirect: '/login/fail' }),
    function (req, res) {
        try {
            console.log("Api SSo was called")
            res.type('application/xml');

            //samlStrategy.generateServiceProviderMetadata(cert1)
            //require('fs').writeFileSync(__dirname + '/dummy.txt', 'pi SSo was called"')
            res.redirect('/');
        } catch (error) {
            res.redirect('/login/fail');

        }

    }
);

app.post('/ssoapi/login/callback',
    passport.authenticate('saml', { failureRedirect: '/login/fail', failureFlash: true }),
    async function (req, res) {
        try {
            console.log('reqqqqqqqqq', req.headers)
            let xmlData = Buffer.from(req.body.SAMLResponse, 'base64').toString()
            //console.log('xmlData', xmlData)
            let email = await parseXml(xmlData)
            req.flash('info', `Welcome ${email}`)
            res.redirect('/')
            //add the email validation logic here in index.js

            //res.send(JSON.stringify(req.body));
        } catch (error) {
            console.log('error', error)
            req.flash('error', 'Access Denied')
            res.redirect('/login/fail');

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