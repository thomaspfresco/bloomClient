//frequency at octave 0 (0 to 8)
const freqs = [16.35,17.32,18.35,19.45,20.6,21.83,23.12,24.5,25.96,27.5,29.14,30.87,32.70];

const noteLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const drumLabels = ["KICK", "SNARE", "CLOSED HAT", "OPEN HAT", "HIGH TOM", "LOW TOM", "CRASH"];

function keysToFreq(c) {
    switch (c) {
        case "A":
            return freqs[0];
        case "W":
            return freqs[1];
        case "S":
            return freqs[2];
        case "E":
            return freqs[3];
        case "D":
            return freqs[4];
        case "F":
            return freqs[5];
        case "T":
            return freqs[6];
        case "G":
            return freqs[7];
        case "Y":
            return freqs[8];
        case "H":
            return freqs[9];
        case "U":
            return freqs[10];
        case "J":
            return freqs[11];
        case "K":
            return freqs[12];
        default:
            return -1;
    }
}

let musicTheory = { freqs, noteLabels, drumLabels, keysToFreq };

export default musicTheory;