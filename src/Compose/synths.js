import * as Tone from 'tone';

// ---------------------------------------------------------------
// MELODY
// ---------------------------------------------------------------

let melodyDist = new Tone.Distortion({
    distortion: 0.5,
    wet: 0
});

let melodyDly = new Tone.PingPongDelay({
    delayTime: "4n",
    feedback: 0.5,
    wet: 0.1
});

let melodyRev = new Tone.Reverb({
    decay: 5,
    wet: 0.7,
}).toDestination();

let melodyVol = new Tone.Volume({
    volume: -6
});

let melodyFilter = new Tone.Filter({
    frequency: 0, 
    type: "highpass",
});

let melodyMeter = new Tone.Meter();

let melody = new Tone.PolySynth(Tone.Synth).chain(melodyVol, melodyFilter, melodyDist, melodyDly, melodyRev,  melodyMeter, Tone.Destination);

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
harmonyRev.toDestination();

let synths = { melody, melodyDist, melodyDly, melodyRev, melodyVol, melodyFilter, melodyMeter};

export default synths;