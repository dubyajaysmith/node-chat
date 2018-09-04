// jshint asi: true, esversion: 6, laxcomma: true
'use strict()'

const path = require('path')
    , express = require('express')
    , bodyParser = require('body-parser')
    , Storage = require('node-storage')
;
const app = express('path')
    , PORT = process.env.PORT || 4242
    , store = new Storage('/tmp/connections')
;




app.use(bodyParser.json())
    .use(express.static(path.join(__dirname, 'public')))
    .get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')))
    .listen(PORT)


// client talkers
app.get('/getConn/', (req, res) => {
    
    const uid = req.query.uid
        , conn = store.get(uid)
    ;
    
    res.send(conn)
})

app.post('/setOffer/', (req, res) => {

    const data = req.body
        , uid = data.uid.toString()
        , offer = data.offer
    ;

    if(store.get(uid)){
        store.remove(uid)
    }
    
    store.put(uid, {uid, offer, status: true})

    const conn = store.get(uid)
    console.log('>> setOffer')
    console.dir(conn)
    res.send(conn)
})

app.post('/setAnswer/', (req, res) => {

    const data = req.body
        , uid = data.uid.toString()
        , answer = data.answer.sdp//.replace(/UDP\/TLS\/RTP\/SAVPF/g, 'RTP/SAVPF')
        , conn = store.get(uid)
    ;
    
    console.log('SET ANSWER for', uid)

    conn.answer = answer

    store.put(uid, conn)
    
    res.send(store.get(uid))
})



// test playground
app.post('/fetch/', (request, response) => {
    console.log('fetch hit')
    console.log(request.body)
    response.json(request.body)
});