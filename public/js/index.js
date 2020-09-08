var socket = io();
var app = new Vue({
  el: '#app',
  data: {
    midiInputs: null,
    midiOutputs: null,
    selectedMidiInput: null,
    selectedMidiOutput: null,
    tracks: [],
    sequencerRunning: false
  },
  methods: {
    addTrack(){
      socket.emit('track-add')
    },
    sequencerStart(){
      socket.emit('sequencer-start')
    },
    sequencerStop(){
      this.sequencerRunning ? socket.emit('sequencer-stop') : socket.emit('sequencer-reset')
    },
    setInput(){
      socket.emit('set-midi-input', this.selectedMidiInput)
    },
    setOutput(){
      socket.emit('set-midi-output', this.selectedMidiOutput)
    },
    toggleMuteTrack(trackIndex){
      this.tracks[trackIndex].muted ? socket.emit('track-unmute', trackIndex) : socket.emit('track-mute', trackIndex)
    }
  },
  created(){
    socket.on('tracks-init', (tracks) => {
      this.tracks = tracks
    })
    socket.on('midi-inputs', (inputs) => {
      this.midiInputs = inputs
    })
    socket.on('midi-outputs', (outputs) => {
      this.midiOutputs = outputs
    })
    socket.on('track-current-tick', (payload) => {
      this.tracks = payload
    })
    socket.on('sequencer-running', (payload) => {
      this.sequencerRunning = payload
    })
  }
})