// jshint asi: true, esversion: 6, laxcomma: true
'use strict()'

const express = require('express')
    , app = express('path')
    , path = require('path')
    , PORT = process.env.PORT || 5500
    , Storage = require('node-storage')
    , low = require('lowdb')
    , FileSync = require('lowdb/adapters/FileSync')
    , adapter = new FileSync('db.json')
    , DB = low(adapter)
;


if(DB.get('dev').value() == undefined){
    console.log('init DB')
    DB.get('posts').push({ id: 1, title: `DB init ${new Date().toLocaleDateString()}`}).write()
}


app.use(express.static(path.join(__dirname, 'public')))
   .get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')))
   .listen(PORT, () => console.log(`Listening on ${ PORT }`))

app.get('/setOffer/', (req, res) => {
    
    const uid = req.query.uid
        , offer = req.query.offer;

    console.log('setting offer..... ')

    const store = new Storage('signal')
    store.put('offer', req.query.offer)

    res.send({status: true, offer: 'set'})
})
app.get('/getOffer/', (req, res) => {
    

    console.log('getting offer..... ')

    const store = new Storage('signal')
    const offer = store.get('offer')

    res.send(offer)
})

app.get('/setAnswer/', (req, res) => {

    console.log('setting answer..... ')

    const store = new Storage('signal')
    store.put('answer', req.query.answer)

    res.send()
})
app.get('/getAnswer/', (req, res) => {

    console.log('getting answer..... ')

    const store = new Storage('signal')
    const answer = store.get('answer')
    const offer = store.get('offer')

    res.send({status: true, answer, offer})
})
