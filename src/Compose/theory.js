//frequency at octave 0 (0 to 8)
const freqs = [16.35,17.32,18.35,19.45,20.6,21.83,23.12,24.5,25.96,27.5,29.14,30.87,32.70];

const noteLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const drumLabels = ["KICK", "SNARE", "CLOSED HAT", "OPEN HAT", "HIGH TOM", "LOW TOM", "CRASH"];

//const waveTypes = ["sine", "triangle", "square", "sawtooth", "white", "pink", "brown"];
const waveTypes = ["sine", "triangle", "square", "sawtooth"];

const delayTimes = ["1/64","1/32","1/16","1/8","1/4","1/2","1","2"];

const timeValues = [];
let timeAux = 0;
//timeValues.push(timeAux);

while (Math.round(timeAux * 100) / 100 < 0.1) {
    timeAux += 0.01;
    timeValues.push(Math.round(timeAux * 100) / 100);
}

while (Math.round(timeAux * 10) / 10 < 1) {
    timeAux += 0.1;
    timeValues.push(Math.round(timeAux * 10) / 10);
}

while (timeAux < 2) {
    timeAux += 0.25;
    timeValues.push(timeAux);
}

while (timeAux < 3) {
    timeAux += 0.25;
    timeValues.push(timeAux);
}

timeValues.push(4);
timeValues.push(5);
timeValues.push(10);

const pitchValues = [];
let pitchAux = -12;

while (pitchAux <= 12) {
    pitchValues.push(pitchAux);
    pitchAux += 0.25;
}

const defaultValues = [];
let defaultAux = 0;
while (defaultAux <= 1) {
    defaultValues.push(Math.round(defaultAux * 100) / 100);
    defaultAux += 0.01;
}
defaultValues.push(1);

function keysDecode(c) {
    switch (c) {
        case "A": return 0;
        case "W": return 1;
        case "S": return 2;
        case "E": return 3;
        case "D": return 4;
        case "F": return 5;
        case "T": return 6;
        case "G": return 7;
        case "Y": return 8;
        case "H": return 9;
        case "U": return 10;
        case "J": return 11;
        case "K": return 12;
        default: return -1;
    }
}

let theory = { freqs, noteLabels, drumLabels, keysDecode, waveTypes, delayTimes, timeValues, pitchValues, defaultValues};

export default theory;