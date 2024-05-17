/* BASED ON

*/

import * as Tone from 'tone';
import audioBufferToWav from 'audiobuffer-to-wav';

import theory from './theory.js';

import kickAcoustic from '../Assets/audioSamples/kick_acoustic.wav';
import snareAcoustic from '../Assets/audioSamples/snare_acoustic.wav';
import closedHatAcoustic from '../Assets/audioSamples/closedHat_acoustic.wav';
import openedHatAcoustic from '../Assets/audioSamples/openedHat_acoustic.wav';
import lowTomAcoustic from '../Assets/audioSamples/lowTom_acoustic.wav';
import highTomAcoustic from '../Assets/audioSamples/highTom_acoustic.wav';
import crashAcoustic from '../Assets/audioSamples/crash_acoustic.wav';

// ---------------------------------------------------------------

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
                    s[n].start(Tone.context.currentTime);
                    if (n === 2) s[3].stop();
                }
            } else {
                if (vel !== 0) {
                    s[0].triggerAttack(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                    s[1].triggerAttack(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                }
                else { 
                    s[0].triggerRelease(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                    s[1].triggerRelease(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
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
    /*Tone.Offline(({ transport }) => {
        let step = 0;

    transport.scheduleRepeat(time => {
        if (step === 0) {
            //melodyLeft.disconnect(Tone.Destination);
            //melodyRight.disconnect(Tone.Destination);
            //renderer.start();
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
          transport.stop();
          console.log("ai")
        }

        step++;

        }, loop.timeBtwSteps);

        transport.start();
        
        }, loop.timeBtwSteps*(nSteps+nSteps/8)).then((buffer) => {*/
        Tone.Offline(() => {
            // only nodes created in this callback will be recorded
            const oscillator = new Tone.Oscillator().toDestination().start(0);
        }, 60).then((buffer) => {

        setLoading(false);

        const blob = new Blob([audioBufferToWav(buffer)], { type: "audio/wav" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.getElementById("export");
        anchor.download = loop.name+".wav";
        anchor.href = url;
        anchor.click();
    });
}

// ---------------------------------------------------------------
// MELODY
// ---------------------------------------------------------------

const melodyOSC1 = new Tone.PolySynth(Tone.Synth);
const melodyOSC2 = new Tone.PolySynth(Tone.Synth);

const melodyFilter = new Tone.EQ3();
const melodyDist = new Tone.Distortion();
const melodyDly = new Tone.PingPongDelay();
const melodyRev = new Tone.Reverb();
const melodySplitter = new Tone.Split();
const melodyLeft = new Tone.Meter();
const melodyRight = new Tone.Meter();

const melodyGain = new Tone.Gain().chain(melodyFilter, melodyDist, melodyDly, melodyRev, melodySplitter);

melodyOSC1.connect(melodyGain);
melodyOSC2.connect(melodyGain);
melodySplitter.connect(melodyLeft, 0, 0);
melodySplitter.connect(melodyRight, 1, 0);
melodyLeft.connect(new Tone.Panner(-1).connect(Tone.Destination));
melodyRight.connect(new Tone.Panner(1).connect(Tone.Destination));

// ---------------------------------------------------------------
// DRUMS
// ---------------------------------------------------------------

const acoustic = [kickAcoustic, snareAcoustic, closedHatAcoustic, openedHatAcoustic, highTomAcoustic, lowTomAcoustic, crashAcoustic];
const kit = acoustic;

let drumFilter = new Tone.Filter();
let drumDist = new Tone.Distortion({
    distortion: 0.5,
    wet: 0
});
let drumDly = new Tone.PingPongDelay({
    delayTime: "4n",
    wet: 0.2
});
let drumRev = new Tone.Reverb({
    decay: 4,
    wet: 0
});
let drumMeter = new Tone.Meter();

const drumVol = new Tone.PanVol().chain(drumFilter, drumDist, drumDly, drumRev, drumMeter, Tone.Destination);

const drumSynth = [];
for (let i = 0; i < 7; i++) {
    drumSynth.push(new Tone.Player(kit[i]));
    drumSynth[i].connect(Tone.Destination);
}

// ---------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------

let synths = { setSession, exportLoopAudio, melodyOSC1, melodyOSC2, melodyFilter, melodyDist, melodyDly, melodyRev, melodyLeft, melodyRight, melodyGain,
               drumSynth, drumFilter, drumDist, drumDly, drumRev, drumMeter, drumVol};

export default synths;