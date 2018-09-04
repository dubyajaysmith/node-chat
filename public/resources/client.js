// jshint asi: true, esversion: 6, laxcomma: true
'use strict()'

const uid = new URL(location.href).searchParams.get("uid")

const dom = {
    localVideo: document.getElementById('localVideo')
    ,remoteVideo: document.getElementById('remoteVideo')
    ,userList: document.querySelector('.userList')
    ,chatText: document.querySelector('.chatText')
    ,chatArea: document.querySelector('.chatArea')
    ,chatMessage: document.querySelector('.chatMessage')
    ,startButton: document.getElementById('startButton')
	, callButton: document.getElementById('callButton')
	, hangupButton: document.getElementById('hangupButton')
}

// Server tasks
const getConn = uid => new Promise((resolve, reject) => {
    
    fetch(`/getConn?uid=${uid}`, {
        method: 'GET'
    })
    .then(x => x.json(x))
    .then(x => resolve(x))
    .catch(x => reject(x))
})
const setOffer = offer => new Promise((resolve, reject) => {
    
    fetch(`/setOffer`, {
        method: 'POST',
        body: JSON.stringify({
            offer,
            uid: 420
            //id: Math.random()*Math.random(),
        }),
        headers: new Headers({ "Content-Type": "application/json" }) // add headers
    })
    .then(x => x.json(x))
    .then(x => resolve(x))
    .catch(x => reject(x))
})
const setAnswer = (uid, answer)  => new Promise((resolve, reject) => {
    console.log('SETTING ANSWER FOR', uid)
    
    fetch('/setAnswer/', {
        method: 'POST',
        body: JSON.stringify({
            uid,
            answer
        }),
        headers: new Headers({ "Content-Type": "application/json" }) // add headers
    })
    .then(x => resolve(x.json(x)))
    .catch(x => reject(x))
})
const poleForConn = uid => new Promise(resolve => {
    console.log('pole for Conn for', uid)

    getConn(uid)
    .then(conn => conn
        ? resolve(conn) 
        : setTimeout(() => poleForConn(uid), 10000))
    .catch(x => {
        console.log('POLE for getConn Error')
        console.dir(x)
    })
})


dom.startButton.onclick = () => {

	console.log('Requesting local stream')
	startButton.disabled = true
	navigator.mediaDevices .getUserMedia({
			audio: true,
			video: true
    })
    .then(stream => {

        console.log('Received local stream')
        dom.localVideo.srcObject = stream
        callButton.disabled = false
        pc.addStream(stream)

    })
    .catch(error => console.log(error))
}

dom.callButton.onclick = () => {


    if(!uid){
        console.log('Client A')
        createOffer()
    }
    else { 
        console.log('Client B')
        console.log(uid)
        poleForConn(uid)
        .then(conn => {

            const sdp = `${conn.offer}`

            console.log('Found offer sdp. Making Answer...')
            //console.log(sdp)
            
            const desc = new RTCSessionDescription({sdp, type:'offer'})
            pc.setRemoteDescription(desc)
                .then(() => pc.createAnswer())
                .then(answer => {

                    pc.setLocalDescription(answer)
                    
                    setAnswer(uid, answer)
                    .then(x => toast.pop('Success', 'Answer Set. Waiting for peer\'s connection...'))
                    .catch(error => console.error(error))
                })
                .catch(e => console.error(e))
            
            pc.onicecandidate = e => {

                console.log('inside onicecandidate')

                if (e.candidate){
                    console.log('CHECK HIT> HITTING BRAKES')
                    return
                }

                mkToast('onicecandidate', 'success')

            }
        })
        .catch(error => console.log(error))
    }
}

dom.hangupButton.onclick = () => {
    console.log('Ending call')
	pc.close()
	//pc = null
	hangupButton.disabled = true
	callButton.disabled = false
}







const server = { urls: "stun:stun.l.google.com:19302" }



const haveAnswer = (conn) => {

    console.log('haveAnswer!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.dir(conn)
    //Fix up the answer
    const answer = `${conn.answer}`

    const desc = new RTCSessionDescription({ type:"answer", sdp:answer })
    pc.setRemoteDescription(desc)
        .then(x => mkToast('Connected', 'success'))
        .catch(x => mkToast(x, 'warning'))
}

const poleForAnswer = uid => {
    console.log('pole for answer for', uid)

    getConn(uid)
    .then(conn => conn.answer
        ? haveAnswer(conn) 
        : setTimeout(() => poleForAnswer(uid), 10000))
    .catch(x => {
        console.log('POLE for getConn Error')
        console.dir(x)
    })

}

const pc = new RTCPeerConnection({ iceServers: [server] })
pc.ontrack = e => {
    console.log('ONTRACK ')
    console.dir(e)
    dom.remoteVideo.srcObject = e.streams[0]
    dom.localVideo.classList.add('hide')
    dom.remoteVideo.classList.remove('hide')
    dom.localVideo.classList.add('connected')
    dom.localVideo.classList.remove('hide')
}

let dc // data channel
pc.ondatachannel = e => {
    dc = e.channel
    console.log('ON DATA CHANNEL')
    console.dir(dc)
    dcInit(dc)
}
pc.oniceconnectionstatechange = e => console.log(pc.iceConnectionState)
function dcInit(dc) {

    dc.onopen = () => {
        dom.chatArea.classList.remove('hide')
        mkToast('Chat available', 'success')
    }
    dc.onmessage = e => dom.chatText.innerHTML += `<p>${e.data}<p/><br/>`
}

function createOffer() {
    mkToast('Creating Offer....', 'info')
    //const userId = dom.userList.value

    //if(userId){
    //    //mkToast('Creating connection.  This may take ~20 seconds.', 'info')
    //}
    //else {
    //    mkToast('Select a Peer to Connect to...', 'warning')
    //    return
    //}
    
    dcInit(dc = pc.createDataChannel("chat"))

    pc.createOffer()
    .then(d => pc.setLocalDescription(d))
    .catch(e => console.log('Error: '+e.toString()))
        
    pc.onicecandidate = e => {

        if(e.candidate){
            return
        }

        if(!uid){
            setOffer(pc.localDescription.sdp)
            .then(conn => {

                mkToast('Connection created. Waiting for reply...', 'info')
                //console.dir(conn)

                poleForAnswer(conn.uid)

            }).catch(error => console.error(error))
        }
    }
}

/* dom.chatMessage.onkeypress = e => {
    console.log(e.keyCode )
    if (!e.keyCode === 13){
        return
    }

    dc.send(dom.chatMessage.value)
    dom.chatText.innerHTML += `You: ${dom.chatMessage.value}<br/>`
    dom.chatMessage.value = ''
} */