// jshint asi: true, esversion: 6, laxcomma: true
'use strict()'

const express = require('express')
    , app = express('path')
    , path = require('path')
    , PORT = process.env.PORT || 5000
    , server = require('http').createServer(app)
    , io = require('socket.io')(server)
;

app
    .use(express.static(path.join(__dirname, 'public')))
    .get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))

io.on('connection', function(client) {  
    console.log('Client connected...')

    client.on('join', function(data) {
        console.log(data)
    })
})

app.get('/mkConn/', function(req, res){
    
    const uid = req.params.uid
    const offer = req.params.offer

    console.log('setting offer..... ')
    console.dir(req.params)
    console.dir(uid)
    res.send(offer)
})