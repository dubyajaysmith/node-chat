// jshint esversion: 6, asi: true, laxcomma: true
//'user strict()'

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

        const xhr = new XMLHttpRequest()
        // todo may need a user to put their name later
        xhr.open("GET", `/getAnswer/`)
        xhr.onreadystatechange = () =>
            xhr.status == 200 ? resolve(xhr) : setTimeout(getConn(), 2000)
        xhr.send()
    
    })
    .then(conn => conn.jamiesmith__Answer__c 
        ? haveAnswer(conn) 
        : setTimeout(() => poleForAnswer(Id), 10000))
    .catch(x => mkToast(x, 'warning'))

}

{   // todo unneeded until links, if params, there's a connection made already so get it
    const Id = new URL(location.href).searchParams.get("id")
    if(Id){
        
        const getConn = new Promise((resolve, reject) => {
            console.log('Has param: ', Id)
            const xhr = new XMLHttpRequest()
            xhr.open("GET", `/getOffer/`, false)
            xhr.onreadystatechange = () => {
                const offer = xhr.response
                console.log(offer.length)
                xhr.status == 200 
                    ? resolve(offer) : reject('not good')
            }
            xhr.send()
            
        }).then(offer => {

            console.log('in offer then >> ', offer.length)

            if(offer){
                    
                mkToast('Found Offer. Making Answer...', 'success')
                //console.log(offer)

                // set _offer
                const desc = new RTCSessionDescription({ type:"offer", sdp:offer })
                pc.setRemoteDescription(desc)
                    .then(() => {
                        console.log('setRemoteDescription THEN >> ')
                        pc.createAnswer()
                    }).then(d => {
                        pc.setLocalDescription(d)
                        console.log('setLocalDescription THEN >> ')
                    })
                    .catch(error => console.error(error))
                
                pc.onicecandidate = e => {

                    console.log('inside onicecandidate')

                    
                    if (e.candidate){
                        console.log('CHECK HIT> HITTING BRAKES')
                        return
                    }


                    const answer = pc.localDescription.sdp
                    console.log(answer.length)
                    mkToast('Made Answer. Sending...', 'success')

                    // Set Answer for Peer's pole to pickup
                    const setAnswer = new Promise((resolve, reject) => {
                        console.log('SETTING ANSWER... ')
                        const xhr = new XMLHttpRequest()

                        xhr.open("GET", `/setAnswer/?answer=${answer}`)
                        xhr.onreadystatechange = (res) =>
                            xhr.status == 200 ? resolve(res) : reject('not good')
                        xhr.send()
                    })
                    .then(x => mkToast('Set Answer. Waiting for peer\'s connection...'))
                    .catch(error => console.error(error))
                }
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

        const mkConn = new Promise((resolve, reject) => {
            
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `/setOffer/?offer=${pc.localDescription.sdp}&uid=${userId}`)
            xhr.onreadystatechange = () =>
                xhr.status == 200 ? resolve(xhr) : reject(xhr.error)
            xhr.send()

        }).then(conn => {

            mkToast('Connection created. Waiting for reply...', 'info')
            console.dir(conn)

            poleForAnswer('nothing yet')

        }).catch(error => console.error(error, 'error'))
    }
}

const sendToServer = (where, what) => new Promise((res, rej) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `/${where}/${what}`, true)
    xhr.onreadystatechange = () =>
        xhr.status == 200 ? res(xhr.responseText) : rej(xhr)
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

