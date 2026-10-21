/** Continuous motor harmonics and filtered airflow. Allocated once per drive. */
export function createJokerMotorAudio(context: AudioContext) {
  const output = context.createGain(), filter = context.createBiquadFilter()
  output.gain.value = .025
  filter.type = 'lowpass'; filter.frequency.value = 320; filter.Q.value = .5
  filter.connect(output).connect(context.destination)
  const motors = [1, 2.01].map(harmonic => {
    const oscillator = context.createOscillator(), gain = context.createGain()
    oscillator.type = harmonic === 1 ? 'sawtooth' : 'triangle'
    gain.gain.value = harmonic === 1 ? .42 : .24
    oscillator.connect(gain).connect(filter); oscillator.start()
    return { oscillator, gain, harmonic }
  })
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  const air = context.createBufferSource(), airFilter = context.createBiquadFilter(), airGain = context.createGain()
  air.buffer = buffer; air.loop = true
  airFilter.type = 'bandpass'; airFilter.frequency.value = 850; airFilter.Q.value = .65
  airGain.gain.value = 0
  air.connect(airFilter).connect(airGain).connect(context.destination); air.start()
  function update(speed: number, boost: boolean, gliding: boolean) {
    const level = Math.max(0, Math.min(1, speed)), time = context.currentTime
    for (const { oscillator, harmonic } of motors) oscillator.frequency.setTargetAtTime((42 + level * 90 + (boost ? 22 : 0)) * harmonic, time, .10)
    filter.frequency.setTargetAtTime(240 + level * 530 + (boost ? 330 : 0), time, .10)
    output.gain.setTargetAtTime(gliding ? .007 : .018 + level * .012, time, .12)
    airGain.gain.setTargetAtTime(gliding ? .025 : boost ? .020 : level * .004, time, .15)
    airFilter.frequency.setTargetAtTime(gliding ? 650 : boost ? 1450 : 850, time, .15)
  }
  function stop() {
    for (const { oscillator, gain } of motors) { oscillator.stop(); oscillator.disconnect(); gain.disconnect() }
    air.stop(); air.disconnect(); airFilter.disconnect(); airGain.disconnect(); filter.disconnect(); output.disconnect()
  }
  return { update, stop }
}
