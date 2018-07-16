// jshint asi: true, esversion: 6, laxcomma: true
'use strict()'

const express = require('express')
    , app = express('path')
    , path = require('path')
    , PORT = process.env.PORT || 5500
    , Storage = require('node-storage')
;

app.use(express.static(path.join(__dirname, 'public')))
   .get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')))
   .listen(PORT, () => console.log(`Listening on ${ PORT }`))

app.get('/offer/', (req, res) => {
    
    const uid = req.query.uid
        , offer = req.query.offer;

    console.log('setting offer..... ')
    console.dir(offer)
    console.dir(uid)

    const store = new Storage('signal')
    store.put('offer', req.query)

    res.send('success')

})