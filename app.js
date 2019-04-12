const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT | 3000

app.use(express.static('public'))

const sessions = {}

const getId = length => {
  const idArr = Array(length)
  const chars = 'abcdefghijklmnopqrstuvwxyz'

  for (let i = 0; i < length; i++) {
    idArr[i] = chars.charAt(Math.floor(Math.random() * chars.length))
  }

  if (sessions[idArr.join('')] !== undefined) {
    return getId(length)
  }

  return idArr.join('')
}

const onCreate = socket => {
  const id = getId(6)
  sessions[id] = { id: id, caller: socket, callee: null }
  socket.emit('created', id)
}

const onJoin = (socket, id) => {
  if (sessions[id] !== undefined && sessions[id].callee === null) {
    sessions[id].callee = socket

    socket.on('offer', desc => sessions[id].caller.emit('offer', desc))
    sessions[id].caller.on('answer', desc => socket.emit('answer', desc))

    socket.on('icecandidate', cand => sessions[id].caller.emit('icecandidate', cand))
    sessions[id].caller.on('icecandidate', cand => socket.emit('icecandidate', cand))

    socket.on('leave', _ => sessions[id].caller.emit('leave', 0))
    sessions[id].caller.on('leave', _ => socket.emit('leave', 0))

    socket.emit('joined', 0)
    // sessions[id].caller.emit('joined', 0)
  }

  socket.emit('invalid', 0)
}

// singnaling route
io.on('connection', socket => {
  socket.on('create', _ => onCreate(socket))

  socket.on('join', id => onJoin(socket, id))

  console.log('user connected')

  socket.on('disconnect', _ => console.log('user disconnected'))
})

http.listen(port, () => console.log(`bound ${port}`))
