let audioContext = null
let masterGain = null
let fireNoise = null
let isPlaying = false

export function initAudio() {
  if (audioContext) return

  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = audioContext.createGain()
  masterGain.gain.value = 0.3
  masterGain.connect(audioContext.destination)
}

export function startAmbience() {
  if (isPlaying || !audioContext) return
  isPlaying = true

  startFireCrackle()
  startRoomTone()
}

function startFireCrackle() {
  const bufferSize = audioContext.sampleRate * 2
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  fireNoise = audioContext.createBufferSource()
  fireNoise.buffer = buffer
  fireNoise.loop = true

  const lowpass = audioContext.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 400

  const highpass = audioContext.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 100

  const fireGain = audioContext.createGain()
  fireGain.gain.value = 0.15

  const lfo = audioContext.createOscillator()
  lfo.frequency.value = 0.5
  const lfoGain = audioContext.createGain()
  lfoGain.gain.value = 0.05

  lfo.connect(lfoGain)
  lfoGain.connect(fireGain.gain)
  lfo.start()

  fireNoise.connect(lowpass)
  lowpass.connect(highpass)
  highpass.connect(fireGain)
  fireGain.connect(masterGain)

  fireNoise.start()

  scheduleCrackles()
}

function scheduleCrackles() {
  if (!isPlaying || !audioContext) return

  const delay = Math.random() * 2000 + 500

  setTimeout(() => {
    if (isPlaying && audioContext) {
      playCrackle()
      scheduleCrackles()
    }
  }, delay)
}

function playCrackle() {
  const duration = 0.05 + Math.random() * 0.1

  const osc = audioContext.createOscillator()
  osc.type = 'square'
  osc.frequency.value = 80 + Math.random() * 100

  const filter = audioContext.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 200 + Math.random() * 300
  filter.Q.value = 2

  const gain = audioContext.createGain()
  gain.gain.setValueAtTime(0.1 + Math.random() * 0.1, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)

  osc.start()
  osc.stop(audioContext.currentTime + duration)
}

function startRoomTone() {
  const bufferSize = audioContext.sampleRate * 4
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3
  }

  const roomNoise = audioContext.createBufferSource()
  roomNoise.buffer = buffer
  roomNoise.loop = true

  const lowpass = audioContext.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 150

  const roomGain = audioContext.createGain()
  roomGain.gain.value = 0.08

  roomNoise.connect(lowpass)
  lowpass.connect(roomGain)
  roomGain.connect(masterGain)

  roomNoise.start()
}

export function playPageTurn() {
  if (!audioContext) return

  const duration = 0.3

  const noise = audioContext.createBufferSource()
  const bufferSize = audioContext.sampleRate * duration
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    const envelope = Math.sin(t * Math.PI)
    data[i] = (Math.random() * 2 - 1) * envelope * 0.5
  }

  noise.buffer = buffer

  const filter = audioContext.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2000
  filter.Q.value = 0.5

  const gain = audioContext.createGain()
  gain.gain.value = 0.2

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)

  noise.start()
}

export function stopAmbience() {
  isPlaying = false
  if (fireNoise) {
    fireNoise.stop()
    fireNoise = null
  }
}
