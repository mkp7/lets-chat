(function () {
  // Set things up, connect event listeners, etc.

  function startup () {
    const socket = io()
    const create = document.getElementById('create')
    const join = document.getElementById('join')
    const leave = document.getElementById('leave')
    const peerid = document.getElementById('peerid')
    let myid = null
    let myconn = null

    // socket event listeners

    socket.on('created', id => (myid = id))

    socket.on('joined', _ => {
      // create RTCPeerConnection and exchange ...
      myconn = new RTCPeerConnection()

      myconn.onicecandidate = e => !e.candidate ||

      socket.emit('icecandidate', e.candidate)
        .catch(handleAddCandidateError)

      myconn.createOffer()
        .then(offer => myconn.setLocalDescription(offer))
        .then(() => socket.emit('offer', myconn.localDescription))
        .catch(handleCreateDescriptionError)
    })

    socket.on('description', desc => {
      // set remote peer description
    })

    socket.on('icecandidate', cand => {
      // set ice candidate
    })

    socket.on('leave', _ => {
      // close and unset connection
    })

    // Set event listeners for user interface widgets

    create.onclick(() => socket.emit('create', 0))
    // disconnectButton.addEventListener('click', disconnectPeers, false)
    // sendButton.addEventListener('click', sendMessage, false)
  }

  function handleAddCandidateError () {
    console.log('Oh noes! addICECandidate failed!')
  }

  function handleCreateDescriptionError (error) {
    console.log('Unable to create an offer: ' + error.toString())
  }

  // Set up an event listener which will run the startup
  // function once the page is done loading.

  window.addEventListener('load', startup, false)
})()
