import * as Tone from 'tone';
import kickAcoustic from '../Assets/audioSamples/kick_acoustic.wav';
import snareAcoustic from '../Assets/audioSamples/snare_acoustic.wav';
import closedHatAcoustic from '../Assets/audioSamples/closedHat_acoustic.wav';
import openedHatAcoustic from '../Assets/audioSamples/openedHat_acoustic.wav';
import lowTomAcoustic from '../Assets/audioSamples/lowTom_acoustic.wav';
import highTomAcoustic from '../Assets/audioSamples/highTom_acoustic.wav';
import crashAcoustic from '../Assets/audioSamples/crash_acoustic.wav';

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

let synths = { melodyOSC1, melodyOSC2, melodyFilter, melodyDist, melodyDly, melodyRev, melodyLeft, melodyRight, melodyGain,
               drumSynth, drumFilter, drumDist, drumDly, drumRev, drumMeter, drumVol};

export default synths;