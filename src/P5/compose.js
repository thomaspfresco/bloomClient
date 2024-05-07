/* BASED ON:
Tom Holloway. "Flow Fields and Noise Algorithms with P5.js". 2020.
https://dev.to/nyxtom/flow-fields-and-noise-algorithms-with-p5-js-5g67
(acedido em 12/11/2023)
*/

import obliqueStratagies from "../obliqueStratagies.js";

import disketFont from '../Fonts/Disket-Mono-Regular.ttf';
import poppinsLightFont from '../Fonts/Poppins-Light.ttf';
import poppinsMediumFont from '../Fonts/Poppins-Medium.ttf';
import poppinsBoldFont from '../Fonts/Poppins-Bold.ttf';
import plusSVG from '../Assets/plus.svg';
import arrowSVG from '../Assets/arrow.svg';
import * as Tone from 'tone';
import p5 from 'p5';

let font1, fontLight, fontMedium, fontBold;
let plus, arrow;

const synth = new Tone.Synth().toDestination();

let phase = 0;
let zoff = 0;
let noiseMax = 1;

var particles = new Array(50);
var totalFrames = 300;
let counter = 0;

let previewOpa = 0;
let drawerOpa = 0;
let previewDelay = 350;
let previewInstant = 0;

let maxWeightLines = 2;
let maxBars = 16;
let maxSteps = 4 * maxBars;

let marginX;
let iconSize;
let iconCorners;

const instruments = ["record", "melody", "harmony", "drums", "bass"];

let session;

// --------------------------------------------------------------------------------------

let loopSearch = '';
let structSearch = '';
let maxNameLength = 15;

document.addEventListener('DOMContentLoaded', function() {
  // Variable to store typing status

  // Event listener for keydown event
  document.addEventListener('keydown', function(event) {
      const keyCode = event.keyCode;
      // Check if the pressed key is alphanumeric or space
      if ((keyCode >= 48 && keyCode <= 57) ||     // 0-9
          (keyCode >= 65 && keyCode <= 90) ||     // A-Z
          keyCode === 32) {                       // Space
          if (session.loopDrawer) {
            if (loopSearch.length < maxNameLength) {
              loopSearch += event.key;
              console.log(loopSearch);
            }
          }
      }
  });

});


// --------------------------------------------------------------------------------------

const sketch = (saveSession, sesh) => (p) => {

  //PARTICLES--------------------------------------------------------------------------------------

  function noiseLoop(diameter, min, max, rnd) {
    let cx = p.random(rnd || 1000);
    let cy = p.random(rnd || 1000);
    return function (angle) {
      let xoff = p.map(p.cos(angle), -1, 1, cx, cx + diameter);
      let yoff = p.map(p.sin(angle), -1, 1, cy, cy + diameter);
      let zoff = p.sin(angle) * 0.0001;
      let r = p.noise(xoff, yoff, zoff);
      return p.map(r, 0, 1, min, max);
    };
  }

  function drawParticles() {
    let percent = (counter % totalFrames) / totalFrames;
    let a = percent * p.TWO_PI;
    for (let i = 0; i < particles.length; i++) {
      particles[i].render(a);
    }
    counter++;
  }

  class Particle {

    constructor() {
      this.xn = noiseLoop(0.05, -p.windowWidth, p.windowWidth * 2);
      this.yn = noiseLoop(0.05, -p.windowHeight, p.windowHeight * 2);
      this.rn = noiseLoop(0.5, 0, 255);
      this.gn = noiseLoop(0.5, 0, 255);
      this.bn = noiseLoop(0.5, 0, 255);
      this.dn = noiseLoop(0.5, 1, 10);
      this.an = noiseLoop(1, 5, 200);
    }

    render(a) {
      p.noStroke();
      p.fill(this.rn(a), this.gn(a), this.bn(a), this.an(a) * 0.75);
      p.circle(this.xn(a), this.yn(a), this.dn(a) / 2);
    }
  }

  function initLoadedSesh() {
    session = new Session();
    for (let i = 0; i < sesh.loops.length; i++) {
      let loop = new Loop(sesh.loops[i].id, sesh.loops[i].name, sesh.loops[i].nBars, sesh.loops[i].tempo);
      for (let j = 0; j < sesh.loops[i].tracks.length; j++) {
        let track = new Track(sesh.loops[i].tracks[j].id, sesh.loops[i].id, sesh.loops[i].tracks[j].name, sesh.loops[i].tempo, sesh.loops[i].nSteps, sesh.loops[i].tracks[j].iconTargetX);
        for (let k = 0; k < sesh.loops[i].tracks[j].timeline.length; k++) {
          for (let l = 0; l < sesh.loops[i].tracks[j].timeline[k].length; l++) {
            let note = new Note(sesh.loops[i].tracks[j].timeline[k][l].name, sesh.loops[i].id, sesh.loops[i].tracks[j].id, k, sesh.loops[i].tracks[j].timeline[k][l].duration, sesh.loops[i].tracks[j].color);
            track.timeline[k].push(note);
          }
        }
        loop.tracks.push(track);
      }
      session.loops.push(loop);
    }
  }

  //================================================================================================

  class Session {

    constructor() {
      this.loops = [];
      this.structs = [];
      this.tabs = [];

      this.maxTabs = 4;
      this.tabsY = p.windowHeight / 30;
      this.activeTab = null;
      this.bloomX = p.windowWidth / 2;
      this.bloomTargetX = p.windowWidth / 2;
      this.tabsX = [];
      this.tabsTargetX = [];

      for (let i = 0; i < this.maxTabs; i++) {
        this.tabsX.push(p.windowWidth / 2);
        this.tabsTargetX.push(p.windowWidth / 2);
      }

      this.drawerInstant = 0;
      this.drawerInterval = 50;

      this.suggestionInstant = 0;
      this.suggestionIndex = p.floor(p.random(0, obliqueStratagies.length));

      this.loopDrawer = false;
      this.structDrawer = false;

      this.drawersDark = 0;
      this.drawersDarkMax = 225;
      this.drawersDarkInc = 10;

      this.loopsOffset = p.windowHeight / 25;
      this.structsOffset = p.windowHeight / 25;
      this.drawersOffsetInc = p.windowWidth / 500;
      this.loopsOpa = 0;
      this.structsOpa = 0;
      this.drawersOpaInc = 15;
      this.drawersOpaMax = 255;
    }

    draw() {
      this.drawersOffsetInc = p.windowWidth / 500;

      //draw sugestions oblique stratagies
      if (this.activeTab === null) {
        this.showSuggestions();
      }
      else this.activeTab.draw();

      //Tabs
      this.drawTabs();

      //dark effect drawers
      p.noStroke();
      p.fill(0, 0, 0, this.drawersDark);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      //loop drawer
      p.textAlign(p.LEFT, p.TOP);
      p.fill(255, 255, 255, this.loopsOpa);
      p.text("LOOPS", p.windowHeight / 30 - this.loopsOffset, p.windowHeight / 30);

      //loop plus
      if (p.mouseX > p.windowHeight/30 && p.mouseX < p.windowHeight/30+p.windowHeight/30 && p.mouseY > p.windowHeight-p.windowHeight/30-p.windowHeight/30 && p.mouseY < p.windowHeight-p.windowHeight/30) {
        p.tint(255, this.loopsOpa);
        document.body.style.cursor = 'pointer';

        //create loop
        if (p.mouseIsPressed) {
          let name = "myloop"+(this.loops.length+1);
          this.loops.push(new Loop(this.loops.length, name, 4, 120));
          this.manageTabs(this.loops[this.loops.length-1]);
          p.mouseIsPressed = false;
        }
      }
      else p.tint(255, this.loopsOpa/3);
      p.image(plus, p.windowHeight/30+p.windowHeight/30/2 - this.loopsOffset, p.windowHeight-p.windowHeight/30-p.windowHeight/30/2, p.windowHeight / 30, p.windowHeight / 30);

      //struct drawer
      p.textAlign(p.RIGHT, p.TOP);
      p.fill(255, 255, 255, this.structsOpa);
      p.text("STRUCTS", p.windowWidth - p.windowHeight / 30 + this.structsOffset, p.windowHeight / 30);

      //drawers trigger
      if (this.loopDrawer === false && this.structDrawer === false) {
        if (p.mouseX < p.windowWidth / 50) {
          if (this.loopDrawer === false) {
            this.drawerInstant = p.millis();
            loopSearch = "";
            //reset loops position on drawer
            for (let i = 0; i < this.loops.length; i++) {
              for (let j = 0; j < this.loops[i].tracks.length; j++) {
                  this.loops[i].tracks[j].particlesDrawerX.fill(-p.windowWidth/5);
                  //this.loops[i].tracks[j].particlesPreviewX = this.loops[i].tracks[j].targetXpreview.concat();
                  //this.loops[i].tracks[j].particlesPreviewY = this.loops[i].tracks[j].targetYpreview.concat();
              }
            }
          }
          previewOpa = 0;
          drawerOpa = 0;
          previewInstant = p.millis();
          this.loopDrawer = true;
        }
        else if (p.mouseX > p.windowWidth - p.windowWidth / 50) this.structDrawer = true;
        if (this.drawersDark - this.drawersDarkInc < 0) this.drawersDark = 0;
        else this.drawersDark -= this.drawersDarkInc;
      } else if (this.loopDrawer || this.structDrawer) {
        if (this.drawersDark + this.drawersDarkInc > this.drawersDarkMax) this.drawersDark = this.drawersDarkMax;
        else this.drawersDark += this.drawersDarkInc;
      }

      //drawers detrigger
      if (p.mouseX > p.windowWidth / 5) this.loopDrawer = false;
      if (p.mouseX < p.windowWidth - p.windowWidth / 5) this.structDrawer = false;

      //loop drawer
      if (this.loopDrawer) {
        if (this.loopsOffset - this.drawersOffsetInc < 0) this.loopsOffset = 0;
        else this.loopsOffset -= this.drawersOffsetInc;
        if (this.loopsOpa + this.drawersOpaInc > this.drawersOpaMax) this.loopsOpa = this.drawersOpaMax;
        else this.loopsOpa += this.drawersOpaInc;

        p.fill(255, 0, 0);
        p.textAlign(p.RIGHT, p.TOP);
        if (loopSearch === "") p.text("Type something...", p.windowWidth - p.windowHeight / 30, p.windowHeight / 30);
        else p.text(loopSearch, p.windowWidth - p.windowHeight / 30, p.windowHeight / 30);

        //draw colapsed loops
        if (this.loops.length === 0) {
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(p.windowHeight / 50);
          p.fill(255, 255, 255, this.loopsOpa/3);
          p.text('Click "+" to create Loop', p.windowHeight / 30 - this.loopsOffset, p.windowHeight / 2);
        }
        else {

          if (this.loops.length === 1) this.loops[0].drawInDrawer(p.windowHeight / 30 + p.windowHeight/30, p.windowHeight / 2,p.windowHeight/30);
          else {
            
            let dist = 0;
            let loopSize = 0;

            if (this.loops.length < 8) {
              dist = p.windowHeight/1.3/(8-1);
              loopSize = p.windowHeight/35;
            }
            else {
              dist = p.windowHeight/(1.4-0.004*this.loops.length)/(this.loops.length-1);
              loopSize = dist/4;
            }

            let totalDist = dist*(this.loops.length-1);

            for (let i = 0; i < this.loops.length; i++) {
              
              let aux = p.abs(p.windowHeight / 2 - totalDist/2 + dist * i - p.mouseY);
              if (aux > (dist * 2)) aux = dist * 2;
              let mouseOffsetX = p.map(aux, dist * 2, 0, 0, loopSize*3);
              let sizeOffset = p.map(aux, dist * 2, 0, 0, loopSize/3);
              if (mouseOffsetX < 0 
                || p.mouseY < p.windowHeight / 2 - totalDist/2 - dist/2
                || p.mouseY > p.windowHeight / 2 + totalDist/2 + dist/2) {
                  mouseOffsetX = 0;
                  sizeOffset = 0;
              }
              if (this.drawerInterval/(this.loops.length/10) * i < (p.millis() - this.drawerInstant)) {
                this.loops[i].drawInDrawer(mouseOffsetX + p.windowHeight / 30 + loopSize, p.windowHeight / 2 - totalDist / 2 + dist*i, loopSize+sizeOffset);
              }

              //text info and preview
              if (p.mouseY > p.windowHeight / 2 - totalDist/2 + dist * i - dist / 2 && p.mouseY < p.windowHeight / 2 - totalDist/2 + dist * i + dist / 2) {
                
                if (this.loops[i].hover === false) {
                  this.loops[i].hover = true;
                  drawerOpa = 0;
                  previewOpa = 0;
                  previewInstant = p.millis();
                }
                
                if (drawerOpa + this.drawersDarkInc > 255) drawerOpa = 255;
                else drawerOpa += this.drawersDarkInc;

                if (p.millis() - previewInstant > previewDelay) {
                  if (previewOpa + this.drawersDarkInc/2 > 255) previewOpa = 255;
                  else previewOpa += this.drawersDarkInc/2;
                }

                document.body.style.cursor = 'pointer';
                p.noStroke();
                p.fill(255, 255, 255, drawerOpa);
                p.textSize(p.windowHeight / 35);
                p.textAlign(p.LEFT, p.CENTER);
                p.textFont(fontMedium);
                p.text(this.loops[i].name, +mouseOffsetX + p.windowHeight / 30 + loopSize*4, p.windowHeight / 2 - totalDist/2 + dist * i-p.windowHeight / 60);
                p.fill(255, 255, 255,drawerOpa/2);
                p.textSize(p.windowHeight / 50);
                p.textFont(fontLight);
                p.text(this.loops[i].tempo+" BPM, "+this.loops[i].key, +mouseOffsetX + p.windowHeight / 30 + loopSize*4, p.windowHeight / 2 - totalDist/2 + dist * i+p.windowHeight /60);
                
                this.loops[i].drawPreview();

                if (p.mouseIsPressed) {
                  this.manageTabs(this.loops[i]);
                  this.activeTab.active = true;
                  
                  //reset loops position
                  for (let j = 0; j < this.loops[i].tracks.length; j++) {
                    this.loops[i].tracks[j].particlesX = this.loops[i].tracks[j].targetXpreview.concat();
                    this.loops[i].tracks[j].particlesY = this.loops[i].tracks[j].targetYpreview.concat();
                  }

                  //change mouse position to avoid imediate retriggering
                  p.mouseX = p.windowWidth / 2;
                  p.mouseIsPressed = false;
                }
              }
              else this.loops[i].hover = false;
            }
          }
      }
      
      } else {
        if (this.loopsOffset + this.drawersOffsetInc > p.windowHeight / 25) this.loopsOffset = p.windowHeight / 25;
        else this.loopsOffset += this.drawersOffsetInc;
        if (this.loopsOpa - this.drawersOpaInc < 0) this.loopsOpa = 0;
        else this.loopsOpa -= this.drawersOpaInc;
      }
      //struct drawer
      if (this.structDrawer) {
        if (this.structsOffset - this.drawersOffsetInc < 0) this.structsOffset = 0;
        else this.structsOffset -= this.drawersOffsetInc;
        if (this.structsOpa + this.drawersOpaInc > this.drawersOpaMax) this.structsOpa = this.drawersOpaMax;
        else this.structsOpa += this.drawersOpaInc;

        //draw simplified/colapsed loops
        if (this.structs.length === 0) {
          p.textAlign(p.RIGHT, p.CENTER);
          p.textSize(p.windowHeight / 50);
          p.fill(255, 255, 255, this.structsOpa/3);
          p.text('Click "+" to create Struct', p.windowWidth-p.windowHeight / 30 + this.structsOffset, p.windowHeight / 2);
        }
        else {}

      } else {
        if (this.structsOffset + this.drawersOffsetInc > p.windowHeight / 25) this.structsOffset = p.windowHeight / 25;
        else this.structsOffset += this.drawersOffsetInc;
        if (this.structsOpa - this.drawersOpaInc < 0) this.structsOpa = 0;
        else this.structsOpa -= this.drawersOpaInc;
      }
    }

    //manage tabs
    manageTabs(loop) {
      //tabs list is not full and loop is not in tabs
      if (this.tabs.length < this.maxTabs && !this.tabs.includes(loop)) {
        this.tabs.push(loop);
        this.activeTab = loop;
        //console.log(this.tabsX, this.tabsTargetX);
        //this.tabsX[this.tabs.length - 1] = this.tabsTargetX[this.tabs.length - 1];
        //console.log(this.tabsX, this.tabsTargetX);
      }
         
      //tabs include loop
      else if (this.tabs.includes(loop)) {
        this.activeTab = loop;
      }

      //tabs full and loop is not in tabs
      else if (this.tabs.length === this.maxTabs && !this.tabs.includes(loop)) {
        this.tabs.shift();
        this.tabs.push(loop);
        this.activeTab = loop;
        //this.tabsTargetX.push(this.tabsTargetX[this.tabsTargetX.length-1]);
        //this.tabsTargetX.shift();
      }

      this.loopDrawer = false;
      this.structDrawer = false;
    }

    drawTabs() {
      p.noStroke();
      p.textSize(p.windowHeight / 40);
      p.textAlign(p.CENTER, p.TOP);
      p.textFont(fontMedium);

      let totalDist = 0;
      let auxDist = 0;

      if (this.tabs.length === 0) this.bloomTargetX = p.windowWidth/2;
      else {

        totalDist += p.textWidth("BLOOM")/2+p.windowWidth/30+p.textWidth(this.tabs[0].name)/2;
        for (let i = 1; i < this.tabs.length; i++) totalDist += p.textWidth(this.tabs[i-1].name)/2+p.windowWidth/30+p.textWidth(this.tabs[i].name)/2;
        this.bloomTargetX = p.windowWidth / 2 - totalDist / 2;
        auxDist += p.textWidth("BLOOM")/2+p.windowWidth/30+p.textWidth(this.tabs[0].name)/2;
        this.tabsTargetX[0] = p.windowWidth / 2 - totalDist / 2+auxDist;

        for (let i = 1; i < this.tabs.length; i++) {
          auxDist += p.textWidth(this.tabs[i-1].name)/2+p.windowWidth/30+p.textWidth(this.tabs[i].name)/2;
          this.tabsTargetX[i] = p.windowWidth / 2 - totalDist / 2+auxDist;
        }
      }

      let dif = this.bloomTargetX - this.bloomX;
      this.bloomX += dif / 10;

      p.fill(255, 255, 255, 255/4);
      p.textFont(fontLight);
      if (this.activeTab === null) {
        p.fill(255, 255, 255);
        p.textFont(fontMedium);
      }
      else if (p.mouseX > p.windowWidth/2-totalDist/2-p.textWidth("BLOOM")/2 && p.mouseX < p.windowWidth/2-totalDist/2+p.textWidth("BLOOM")/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2) {
        p.fill(255, 255, 255);
        p.textFont(fontLight);
        document.body.style.cursor = 'pointer';

        if (p.mouseIsPressed) {
          this.activeTab = null;
          p.mouseIsPressed = false;
        }
      }
      p.text("BLOOM", this.bloomX, p.windowHeight / 30);

      for (let i = 0; i < this.tabs.length; i++) {
        if (this.activeTab === this.tabs[i]) {
          p.fill(255, 255, 255);
          p.textFont(fontMedium);
        }
        else if (p.mouseX > this.tabsTargetX[i]-p.textWidth(this.tabs[i].name)/2 && p.mouseX < this.tabsTargetX[i]+p.textWidth(this.tabs[i].name)/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2) {
          p.fill(255, 255, 255);
          p.textFont(fontLight);
          document.body.style.cursor = 'pointer';
          if (p.mouseIsPressed) {
            this.activeTab = this.tabs[i];
            this.activeTab.active = false;
            p.mouseIsPressed = false;
          }
        }
        else {
          p.fill(255, 255, 255, 255/4);
          p.textFont(fontLight);
        }
        dif = this.tabsTargetX[i] - this.tabsX[i];
        this.tabsX[i] += dif / 10;
        p.text(this.tabs[i].name, this.tabsX[i], p.windowHeight / 30);
      }
    }

    //draw sugestions
    showSuggestions() {
      if (p.millis() - this.suggestionInstant > 5000) {
        this.suggestionInstant = p.millis();
        this.suggestionIndex = p.floor(p.random(0, obliqueStratagies.length));
      }
       
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.fill(255, 255, 255,255/2);
      p.textSize(p.windowHeight / 30);
      p.text(obliqueStratagies[this.suggestionIndex], p.windowWidth / 2, p.windowHeight / 2);

      //p.text("LOOP: "+loopSearch, p.windowWidth/2, p.windowHeight/30+p.windowHeight/30);
    }
  }

  class Structure {

    constructor(id, tempo, key) {
      this.id = id;
      this.loops = [];
      this.repeats = [];
      this.tempo = tempo;
      this.key = key;
    }
  }

  class Loop {

    constructor(id, name, nBars, tempo) {
      this.id = id;
      this.name = name;
      this.tracks = [];
      this.key = "C major";
      this.nBars = nBars;
      this.nSteps = 4 * nBars;

      this.play = false;
      this.active = false;

      this.tempo = tempo;
      this.timeBtwSteps = 60 / tempo / 4;
      this.lastInstant = 0;
      this.currentStep = 0;

      this.blackoutOpa = 0;

      this.hover = false;

      this.lastInstPlusMenu = 0;
      this.opaPlus = 0;
      this.opaPlusInc = 5;
      this.opaPlusMax = 50;

      this.plusX = p.windowWidth / 2 - iconSize / 2;
      this.plusY = p.windowHeight - iconSize / 2 - iconSize;
      this.plusTargetX = p.windowWidth / 2 - iconSize / 2;

      this.x = 0;
      this.y = 0;

      this.menu = new Menu(this.plusX, this.plusY, instruments);
    }

    updateIconsPos() {
      if (this.tracks.length === 0) {
        this.plusTargetX = p.windowWidth / 2 - iconSize / 2;
        this.menu.x = this.plusX;
      }
      else {
        let w = (this.tracks.length - 1) * (iconSize / 4) + iconSize * (this.tracks.length);
        let anchorRight = p.windowWidth / 2 + w / 2;

        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].iconTargetX = anchorRight - w + i * (iconSize + iconSize / 4);
          this.tracks[i].iconY = p.windowHeight - iconSize / 2 - iconSize;
        }

        this.plusTargetX = anchorRight + iconSize / 4;
        this.menu.x = this.plusX;
      }

      this.plusY = p.windowHeight - iconSize / 2 - iconSize;
      this.menu.y = this.plusY - this.menu.optionH * 1.5;
    }

    addTrack(name) {

      let w = this.tracks.length * (iconSize / 4) + iconSize * (this.tracks.length + 1);
      let anchorRight = p.windowWidth / 2 + w / 2;

      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].iconTargetX = anchorRight - w + i * (iconSize + iconSize / 4);
      }
      this.tracks.push(new Track(this.tracks.length, this.id, name, this.tempo, this.nSteps, anchorRight - iconSize));
      this.plusTargetX = anchorRight + iconSize / 4;
      this.menu.x = this.plusTargetX;
      //}

      //CODIGO PROVISORIO
      for (let i = 0; i < 5; i++) {
        let start = p.round(p.random(0, this.nSteps));
        //let duration = p.random(1,4);
        let duration = 1;
        this.tracks[this.tracks.length - 1].timeline[start].push(new Note("C1", this.loopId, this.tracks.length - 1, start, duration, this.tracks[this.tracks.length - 1].color));
      }
      saveSession(session);
    }

    updateMetronome() {
      if (p.millis() - this.lastInstant >= this.timeBtwSteps * 1000) {
        //console.log(this.currentStep);
        this.currentStep++;
        this.lastInstant = p.millis();
        if (this.currentStep === this.nSteps) this.currentStep = 0;

        for (let t in this.tracks) {
          for (let n in this.tracks[t].timeline[this.currentStep]) {
            this.tracks[t].timeline[this.currentStep][n].play();
          }
        }
      }
    }

    draw() {
      //draw track lines
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawLine();
      }

      //draw notes over all track lines
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawNotes();
      }

        //update metronome
        if (this.play) this.updateMetronome();

        this.updateIconsPos();

        //update plus button position
        let dif = this.plusTargetX - this.plusX;
        this.plusX += dif / 10;

        //cursor
        if (this.play) {
          p.stroke(255, 255, 255);
          p.strokeWeight(1);
          //p.rect(marginX+this.currentStep*(p.windowWidth-marginX*2)/this.nSteps,0,(p.windowWidth-marginX*2)/this.nSteps,p.windowHeight);
          p.line(marginX + this.currentStep * (p.windowWidth - marginX * 2) / this.nSteps, 0, marginX + this.currentStep * (p.windowWidth - marginX * 2) / this.nSteps, p.windowHeight);
        }

        //hover plus button
        if (p.mouseX > this.plusX && p.mouseX < this.plusX + iconSize && p.mouseY > this.plusY && p.mouseY < this.plusY + iconSize) {
          if (this.opaPlus + this.opaPlusInc > this.opaPlusMax) this.opaPlus = this.opaPlusMax;
          else this.opaPlus += this.opaPlusInc;

          if (p.mouseIsPressed) {
            //synth.triggerAttackRelease("C4", "8n");
            if (this.menu.state === -1) this.menu.state = 0;
            else if (this.menu.state === 0) {
              this.menu.reset();
            }
            //this.addTrack(this.tracks.length,"random");
            p.mouseIsPressed = false;
            //myFunction();
          }
        }
        else {
          if (this.opaPlus - this.opaPlusInc < 0) this.opaPlus = 0;
          else this.opaPlus -= this.opaPlusInc;
        }

        this.menu.draw();

        //plus button
        p.fill(255, 255, 255, this.opaPlus);
        p.stroke(255);
        p.strokeWeight(1);
        p.rect(this.plusX, this.plusY, iconSize, iconSize, iconCorners);
        p.image(plus, this.plusX + iconSize / 2, p.windowHeight - iconSize, p.windowHeight / 50, p.windowHeight / 50);

        //blackout animation
        if (this === session.activeTab) {
          if (this.active === false) this.blackoutOpa = 255;
          this.active = true;
        }

        if (this.active) {
          if (this.blackoutOpa - this.opaPlusInc > 0) this.blackoutOpa -= this.opaPlusInc;
          else this.blackoutOpa = 0;
        }

        p.noStroke();
        p.fill(0, 0, 0, this.blackoutOpa);
        p.rect(0, 0, p.windowWidth, p.windowHeight);
    }

    //draw simplified representation of loop in drawer
    drawInDrawer(x, y, radius) {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawInDrawer(x, y, radius);
      }
    }

    drawPreview() {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawPreview();
      }
    }
  }

  class Track {

    constructor(id, loopId, name, tempo, nSteps, iconTargetX) {
      this.id = id;
      this.name = name;

      this.loopId = loopId;

      this.timeline = [];

      this.color = [p.random(0, 255), p.random(0, 255), p.random(0, 255)];

      this.tempo = tempo;
      this.nSteps = nSteps;

      this.radiusCol = p.windowHeight / 4;

      this.opaLine = 0;
      this.opaLineInc = 5;
      this.opaLineMax = 255;

      this.iconTargetX = iconTargetX;
      this.iconX = iconTargetX;
      this.iconY = p.windowHeight - iconSize / 2 - iconSize;
      this.opaIcon = 0;
      this.opaIconInc = 5;
      this.opaIconMax = 255;

      this.x = p.windowWidth / 2 + p.windowWidth/8;
      this.y = p.windowHeight / 2;

      this.particlesX = [];
      this.particlesY = [];
      this.particlesDrawerX = [];
      this.particlesDrawerY = [];
      this.particlesPreviewX = [];
      this.particlesPreviewY = [];

      this.targetXexp = [];
      this.targetYexp = [];
      this.targetXcol = [];
      this.targetYcol = [];
      this.targetXdrawer = [];
      this.targetYdrawer = [];
      this.targetXpreview = [];
      this.targetYpreview = [];

      for (let i = 0; i < this.nSteps + 3; i++) {
        this.particlesX.push(p.windowWidth / 2);
        this.particlesY.push(p.windowHeight / 2);
        this.particlesDrawerX.push(-p.windowWidth/5);
        this.particlesDrawerY.push(p.windowHeight / 2);
        this.particlesPreviewX.push(this.x);
        this.particlesPreviewY.push(p.windowHeight / 2);
        this.targetXexp.push(0);
        this.targetYexp.push(0);
        this.targetXcol.push(0);
        this.targetYcol.push(0);
        this.targetXdrawer.push(0);
        this.targetYdrawer.push(0);
        this.targetXpreview.push(0);
        this.targetYpreview.push(0);
        if (i < this.nSteps) this.timeline.push([]);
      }

      //console.log(this.timeline[0]);
    }

    drawPreview() {

      this.x = p.windowWidth / 2 + p.windowWidth/8;
      this.y = p.windowHeight / 2;
      this.radiusCol = p.windowHeight / 4;

      p.noFill();
      p.stroke(255, 255, 255,previewOpa);
      p.strokeWeight(maxWeightLines / (this.id + 1));

      p.beginShape();
      for (let i = 0; i < this.particlesPreviewX.length; i++) p.vertex(this.particlesPreviewX[i], this.particlesPreviewY[i]);
      p.endShape();

      let angle = -p.PI / 2;

      for (let i = 0; i < this.targetXpreview.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, this.radiusCol/3);

        this.targetXpreview[i] = this.x + p5.Vector.fromAngle(angle, this.radiusCol + r).x;
        this.targetYpreview[i] = this.y + p5.Vector.fromAngle(p.PI - angle, this.radiusCol + r).y;

        angle -= p.TWO_PI / this.targetXpreview.length + p.TWO_PI / this.targetXpreview.length / this.targetXpreview.length;
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesPreviewX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesPreviewX[i] - this.targetXpreview[i], this.particlesPreviewY[i] - this.targetYpreview[i]));
        let d = p.dist(this.particlesPreviewX[i], this.particlesPreviewY[i], this.targetXpreview[i], this.targetYpreview[i]);

        this.particlesPreviewX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesPreviewY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }
    }

    drawInDrawer(x, y, radius) {

      p.noFill();
      if(session.loops[this.loopId].hover === true) p.stroke(255, 255, 255);
      else p.stroke(255, 255, 255,255/3);
      p.strokeWeight(maxWeightLines / (this.id + 1));

      p.beginShape();
      for (let i = 0; i < this.particlesDrawerX.length; i++) p.vertex(this.particlesDrawerX[i], this.particlesDrawerY[i]);
      p.endShape();

      let angle = -p.PI / 2;

      for (let i = 0; i < this.targetXdrawer.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/3);
        phase += 0.000001;
        zoff += 0.000002;

        this.targetXdrawer[i] = x + p5.Vector.fromAngle(angle, radius + r).x;
        this.targetYdrawer[i] = y + p5.Vector.fromAngle(p.PI - angle, radius + r).y;

        angle -= p.TWO_PI / this.targetXdrawer.length + p.TWO_PI / this.targetXdrawer.length / this.targetXdrawer.length;
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesDrawerX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesDrawerX[i] - this.targetXdrawer[i], this.particlesDrawerY[i] - this.targetYdrawer[i]));
        let d = p.dist(this.particlesDrawerX[i], this.particlesDrawerY[i], this.targetXdrawer[i], this.targetYdrawer[i]);

        this.particlesDrawerX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesDrawerY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }
    }


    drawLine() {
      //if (this.opaLine + this.opaLineInc > this.opaLineMax) this.opaLine = this.opaLineMax;
      //else this.opaLine += this.opaLineInc;

      p.noFill();
      p.stroke(255, 255, 255);
      p.strokeWeight(maxWeightLines / (this.id + 1));

      p.beginShape();
      for (let i = 0; i < this.particlesX.length; i++) p.vertex(this.particlesX[i], this.particlesY[i]);
      p.endShape();

      p.stroke(255, 0, 0);

      let n = p.noise(0, this.id * 0.3, p.frameCount * 0.002);
      let y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
      this.targetXexp[0] = 0;
      this.targetYexp[0] = p.windowHeight / 2 + y;

      let index = 1;

      for (let x = marginX; x <= p.windowWidth - marginX; x += (p.windowWidth - marginX * 2) / this.nSteps) {
        n = p.noise(x * 0.0005, this.id * 0.3, p.frameCount * 0.002);
        y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
        this.targetXexp[index] = x;
        this.targetYexp[index] = p.windowHeight / 2 + y;
        index++;
      }

      n = p.noise(p.windowWidth * 0.0005, this.id * 0.3, p.frameCount * 0.002);
      y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
      this.targetXexp[this.targetXexp.length - 1] = p.windowWidth;
      this.targetYexp[this.targetXexp.length - 1] = p.windowHeight / 2 + y;

      //for (let i = 0; i<this.targetXexp.length;i++) p.point(this.targetXexp[i], this.targetYexp[i]);

      for (let i = 0; i < this.targetXexp.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesX[i] - this.targetXexp[i], this.particlesY[i] - this.targetYexp[i]));
        let d = p.dist(this.particlesX[i], this.particlesY[i], this.targetXexp[i], this.targetYexp[i]);

        this.particlesX[i] -= p5.Vector.fromAngle(a, d / 15).y;
        this.particlesY[i] -= p5.Vector.fromAngle(p.PI - a, d / 15).x;
      }

      //update icon position
      let dif = this.iconTargetX - this.iconX;
      this.iconX += dif / 10;

      if (this.opaIcon + this.opaIconInc > this.opaIconMax) this.opaIcon = this.opaIconMax;
      else this.opaIcon += this.opaIconInc;

      //icon
      p.strokeWeight(1);
      p.stroke(255, 255, 255, this.opaIcon);
      p.rect(this.iconX, this.iconY, iconSize, iconSize, iconCorners);

      p.noStroke();
      p.textFont(font1);
      p.fill(255, 255, 255, this.opaIcon);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(p.windowHeight / 35);
      p.text('0' + (this.id + 1), this.iconX + iconSize / 2, this.iconY + iconSize / 7);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(p.windowHeight / 90);
      p.text(this.name, this.iconX + iconSize / 2, this.iconY + iconSize - iconSize / 5);
    }

    drawNotes() {
      for (let i = 0; i < this.timeline.length; i++) {
        for (let j = 0; j < this.timeline[i].length; j++) {
          this.timeline[i][j].draw(this.particlesX[i], this.particlesY[i]);
        }
      }
    }
  }

  class Note {

    constructor(name, loopId, trackId, start, duration, color) {
      this.name = name;
      this.start = start;
      this.duration = duration;

      this.color = color;

      this.loopId = loopId;
      this.trackId = trackId;

      this.size = p.windowHeight / 60;

      this.x = p.random(0, p.windowWidth);
      this.y = p.random(0, p.windowHeight);

      this.opa = 255;
      this.opaInc = 1;
      this.opaMax = 255;

      this.animOpa = 0;
      this.animR = 0;
      this.animOpaInc = 10;
      this.animRInc = p.windowHeight / 250;
      this.animScale = this.size * 0.2;
      this.animScaleInc = p.windowHeight / 100;

      this.offset = p.windowHeight / 50;
      this.ang = p.PI * p.random(0, 10);
      this.angInc = p.PI / 200;
    }

    play() {
      this.animOpa = 255;
      this.animR = this.size;
      this.animScale = this.size * 0.2;
      synth.triggerAttackRelease("C3", "16n");
    }

    draw(targetX, targetY) {

      this.size = p.windowHeight / 60;

      if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
      else this.animOpa -= this.animOpaInc;

      if (this.animOpa > 0) this.animR += this.animRInc;

      //REVER ISTO
      targetY = targetY + p.sin(this.ang) * this.offset;
      this.ang += this.angInc;
      
      if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
      else this.opa += this.opaInc;

      let a = p.createVector(0, -1).angleBetween(p.createVector(this.x - targetX, this.y - targetY));
      let d = p.dist(this.x, this.y, targetX, targetY);

      this.x -= p5.Vector.fromAngle(a, d / 10).y;
      this.y -= p5.Vector.fromAngle(p.PI - a, d / 10).x;

      p.fill(this.color[0], this.color[1], this.color[2], this.opa);
      p.noStroke();
      p.circle(this.x, this.y, this.size, this.size);

      p.noFill();
      p.stroke(this.color[0], this.color[1], this.color[2], this.animOpa);
      p.strokeWeight(this.size / 10);
      p.circle(this.x, this.y, this.animR, this.animR);
    }
  }

  class Menu {

    constructor(x, y, options) {

      this.lastInstant = 0;

      this.state = -1;
      this.options = options;
      this.nOptions = options.length;

      this.interval = 50;

      this.dark = 0;
      this.darkMax = 200;
      this.darkInc = 10;

      this.offsetValue = p.windowHeight / 25;
      this.offsetInc = p.windowHeight / 200;
      this.opaInc = 15;
      this.opaMax = 255;

      this.optionW = p.windowWidth / 14;
      this.optionH = p.windowHeight / 28;


      this.x = x;
      this.y = y - this.optionH * 1.5;

      this.optionsCheck = [];
      this.optionsOpa = [];
      this.optionsOffset = [];

      for (let i = 0; i < this.nOptions; i++) {
        this.optionsCheck.push(false);
        this.optionsOpa.push(0);
        this.optionsOffset.push(this.offsetValue);
      }
    }

    reset() {
      for (let i = 0; i < this.nOptions; i++) {
        this.optionsCheck[i] = false;
        this.optionsOpa[i] = 0;
        this.optionsOffset[i] = this.offsetValue;
      }
      this.state = -1;
    }

    draw() {

      //update responsive
      this.optionW = p.windowWidth / 14;
      this.optionH = p.windowHeight / 28;

      p.noStroke();
      p.fill(0, 0, 0, this.dark);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      if (this.state === -1) {
        if (this.dark - this.darkInc < 0) this.dark = 0;
        else this.dark -= this.darkInc;
      } else {
        if (this.dark + this.darkInc > this.darkMax) this.dark = this.darkMax;
        else this.dark += this.darkInc;

        if (p.millis() - this.lastInstant > this.interval) {
          this.lastInstant = p.millis();
          for (let i = 0; i < this.nOptions; i++) {
            if (this.optionsCheck[i] === false) {
              this.optionsCheck[i] = true;
              break;
            }
          }
        }

        //p.textFont(font1);
        p.textSize(p.windowHeight / 40);
        p.textAlign(p.LEFT, p.TOP);
        for (let i = 0; i < this.nOptions; i++) {
          if (this.optionsCheck[i]) {

            if (p.mouseX > this.x && p.mouseX < this.x + this.optionW && p.mouseY > this.y - i * this.optionH && p.mouseY < this.y - i * this.optionH + this.optionH) {
              for (let j = 0; j < this.nOptions; j++) if (j !== i) this.optionsOpa[j] = 50;

              if (p.mouseIsPressed) {
                currentLoop.addTrack(instruments[i]);
                console.log(instruments[i]);
                this.reset();
                p.mouseIsPressed = false;
              }
            }
            //else p.noFill();

            //p.stroke(255,0,0,this.optionsOpa[i]);
            //p.rect(this.x,this.y-i*this.optionH+this.optionsOffset[i],this.optionW,this.optionH);
            p.noStroke();
            p.fill(255, 255, 255, this.optionsOpa[i]);
            p.text(this.options[i], this.x, this.y - i * this.optionH + this.optionsOffset[i]);
            if (this.optionsOffset[i] - this.offsetInc < 0) this.optionsOffset[i] = 0;
            else this.optionsOffset[i] -= this.offsetInc;
            if (this.optionsOpa[i] + this.opaInc > this.opaMax) this.optionsOpa[i] = this.opaMax;
            else this.optionsOpa[i] += this.opaInc;
          }

          /*if (p.mouseX>this.x && p.mouseX<this.x+this.optionW && p.mouseY>this.y-i*this.optionH && p.mouseY<this.y-i*this.optionH+this.optionH) {
            
            if (p.mouseIsPressed) {
              synth.triggerAttackRelease("C4", "8n");
              this.state = -1;
              this.reset();
              p.mouseIsPressed = false;
            }
          }*/
        }
      }
    }
  }

  // --------------------------------------------------------------------------------------
  p.preload = function () {
    plus = p.loadImage(plusSVG);
    arrow = p.loadImage(arrowSVG);

    font1 = p.loadFont(disketFont);
    fontLight = p.loadFont(poppinsLightFont);
    fontMedium = p.loadFont(poppinsMediumFont);
    fontBold = p.loadFont(poppinsBoldFont);
  }

  // --------------------------------------------------------------------------------------
  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.frameRate(60);
    p.imageMode(p.CENTER);
    p.textFont(fontMedium);

    console.log(sesh);

    //protect initial trigger of drawers
    p.mouseX = p.windowWidth / 2;
    p.mouseY = p.windowHeight / 2;

    marginX = p.windowWidth / maxSteps;
    iconSize = p.windowHeight / 15;
    iconCorners = p.windowHeight / 100;

    //if (sesh === "bin file not found") {
    session = new Session();
    for (let i = 0; i < 5; i++) {
      session.loops.push(new Loop(i, "myloop"+i, 32, 120));
      session.loops[i].tracks.push(new Track(0, i, "mytrack1", 120, 128, p.windowWidth / 2));
    }
    //session.loops.push(new Loop(1, "myloop2", 4, 120));
    //session.loops.push(new Loop(2, "myloop3", 4, 120));
    //} else {
    //  initLoadedSesh();
    //}

    for (let i = 0; i < particles.length; i++) particles[i] = new Particle();
  }

  // --------------------------------------------------------------------------------------
  p.draw = function () {
    document.body.style.cursor = 'default';
    //p.translate(-p.windowWidth/2,-p.windowHeight/2);
    p.frameRate(60);
    //update responsive values
    marginX = p.windowWidth / maxSteps;
    iconSize = p.windowHeight / 15;
    iconCorners = p.windowHeight / 100;

    p.background(0);
    drawParticles();

    session.draw();
  }

  p.keyPressed = function () {
    if (p.key === ' ' && session.loopDrawer === false && session.structDrawer === false) {
      if (session.activeTab.play) {
        session.activeTab.play = false;
      }
      else {
        session.activeTab.play = true;
      }
    }
    if (p.keyCode === p.BACKSPACE) {
      if (session.loopDrawer) loopSearch = loopSearch.slice(0, -1);
    }
  }
}

export default sketch;