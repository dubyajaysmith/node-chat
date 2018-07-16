// jshint asi: true, esversion: 6, laxcomma: true
'use strict()'

const express = require('express')
    , path = require('path')
    , PORT = process.env.PORT || 5000;

express()
    .use(express.static(path.join(__dirname, 'public')))
    .get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))