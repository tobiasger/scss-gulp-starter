// Express, Socket.io config
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const easymidi = require('easymidi');
let midiInputs = easymidi.getInputs();
let midiOutputs = easymidi.getOutputs();
let midiInput = null;
let midiOutput = null;

app.use(express.static(path.join(__dirname, '/public')));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

// Sequencer Logic
let bpm = 120
let timer = null
let sequencerRunning = false
let globalCurrentTick = 0;
let globalLength = 32

class Track {
  constructor(length) {
    this.ticks = new Array(32).fill(0);
    this.currentTick = globalCurrentTick
    this.length = length
    this.recording = false
    this.muted = false
  }
}
let tracks = new Array()
tracks.push(new Track(32))
tracks[0].ticks[3] = {
  note: 56,
  velocity: 127
}

const startSequencer = () => {
  sequencerRunning = true
  timer = setInterval(() => {
    globalCurrentTick++
    tracks.forEach((track, trackIndex) => {
      track.currentTick++
      if (track.currentTick >= track.length) track.currentTick = 0
      if (track.ticks[track.currentTick] !== 0 && !track.muted) sendNoteMessage(track.ticks[track.currentTick].note, track.ticks[track.currentTick].velocity, 60000 / bpm / 4, trackIndex)
      io.emit('tracks-init', tracks)
    })
    if (globalCurrentTick >= globalLength) globalCurrentTick = 0
    io.emit('sequencer-current-tick', globalCurrentTick)
  }, 60000 / bpm / 4)
  io.emit('sequencer-running', sequencerRunning)
}

const stopSequencer = () => {
  sequencerRunning = false
  clearInterval(timer);
  io.emit('sequencer-running', sequencerRunning)
}

const resetSequencer = () => {
  globalCurrentTick = 0
  tracks.forEach((track) => {
    track.currentTick = 0
  })
  io.emit('tracks-init', tracks)
  io.emit('sequencer-current-tick', globalCurrentTick)
}

const sendNoteMessage = (note, velocity, gate, channel) => {
  midiOutput.send('noteon', {
    note: note,
    velocity: velocity,
    channel: channel
  });
  setTimeout(() => {
    midiOutput.send('noteoff', {
      note: note,
      velocity: velocity,
      channel: channel
    });
  }, gate);
}

// Socket.io Init
io.on('connection', (socket) => {
  io.emit('midi-inputs', midiInputs)
  io.emit('midi-outputs', midiOutputs)
  io.emit('tracks-init', tracks)
  socket.on('set-midi-input', (input) => {
    midiInput = new easymidi.Input(input);
  })
  socket.on('set-midi-output', (output) => {
    midiOutput = new easymidi.Output(output);
  })
  socket.on('track-mute', (trackIndex) => {
    tracks[trackIndex].muted = true
    io.emit('tracks-init', tracks)
  })
  socket.on('track-unmute', (trackIndex) => {
    tracks[trackIndex].muted = false
    io.emit('tracks-init', tracks)
  })
  socket.on('track-add', () => {
    tracks.push(new Track(32))
    tracks[1].ticks[8] = {
      note: 56,
      velocity: 127
    }
    io.emit('tracks-init', tracks)
  })
  socket.on('sequencer-start', () => {
    startSequencer();
  })
  socket.on('sequencer-stop', () => {
    stopSequencer();
  })
  socket.on('sequencer-reset', () => {
    resetSequencer();
  })
});