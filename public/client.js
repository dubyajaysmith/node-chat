// jshint esversion: 6, asi: true, laxcomma: true
'user strict()'

const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')

const buttons = {}
buttons.create = document.getElementById('create')
console.dir(buttons.create)
buttons.create.onclick = createOffer




const server = { urls: "stun:stun.l.google.com:19302" }

const enterPressed = e => e.keyCode == 13


const getMedia = navigator.mediaDevices.getUserMedia({video:true, audio:true})
    .then(stream => pc.addStream(localVideo.srcObject = stream))
    .catch(e => mkToast(e, 'error'))

const haveAnswer = (conn) => {

    //Fix up the answer
    const answer = `${conn.jamiesmith__Answer__c}\r\n`

    const desc = new RTCSessionDescription({ type:"answer", sdp:answer })
    pc.setRemoteDescription(desc)
        .then(x => mkToast('Connected', 'success'))
        .catch(x => mkToast(x, 'warning'))
}

const poleForAnswer = (Id) => {

    const getConn = new Promise((resolve, reject) => {
        
        console.log('pole for answer... ')
        console.log(Id)
    })
    .then(conn => conn.jamiesmith__Answer__c 
        ? haveAnswer(conn) 
        : setTimeout(() => poleForAnswer(Id), 10000))
    .catch(x => mkToast(x, 'warning'))

}

{   // if params, there's a connection made already so get it
    const Id = new URL(location.href).searchParams.get("id")
    if(Id){
        
        const getConn = new Promise((resolve, reject) =>
            Visualforce.remoting.Manager.invokeAction(
                '{!$RemoteAction.ForceRTC.getConnection}',
                Id,
                (result, e) => e.status ? resolve(result) : reject(e.message))
        ).then(conn => {

            mkToast('Found Connection. Replying...', 'success')

            //Fix up the offer
            const offer = `${conn.jamiesmith__Offer__c}\r\n`
            
            // set _offer
            const desc = new RTCSessionDescription({ type:"offer", sdp:offer })
            pc.setRemoteDescription(desc)
                .then(() => pc.createAnswer()).then(d => pc.setLocalDescription(d))
                .catch(error => mkToast(error, 'error'))
            
            pc.onicecandidate = e => {

                if (e.candidate){
                    return
                }

                // Answer = pc.localDescription.sdp

                // Set Answer for Peer's pole to pickup
                const setAnswer = new Promise((resolve, reject) =>
                    Visualforce.remoting.Manager.invokeAction(
                        '{!$RemoteAction.ForceRTC.setAnswer}',
                        Id,
                        pc.localDescription.sdp,
                        (result, e) => e.status ? resolve(result) : reject(e.message)))
                .then(x => mkToast('Set Answer. Waiting for peer\'s connection...'))
                .catch(error => mkToast(error, 'error'))
            }
            
        }).catch(error => mkToast(error, 'error'))
    }
    else {
        
        // Show creation stuff
        document.querySelector('.createArea').classList.remove('hide')

        // This is Client1
        const select = document.querySelector('.userList')
        select.innerHTML = `<option value="">--Select User--</option>`
        // Get potential ClientB's
        const getUsers = new Promise((resolve, reject) => {
            const users = [{Id:1, Name: 'Jamie'}]
            users.length ? resolve(users) : reject('No Users')
        })
        .then(x => x.map(u => select.innerHTML += `<option value="${u.Id}">${u.Name}</option>`))
        .catch(error => console.error(error))
    }
}

const pc = new RTCPeerConnection({ iceServers: [server] })
pc.onaddstream = e => {
    remoteVideo.srcObject = e.stream
    localVideo.classList.add('hide')
    remoteVideo.classList.remove('hide')
    localVideo.classList.add('connected')
    localVideo.classList.remove('hide')
}

let dc // data channel
pc.ondatachannel = e => dcInit(dc = e.channel)
pc.oniceconnectionstatechange = e => log(pc.iceConnectionState)
function dcInit() {

    dc.onopen = () => {
        document.querySelector('.chatArea').classList.remove('hide')
        mkToast('Chat available', 'success')
    }
    dc.onmessage = e => log(e.data)
}

function createOffer() {
    mkToast('Creating Offer....', 'info')
    const userId = document.querySelector('.userList').value

    if(userId){
        //mkToast('Creating connection.  This may take ~20 seconds.', 'info')
    }
    else {
        mkToast('Select a Peer to Connect to...', 'warning')
        return
    }
    
    dcInit(dc = pc.createDataChannel("chat"))

    getMedia.then(() => pc.createOffer())
        .then(d => pc.setLocalDescription(d))
        .catch(e => console.log(e))
        
    pc.onicecandidate = e => {

        if(e.candidate){
            return
        }

        const offer = pc.localDescription.sdp
            , uid = userId
        ;
        console.dir(offer)
        console.log(uid)

        const mkConn = new Promise((resolve, reject) => {

           
            sendToServer('offer', `?offer=${offer}&uid=${uid}`)

        }).then(conn => {
            console.dir(conn)
            mkToast('Connection created. Waiting for reply...', 'info')

            poleForAnswer(conn.Id)

        }).catch(error => console.error(error, 'error'))
    }
}

const sendToServer = (where, what) => new Promise((res, rej) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `/${where}/${what}`, true)
    xhr.onreadystatechange = () =>
        xhr.status == 200 ? res(xhr.responseText) : rej(xhr.error)
    xhr.send()
})

chat.onkeypress = e => {
    
    if (!enterPressed(e)){
        return
    }

    dc.send(chat.value)
    console.log(chat.value)
    chat.value = ''
}

const mkToast = (msg, type) => {
    
    const cont = document.createElement('div')
    const toaster = document.querySelector('.toaster')

    cont.innerHTML =  `<div>${type}: ${msg}</div>`
    
    //toaster.innerHTML = ''
    toaster.appendChild(cont.childNodes[0])
}

