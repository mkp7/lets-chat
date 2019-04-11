(function () {
  const socket = io()
  const localStreamEl = document.getElementById('local_stream')
  const peerStreamEl = document.getElementById('peer_stream')
  let localStream = null

  // Set things up, connect event listeners, etc.
  function newRTCConn () {
    const conn = new RTCPeerConnection()

    conn.onicecandidate = e => !e.candidate ||
      socket.emit('icecandidate', e.candidate)

    conn.ontrack = event => {
      peerStreamEl.srcObject = event.streams[0]
      // document.getElementById('hangup-button').disabled = false
    }

    conn.createDataChannel('sendChannel')

    localStreamEl.srcObject = localStream
    localStream.getTracks().forEach(track => conn.addTrack(track, localStream))

    return conn
  }

  function startup () {
    const create = document.getElementById('create')
    const join = document.getElementById('join')
    const leave = document.getElementById('leave')
    const peerid = document.getElementById('peerid')
    let sessionId = document.getElementById('session_id')
    let myconn = null

    // get peer media
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(ls => {
        localStream = ls
        // localStreamEl.srcObject = localStream
        // localStream.getTracks().forEach(track => conn.addTrack(track, localStream))
      })
      .catch(handleGetUserMediaError)

    // socket event listeners

    socket.on('created', id => (sessionId.value = id))

    socket.on('joined', _ => {
      // setup offer ...

      myconn = newRTCConn()

      myconn.createOffer()
        .then(offer => myconn.setLocalDescription(offer))
        .then(() => socket.emit('offer', myconn.localDescription))
        .catch(handleCreateDescriptionError)
    })

    socket.on('offer', desc => {
      // set offer

      myconn = newRTCConn()

      myconn.setRemoteDescription(desc)
        .then(() => myconn.createAnswer())
        .then(answer => myconn.setLocalDescription(answer))
        .then(() => socket.emit('answer', myconn.localDescription))
    })

    socket.on('answer', desc => {
      // set remote description and setup answer

      myconn.setRemoteDescription(desc)
        .catch(handleCreateDescriptionError)
    })

    socket.on('icecandidate', cand => {
      // set ice candidate

      myconn.addIceCandidate(cand)
        .catch(handleAddCandidateError)
    })

    socket.on('leave', _ => {
      // close and unset connection
      myconn.close()
    })

    // Set event listeners for user interface widgets

    create.onclick = () => socket.emit('create', 0)
    join.onclick = () => socket.emit('join', peerid.value)
    leave.onclick = () => socket.emit('leave', 0)
    // disconnectButton.addEventListener('click', disconnectPeers, false)
    // sendButton.addEventListener('click', sendMessage, false)
  }

  function handleAddCandidateError () {
    console.log('Oh noes! addICECandidate failed!')
  }

  function handleCreateDescriptionError (error) {
    console.log('Unable to create an offer: ' + error.toString())
  }

  function handleGetUserMediaError (error) {
    console.log('Error in getting user media: ' + error.toString())
  }

  // Set up an event listener which will run the startup
  // function once the page is done loading.

  window.addEventListener('load', startup, false)
})()
