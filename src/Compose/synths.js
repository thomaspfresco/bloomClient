import * as Tone from 'tone';

// ---------------------------------------------------------------
// MELODY
// ---------------------------------------------------------------

let melodyPatchOSC1 = {
    oscillator: {
        type: "square"
    },
    envelope: {
        attack: 1,
        decay: 0.2,
        sustain: 1,
        release: 0
    }
};

const melodyOSC1 = new Tone.PolySynth(Tone.Synth,8);
//const melodyNoise1 = new Tone.PolySynth();
const melodyOSC2 = new Tone.PolySynth(Tone.Synth,8);
//const melodyNoise2 = new Tone.PolySynth();

let melodyFilter = new Tone.Filter();
let melodyDist = new Tone.Distortion({
    distortion: 0.5,
    wet: 0
});
let melodyDly = new Tone.PingPongDelay({
    delayTime: "4n",
    wet: 0.2
});
let melodyRev = new Tone.Reverb({
    decay: 4,
    wet: 0
});
let melodyMeter = new Tone.Meter();

const melodyVol = new Tone.PanVol().chain(melodyFilter, melodyDist, melodyDly, melodyRev, melodyMeter, Tone.Destination);

melodyOSC1.connect(melodyVol);
//melodyNoise1.connect(melodyVol);
melodyOSC2.connect(melodyVol);
//melodyNoise2.connect(melodyVol);


/*let melody = new Tone.PolySynth(Tone.Synth).chain(melodyVol, melodyFilter, melodyDist, melodyDly, melodyRev,  melodyMeter, Tone.Destination);

let bass = new Tone.Synth();
let bassDist = new Tone.Distortion(0.5);
let bassDly = new Tone.FeedbackDelay("4n", 0.5);
let bassRev = new Tone.Reverb(0.5);

bass.connect(bassDist);
bassDist.connect(bassDly);
bassDly.connect(bassRev);
bassRev.toDestination();

let harmony = new Tone.Synth();
let harmonyDist = new Tone.Distortion(0.5);
let harmonyDly = new Tone.FeedbackDelay("4n", 0.5);
let harmonyRev = new Tone.Reverb(0.5);

harmony.connect(harmonyDist);
harmonyDist.connect(harmonyDly);
harmonyDly.connect(harmonyRev);
harmonyRev.toDestination();*/

let synths = { melodyPatchOSC1, melodyOSC1, melodyOSC2, melodyFilter, melodyDist, melodyDly, melodyRev, melodyMeter, melodyVol};

export default synths;