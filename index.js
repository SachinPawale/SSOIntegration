const passport = require('passport')
const SamlStrategy = require('passport-saml').Strategy;
const express = require('express');
const app = express()
const pool = require('./db')
const constants = require('./constants')

app.use(express.json())
// app.use(express.urlencoded())


app.post('/api/authorizeUser', (req, res) => {
    pool.query(`select EmailId from usermst where EmailId = '${req.body.emailId}'  `, (err, result, fields) => {
        if (err) {
            res.status(500).send({ error: error })
        }
        else {
            console.log(result)
            if (result.length && result[0].EmailId) {
                res.status(200).send()
            }
            else{
                res.status(403).send()
            }

        }
    })
})


app.listen(constants.PORT_NO, () => console.log("Server is listening on port", constants.PORT_NO))