/* BASED ON

*/

import * as Tone from 'tone';
import audioBufferToWav from 'audiobuffer-to-wav';

import theory from './theory.js';

import m from '../Assets/audioSamples/m.wav';
import mUp from '../Assets/audioSamples/mUp.wav';

import kickAcoustic from '../Assets/audioSamples/kick_acoustic.wav';
import snareAcoustic from '../Assets/audioSamples/snare_acoustic.wav';
import closedHatAcoustic from '../Assets/audioSamples/closedHat_acoustic.wav';
import openedHatAcoustic from '../Assets/audioSamples/openedHat_acoustic.wav';
import lowTomAcoustic from '../Assets/audioSamples/lowTom_acoustic.wav';
import highTomAcoustic from '../Assets/audioSamples/highTom_acoustic.wav';
import crashAcoustic from '../Assets/audioSamples/crash_acoustic.wav';

import kickSubtle from '../Assets/audioSamples/kick_subtle.wav';
import snareSubtle from '../Assets/audioSamples/snare_subtle.wav';
import closedHatSubtle from '../Assets/audioSamples/closedHat_subtle.wav';
import openedHatSubtle from '../Assets/audioSamples/openedHat_subtle.wav';
import lowTomSubtle from '../Assets/audioSamples/lowTom_subtle.wav';
import highTomSubtle from '../Assets/audioSamples/highTom_subtle.wav';
import crashSubtle from '../Assets/audioSamples/crash_subtle.wav';

// ---------------------------------------------------------------

//ref to p5.js
let session;
function setSession(s) { session = s; }

// ---------------------------------------------------------------
// MIDI INPUT
// ---------------------------------------------------------------

class MIDIAccess {
    constructor(args = {}) {
        this.onDeviceInput = args.onDeviceInput || console.log;
        this.synth = new Tone.PolySynth().toDestination();
    }

    start() {
        return new Promise((resolve, reject) => {
            this._requestAccess().then(access=>{
            this.initialize(access);
            resolve();
            }).catch(() => reject('MIDI went wrong.'));
        });
    }

    initialize(access) {
        const devices = access.inputs.values();
        for (let device of devices) this.initializeDevice(device);

        access.onstatechange = this.onStateChange.bind(this);
    }

    initializeDevice(device){
        device.onmidimessage = this.onMessage.bind(this);
    }

    
    onMessage(message) {
        let [_, note, vel] = message.data;
        this.onDeviceInput({ note, vel });
    }

    onStateChange(event) {
        if (event.port.type === "input") {
            if (event.port.state === "connected") {
                if (session !== undefined) {
                    session.showLog = true;
                    session.logMessage = `MIDI device connected.`;
                }
            } else if (event.port.state === "disconnected") {
                if (session !== undefined) {
                    session.showLog = true;
                    session.logMessage = `MIDI device disconnected.`;
                }
            }
        }
    }

    _requestAccess() {
        return new Promise ((resolve, reject) => {
            if(navigator.requestMIDIAccess)
                navigator.requestMIDIAccess()
                    .then(resolve)
                    .catch(reject);
            else reject();
        });
    }
}

const midi = new MIDIAccess({ onDeviceInput });

midi.start().then(() => {
    console.log('MIDI STARTED');
}).catch(console.error);

function onDeviceInput({ note, vel }) {
    let n = note-Math.floor(note/12)*12;
    if (session.activeTab !== null) {
        if (session.activeTab.selectedTrack !== null) {
            let s = session.activeTab.selectedTrack.synth;
            if (session.activeTab.selectedTrack.name === "DRUMS") {
                if (vel !== 0 && n < theory.drumLabels.length) {
                    s.parts[n].start(Tone.context.currentTime);
                    if (n === 2) s.parts[3].stop();
                }
            } else {
                if (vel !== 0) {
                    s.oscillators[0].triggerAttack(theory.freqs[n]*Math.pow(2,Math.floor(note/12)+session.activeTab.selectedTrack.oscPitch[0]),Tone.context.currentTime);
                    s.oscillators[1].triggerAttack(theory.freqs[n]*Math.pow(2,Math.floor(note/12)+session.activeTab.selectedTrack.oscPitch[1]),Tone.context.currentTime);
                }
                else { 
                    s.oscillators[0].triggerRelease(theory.freqs[n]*Math.pow(2,Math.floor(note/12)+session.activeTab.selectedTrack.oscPitch[0]),Tone.context.currentTime);
                    s.oscillators[1].triggerRelease(theory.freqs[n]*Math.pow(2,Math.floor(note/12)+session.activeTab.selectedTrack.oscPitch[1]),Tone.context.currentTime);
                }
            }
        }
    }
}


// ---------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------

/*const context  = Tone.context;
const renderDest  = context.createMediaStreamDestination();
const renderer = new MediaRecorder(renderDest.stream, { mimeType: 'audio/wav' });
const chunks = [];*/

/*function exportLoopAudio(loop,nSteps,setLoading) {
    const renderer = new Tone.Recorder();

    let step = 0;

    Tone.Transport.scheduleRepeat(time => {
        if (step === 0) {
            melodyLeft.connect(renderer);
            melodyRight.connect(renderer);

            //melodyLeft.disconnect(Tone.Destination);
            //melodyRight.disconnect(Tone.Destination);
            renderer.start();
        }

        if (step < nSteps) {
            for (let i = 0; i < loop.tracks.length; i++) {
                for (let j = 0;j < loop.tracks[i].timeline[step].length; j++) {
                    if (loop.tracks[i].timeline[step][j] !== null) {
                        if (loop.tracks[i].name === "DRUMS") { 

                        } 
                        else {
                            loop.tracks[i].synth[0].triggerAttackRelease(theory.freqs[loop.tracks[i].timeline[step][j].pitch]*Math.pow(2,loop.tracks[i].timeline[step][j].octave),loop.tracks[i].timeline[step][j].duration*loop.timeBtwSteps);
                            loop.tracks[i].synth[1].triggerAttackRelease(theory.freqs[loop.tracks[i].timeline[step][j].pitch]*Math.pow(2,loop.tracks[i].timeline[step][j].octave),loop.tracks[i].timeline[step][j].duration*loop.timeBtwSteps);
                        }
                    }
                }
            }
        } else if (step > nSteps+nSteps/8) {
          Tone.Transport.stop();
          melodyLeft.disconnect(renderer);
          melodyRight.disconnect(renderer);
          //melodyLeft.connect(Tone.Destination);
          //melodyRight.connect(Tone.Destination);
          //melodyLeft.disconnect(renderDest);
          //melodyRight.disconnect(renderDest);
          setTimeout(async () => {
            // the recorded audio is returned as a blob
            const render = await renderer.stop();
            //console.log(render);
            // download the recording by creating an anchor element and blob url
            const url = URL.createObjectURL(render);
            const anchor = document.getElementById("export");
            anchor.download = loop.name+".webm";
            anchor.href = url;
            anchor.click();
            setLoading(false);
        }, nSteps/4*loop.timeBtwSteps);
        }
        step++;
        }, loop.timeBtwSteps);

        Tone.Transport.start();
}*/

function exportLoopAudio(loop,nSteps,setLoading) {

    let audioLength = loop.timeBtwSteps * loop.nSteps + loop.timeBtwSteps*loop.nSteps/8;

    Tone.Offline(({ transport }) => {

        let instruments = [];

        for (let i = 0; i < loop.tracks.length; i++) {
            let t = loop.tracks[i];
            if (loop.tracks[i].name === "DRUMS") instruments.push(new DrumSynth());
            else instruments.push(new Synth());
        }

        let step = 0;

        transport.scheduleRepeat(time => {
            if (step < nSteps) {
                for (let t in loop.tracks) {
                    for (let n in loop.tracks[t].timeline[step]) {
                        if (loop.tracks[t].timeline[step][n] !== null) {
                            let pitch = loop.tracks[t].timeline[step][n].pitch;
                            let octave = loop.tracks[t].timeline[step][n].octave;
                            let duration = loop.tracks[t].timeline[step][n].duration;
                            if (loop.tracks[t].name === "DRUMS") {
                                instruments[t].parts[pitch].start(time);
                                if (pitch === 2) instruments[t].parts[3].stop();
                            } else {

                                /*for (let j = 0; j < instruments[t].oscillators.length; j++) {
                                    instruments[t].oscillators[j].set({oscillator: {type: t.oscKnobs[j][0].output, volume: t.oscKnobs[j][2].output}});
                                    instruments[t].oscillators[j].set({envelope: {attack: t.envKnobs[j][0].output, decay: t.envKnobs[j][1].output, sustain: t.envKnobs[j][2].output, release: t.envKnobs[j][3].output}});
                                }
                            
                                instruments[t].fxChain.filter.frequency.value = t.filterKnob.output;
                                instruments[t].fxChain.distortion.wet.value = t.distKnobs[0].output;
                                instruments[t].fxChain.delay.delayTempo.value = t.dlyKnobs[0].output;
                                instruments[t].fxChain.delay.feedback.value = t.dlyKnobs[1].output;
                                instruments[t].fxChain.delay.wet.value = t.dlyKnobs[2].output;
                                instruments[t].fxChain.reverb.decay = t.rvbKnobs[0].output;
                                instruments[t].fxChain.reverb.wet.value = t.rvbKnobs[1].output;*/
                

                                instruments[t].oscillators[0].triggerAttackRelease(theory.freqs[pitch]*Math.pow(2,octave),duration*loop.timeBtwSteps,time);
                                instruments[t].oscillators[1].triggerAttackRelease(theory.freqs[pitch]*Math.pow(2,octave),duration*loop.timeBtwSteps,time);
                            }
                        }
                    }
                }
            }
            else if (step > nSteps+nSteps/8) Tone.Transport.stop();
            step++;
        }, loop.timeBtwSteps);

        transport.start();

    }, audioLength).then((buffer) => {
        const blob = new Blob([audioBufferToWav(buffer)], { type: "audio/wav" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.getElementById("export");
        anchor.download = loop.name+".wav";
        anchor.href = url;
        anchor.click();
        setLoading(false);
    });
}

// ---------------------------------------------------------------
// METRONOME
// ---------------------------------------------------------------

class Metronome {
    constructor() {
        this.state = false;
        this.click = [new Tone.Player(mUp).toDestination(), new Tone.Player(m).toDestination()];
    }
}

const metronome = new Metronome();

Tone.Transport.scheduleRepeat((time) => {
    let loop = session.activeTab;
    if (loop.currentStep === loop.nSteps-1) loop.currentStep = 0;
    else loop.currentStep++;

    if (loop.click.state) {
        if (loop.currentStep%16 === 0) metronome.click[0].start(time);
        else if (loop.currentStep%4 === 0) metronome.click[1].start(time);
    }
    //else metronome.click[1].start();
  
    for (let t in loop.tracks) {
      for (let n in loop.tracks[t].timeline[loop.currentStep]) {
        if (loop.tracks[t].timeline[loop.currentStep][n] !== null) loop.tracks[t].timeline[loop.currentStep][n].play();
      }
    }
}, "16n");

// ---------------------------------------------------------------
// PRESETS
// ---------------------------------------------------------------

const synthPresets = [
    {name: "BLOOM PAD 1",
    oscState: [true, true],
    osc: [[0,0.5,0.5],[0,0.5,0.5]],
    envState: [true, true],
    env: [[0,0.5,0.5,0],[0,0.5,0.5,0]],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: false,
    delay: [0,0,0],
    reverbState: false,
    reverb: [0,0]},
    
    {name: "BLOOM BASS 2",
    oscState: [true, false],
    osc: [[1,0,0.5],[0,0.5,0.5]],
    envState: [true, false],
    env: [[0,0.5,0.5,0],[0,0.5,0.5,0]],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: true,
    delay: [0.25,0.5,0.3],
    reverbState: false,
    reverb: [0,0]},
];

const acoustic = [kickAcoustic, snareAcoustic, closedHatAcoustic, openedHatAcoustic, highTomAcoustic, lowTomAcoustic, crashAcoustic];
const subtle = [kickSubtle, snareSubtle, closedHatSubtle, openedHatSubtle, highTomSubtle, lowTomSubtle, crashSubtle];

const drumPresets = [
    {name: "ACOUSTIC",
    kit: acoustic,
    partState: [true, true, true, true, true, true, true],
    partVol: [1,1,1,1,1,1,1],
    partPitch: [0.5,0.5,0.5,0.5,0.5,0.5,0.5],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: false,
    delay: [0,0,0],
    reverbState: false,
    reverb: [0,0]},

    {name: "ELECTRIC SUBTLE",
    kit: subtle,
    partState: [true, true, true, true, true, true, true],
    partVol: [1,1,1,1,1,1,1],
    partPitch: [0.5,0.5,0.5,0.5,0.5,0.5,0.5],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: false,
    delay: [0,0,0],
    reverbState: false,
    reverb: [0,0]},
];


// ---------------------------------------------------------------
// SYNTHS
// ---------------------------------------------------------------

class FxChain {
    constructor() {
        this.distortion = new Tone.Distortion({wet: 0.5});
        this.delay = new Tone.PingPongDelay();
        this.reverb = new Tone.Reverb({preDelay: 0});
        this.limiter = new Tone.Limiter(0);
        this.splitter = new Tone.Split();
        this.left = new Tone.Meter();
        this.right = new Tone.Meter();

        this.filter = new Tone.Filter().chain(this.distortion, this.delay, this.reverb, this.limiter, this.splitter);

        this.splitter.connect(this.left, 0, 0);
        this.splitter.connect(this.right, 1, 0);
        this.left.connect(new Tone.Panner(-1).toDestination());
        this.right.connect(new Tone.Panner(1).toDestination());
    }
}

class Synth {
    constructor() {
        this.oscillators = [new Tone.PolySynth(Tone.Synth), new Tone.PolySynth(Tone.Synth)];
        this.gain = new Tone.Gain();

        this.fxChain = new FxChain();

        this.oscillators[0].connect(this.gain);
        this.oscillators[1].connect(this.gain);
        this.gain.connect(this.fxChain.filter);
    }
}

class DrumSynth {
    constructor(kit) {

        this.parts = [];

        this.fxChain = new FxChain();
        this.gain = new Tone.Gain();

        for (let i = 0; i < 7; i++) {
            this.parts.push(new Tone.Player(kit[i]));
            this.parts[i].connect(this.gain);
        }

        this.gain.connect(this.fxChain.filter);
    }
}

const melody = new Synth();
const harmony = new Synth();
const bass = new Synth();
const drums = new DrumSynth(acoustic);

// ---------------------------------------------------------------
// EXPORT DEFAULT
// ---------------------------------------------------------------

const synths = { setSession, exportLoopAudio, synthPresets, drumPresets, melody, harmony, bass, drums };

export default synths;