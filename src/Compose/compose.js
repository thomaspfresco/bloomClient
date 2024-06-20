/* BASED ON
Tom Holloway. "Flow Fields and Noise Algorithms with P5.js". 2020.
https://dev.to/nyxtom/flow-fields-and-noise-algorithms-with-p5-js-5g67
(acedido em 12/11/2023)

“Wandering in Space” by aceron: http://openprocessing.org/sketch/933943
License CreativeCommons Attribution: https://creativecommons.org/licenses/by-sa/3.0

“Wandering Particles” by celine: :http://openprocessing.org/sketch/989847
License CreativeCommons Attribution:ehttps://creativecommons.org/licenses/by-sa/3.0
*/

import obliqueStratagies from "../obliqueStratagies.js";
import theory from "./theory.js";

import poppinsLightFont from '../Fonts/Poppins-Light.ttf';
import poppinsMediumFont from '../Fonts/Poppins-Medium.ttf';
import poppinsBoldFont from '../Fonts/Poppins-Bold.ttf';

import loopsSVG from '../Assets/loops.svg';
import structsSVG from '../Assets/structs.svg';
import gridSVG from '../Assets/grid.svg';
import studioSVG from '../Assets/studio.svg';
import autoSVG from '../Assets/automation.svg';
import plusSVG from '../Assets/plus.svg';
import arrowUpPNG from '../Assets/arrowUp.png';
import arrowDownPNG from '../Assets/arrowDown.png';
import aiPNG from '../Assets/ai.png';
import singPNG from '../Assets/sing.png';
import scratchPNG from '../Assets/scratch.png';

import petalOBJ1 from '../Assets/petal1.obj';
import petalOBJ2 from '../Assets/petal2.obj';
import petalOBJ3 from '../Assets/petal3.obj';
import petalOBJ4 from '../Assets/petal4.obj';

import synths from './synths.js';

import * as Tone from 'tone';
import p5 from 'p5';

let fontLight, fontMedium, fontBold;
let petal1, petal2, petal3, petal4;
let loopsIcon, structsIcon, gridIcon, studioIcon, autoIcon, plus, arrowUp, arrowDown, ai, sing, scratch;

let menuOpened = false;
let dragging = false;
let selectX = 0;
let selectY = 0;

let recordedNotes = [];

let inputNotes = [];
let maxInputNotes = 5;
let currentOctave = 3;
let minOctave = 0;
let maxOctave = 8;

let nSteps = 64;

let gridStepSizeX;
let gridStepSizeY;
let gridInitX;
let gridInitY;

let phase = 0;
let zoff = 0;
let noiseMax = 1;

let petalModelSize = 0;

var particles = new Array(100);
var totalFrames = 360;
let counter = 0;

let petalParticles = new Array(50);
let diagonal;
let rotation = 0;

var playParticlesMax = 25;
var wander1 = 0.5;
var wander2 = 2.0;
var drag1 = 0.85;
var drag2 = 0.92;
var force1 = 1;
var force2 = 2;
var theta1 = -0.5;
var theta2 = 0.5;
var sizeScalar = 0.97;
let playSize1;
let playSize2;

let previewOpa = 0;
let drawerOpa = 0;
let previewDelay = 350;
let previewInstant = 0;

let maxWeightLines = 2;
let maxBars = 16;
let maxSteps = 4 * maxBars;

let maxTracks = 4;
let maxLoops = 50;
let maxStructs = 10;

let marginX;
let iconSize;
let iconCorners;

let colors = [[100,50,100],[210,70,90],[235,160,80],[30,120,80]]; //purple, pink, yellow, green
let white = [255,245,220]; //white

let session;

// --------------------------------------------------------------------------------------

const sketch = (saveSession, sesh, setLoading) => (p) => {

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

  //petals in begining
  class PetalParticle {
    n;r;o;l;ang;angInc;color;
    constructor() {
        this.l = 1;
        this.n = p.random(1, p.windowWidth / 2);
        this.r = p.random(0, p.TWO_PI);
        this.o = p.random(1, p.random(1, p.windowWidth / this.n));
        this.ang = p.random(0, p.TWO_PI);
        this.angInc = p.random(0.005, 0.05);
        let aux = p.round(p.random(0,colors.length-1));
        this.color = colors[aux];
        switch (aux) {
          case 0: this.petal = petal1; break;
          case 1: this.petal = petal2; break;
          case 2: this.petal = petal3; break;
          case 3: this.petal = petal4; break;
        }
    }

    draw() {
        this.l++;
        p.push();
        p.rotate(this.r);
        p.translate(this.drawDist()+p.windowHeight/50*p.sin(this.ang/4), p.windowHeight/50*p.sin(this.ang/2),-p.windowWidth / this.o / 5);
        p.fill(this.color[0],this.color[1],this.color[2],p.min(this.l, 255));
        p.scale(p.windowWidth / this.o / 5 / petalModelSize);
        p.rotateX(this.ang);
        p.rotateY(this.ang);
        p.model(this.petal);
        //p.ellipse(0, 0, p.windowWidth / this.o / 50, p.windowWidth / this.o / 50);
        p.pop();
        this.o -= 0.015;
        this.ang += this.angInc;
    }

    drawDist() {
        return (p.atan(this.n / this.o) * p.windowWidth) / p.HALF_PI;
    }
  }

  class PlayParticle {
    constructor(x,y,size,color) {
      this.alive = true;
      this.size = size || 10;
      this.wander = 0.15;
      this.theta = p.random( p.TWO_PI );
      this.drag = 0.92;
      this.color = color;
      this.location = p.createVector(x || 0.0, y || 0.0);
      this.velocity = p.createVector(0.0, 0.0);
      this.opa = p.random(255/2,255);
    }

    move() {
      this.location.add(this.velocity);
      this.velocity.mult(this.drag);
      this.theta += p.random( theta1, theta2 ) * this.wander;
      this.velocity.x += p.sin( this.theta ) * 0.1;
      this.velocity.y += p.cos( this.theta ) * 0.1;
      this.size *= sizeScalar;
      this.alive = this.size > 0.5;
    }

    show() {
      p.fill(this.color[0],this.color[1],this.color[2],this.opa);
      p.noStroke();
      p.ellipse(this.location.x,this.location.y, this.size, this.size);
    }
  }

  function initLoadedSesh() {
    session = new Session();
    for (let i = 0; i < sesh.loops.length; i++) {
      let loop = new Loop(sesh.loops[i].id, sesh.loops[i].name, sesh.loops[i].tempo);
      for (let j = 0; j < sesh.loops[i].tracks.length; j++) {
        let track = new Track(sesh.loops[i].tracks[j].id, sesh.loops[i].id, sesh.loops[i].tracks[j].name, sesh.loops[i].tracks[j].iconTargetX);
        for (let k = 0; k < sesh.loops[i].tracks[j].timeline.length; k++) {
          for (let l = 0; l < sesh.loops[i].tracks[j].timeline[k].length; l++) {
            let note = new Note(sesh.loops[i].tracks[j].timeline[k][l].name, sesh.loops[i].id, sesh.loops[i].tracks[j].id, k, 1, sesh.loops[i].tracks[j].timeline[k][l].duration, sesh.loops[i].tracks[j].color);
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
      this.blackoutOpa = 255;

      this.loopsIconX = 0;
      this.structsIconX = p.windowWidth / 2;

      this.logMessage = "";
      this.logOpa = 0;
      this.logInstant = 0;
      this.logDelay = 2000;
      this.showLog = false;

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

    alertLog(message) {
      this.logInstant = p.millis();
      this.logMessage = message;
      this.showLog = true;
    }

    drawLog() {
      if (this.showLog) {
        //reset log timer
        if (this.logOpa === 0) this.logInstant = p.millis();

        if (this.logOpa + 10 > 255/2) this.logOpa = 255/2;
        else this.logOpa += 10;
      } else {
        if (this.logOpa - 10 < 0) this.logOpa = 0;
        else this.logOpa -= 10;
      }

      p.fill(white[0], white[1], white[2], this.logOpa);
      p.noStroke();
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(p.windowHeight / 55);
      p.textFont(fontLight);
      p.text(this.logMessage, p.windowWidth - gridInitX*1.2, gridInitY/2.1);

      if (p.millis() - this.logInstant > this.logDelay) this.showLog = false;
    }

    drawPetalParticles() {
      p.push();
      p.translate(p.windowWidth / 2, p.windowHeight / 2);
      rotation -= 0.001;
      p.rotate(rotation);
      
      for (let i = 0; i < petalParticles.length; i++) {
        petalParticles[i].draw();
          if (petalParticles[i].drawDist() > diagonal) {
            petalParticles[i] = new PetalParticle();
          }
      }
      p.pop();
    }

    draw() {
      this.drawersOffsetInc = p.windowWidth / 500;

      //draw sugestions oblique stratagies
      if (this.activeTab === null) {
        this.drawPetalParticles();
        this.showSuggestions();
      }
      else this.activeTab.draw();

      //loop and struct drawers icons
      //p.tint(255, 255/4);
      //p.image(loopsIcon, gridInitX*2,  gridInitY/2, p.windowHeight / 35, p.windowHeight / 35);
      //p.image(structsIcon, p.windowWidth - gridInitX*2,  gridInitY/2, p.windowHeight / 35, p.windowHeight / 35);

      //tab transition animation
      if (this.blackoutOpa - 10 < 0) this.blackoutOpa = 0;
      else this.blackoutOpa -= 10;
      p.noStroke();
      p.fill(0, 0, 0, this.blackoutOpa);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      //Tabs
      this.drawTabs();

      //dark effect drawers
      p.noStroke();
      p.fill(0, 0, 0, this.drawersDark);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      p.textFont(fontLight);

      //loop drawer
      p.textSize(p.windowHeight/40);
      p.textAlign(p.LEFT, p.TOP);
      p.fill(white[0], white[1], white[2], this.loopsOpa);
      p.text("LOOPS", p.windowHeight / 30 - this.loopsOffset, p.windowHeight / 30);

      //loop plus
      if (p.mouseX > p.windowHeight/30 && p.mouseX < p.windowHeight/30+p.windowHeight/30 && p.mouseY > p.windowHeight-p.windowHeight/30-p.windowHeight/30 && p.mouseY < p.windowHeight-p.windowHeight/30 && dragging === false && menuOpened === false) {
        p.tint(255, this.loopsOpa);
        document.body.style.cursor = 'pointer';

        //create loop
        if (p.mouseIsPressed) {
          if (this.activeTab !== null) {
            this.activeTab.selectedTrack = null;
            this.activeTab.view = 0;
          }
          let name = "myloop"+(this.loops.length+1);
          this.loops.push(new Loop(this.loops.length, name, 120));
          this.manageTabs(this.loops[this.loops.length-1]);
          p.mouseIsPressed = false;
          Tone.Transport.stop();
          synths.releaseAll();
        }
      }
      else p.tint(255, this.loopsOpa/3);
      p.image(plus, p.windowHeight/30+p.windowHeight/30/2 - this.loopsOffset, p.windowHeight-p.windowHeight/30-p.windowHeight/30/2, p.windowHeight / 35, p.windowHeight / 35);

      //struct drawer
      p.textSize(p.windowHeight/40);
      p.textAlign(p.RIGHT, p.TOP);
      p.fill(white[0], white[1], white[2], this.structsOpa);
      p.text("STRUCTS", p.windowWidth - p.windowHeight / 30 + this.structsOffset, p.windowHeight / 30);

      //struct plus
      if (p.mouseX < p.windowWidth-p.windowHeight/30 && p.mouseX >  p.windowWidth-p.windowHeight/30-p.windowHeight/30 && p.mouseY > p.windowHeight-p.windowHeight/30-p.windowHeight/30 && p.mouseY < p.windowHeight-p.windowHeight/30 && dragging === false && menuOpened === false) {
        p.tint(255, this.structsOpa);
        document.body.style.cursor = 'pointer';

        //create struct
        if (p.mouseIsPressed) {
          if (this.activeTab !== null) {
            if (this.activeTab.type === "loop") {
              this.activeTab.selectedTrack = null;
              this.activeTab.view = 0;
            }
          }
          let name = "myStruct"+(this.structs.length+1);
          this.structs.push(new Structure(this.structs.length, name));
          this.manageTabs(this.structs[this.structs.length-1]);
          p.mouseIsPressed = false;
          Tone.Transport.stop();
          synths.releaseAll();
        }
      }
      else p.tint(255, this.structsOpa/3);
      p.image(plus, p.windowWidth-p.windowHeight/30-p.windowHeight/30/2 + this.structsOffset, p.windowHeight-p.windowHeight/30-p.windowHeight/30/2, p.windowHeight / 35, p.windowHeight / 35);

      //drawers trigger
      if (this.loopDrawer === false && this.structDrawer === false) {
        if (p.mouseX < p.windowWidth / 100 && dragging === false && menuOpened === false) {
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
          if (session.activeTab !== null) session.activeTab.play = false;
          Tone.Transport.start();
        }
        else if (p.mouseX > p.windowWidth - p.windowWidth / 100) this.structDrawer = true;
        if (this.drawersDark - this.drawersDarkInc < 0) this.drawersDark = 0;
        else this.drawersDark -= this.drawersDarkInc;
      } else if (this.loopDrawer || this.structDrawer) {
        if (this.drawersDark + this.drawersDarkInc > this.drawersDarkMax) this.drawersDark = this.drawersDarkMax;
        else this.drawersDark += this.drawersDarkInc;
      }

      //drawers detrigger
      if (p.mouseX > p.windowWidth / 5) {
        if (this.loopDrawer) {
          Tone.Transport.stop();
          synths.releaseAll();
        }
        this.loopDrawer = false;
      }
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
          p.fill(white[0], white[1], white[2], this.loopsOpa/3);
          p.text('Click "+" to create Loop', p.windowHeight / 30 - this.loopsOffset, p.windowHeight / 2);
        }
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
                if (this.loops[i].drawerDragging === false) this.loops[i].drawInDrawer(mouseOffsetX + p.windowHeight / 30 + loopSize, p.windowHeight / 2 - totalDist / 2 + dist*i, loopSize+sizeOffset);
              } else this.loops[i].emptyOpa = 0;

              //text info and preview
              if (p.mouseY > p.windowHeight / 2 - totalDist/2 + dist * i - dist / 2 && p.mouseY < p.windowHeight / 2 - totalDist/2 + dist * i + dist / 2 && dragging === false) {
                
                if (this.loops[i].hover === false) {
                  this.loops[i].hover = true;
                  drawerOpa = 0;
                  previewOpa = 0;
                  previewInstant = p.millis();
                  synths.releaseAll();
                  this.loops[i].play = false;
                  this.loops[i].currentStep = -1;
                }
                
                if (drawerOpa + this.drawersDarkInc > 255) drawerOpa = 255;
                else drawerOpa += this.drawersDarkInc;

                if (p.millis() - previewInstant > previewDelay) {
                  if (previewOpa + this.drawersDarkInc/2 > 255) previewOpa = 255;
                  else previewOpa += this.drawersDarkInc;
                } else this.loops[i].currentStep = -2;

                document.body.style.cursor = 'pointer';
                p.noStroke();
                p.fill(white[0], white[1], white[2], drawerOpa);
                p.textSize(p.windowHeight / 35);
                p.textAlign(p.LEFT, p.CENTER);
                p.textFont(fontMedium);
                p.text(this.loops[i].name, mouseOffsetX + p.windowHeight / 30 + loopSize*4, p.windowHeight / 2 - totalDist/2 + dist * i-p.windowHeight / 60);
                p.fill(white[0], white[1], white[2],drawerOpa/2);
                p.textSize(p.windowHeight / 50);
                p.textFont(fontLight);
                p.text(this.loops[i].tempo+" BPM", +mouseOffsetX + p.windowHeight / 30 + loopSize*4, p.windowHeight / 2 - totalDist/2 + dist * i+p.windowHeight /60);
                
                this.loops[i].drawPreview();

                if (p.mouseIsPressed) {
                  if (this.loops[i].drawerDragging === false) this.loops[i].dragInstant = p.millis();
                  document.body.style.cursor = 'grabbing';
                  if (p.abs(p.dist(p.mouseX, p.mouseY,mouseOffsetX + p.windowHeight / 30 + loopSize, p.windowHeight / 2 - totalDist / 2 + dist*i)) > loopSize*1.5) {
                    dragging = true;
                    this.loops[i].drawerDragging = true;
                  }
                }
              }
              else{
                if (this.loops[i].hover) synths.releaseAll();
                this.loops[i].hover = false;
              }

              if (this.loops[i].drawerDragging) {
                document.body.style.cursor = 'grabbing';
                this.loops[i].drawInDrawer(p.mouseX, p.mouseY, loopSize);
              }

              if (p.mouseIsPressed === false) {
                this.loops[i].drawerDragging = false;
                dragging = false;
                //if (p.mous)
                if (p.millis() - this.loops[i].dragInstant < 100 && this.loops[i].drawerDragging === false) {
                synths.releaseAll();
                Tone.Transport.stop();

                //this.loops[i].drawerDragging = true; 

                if (this.activeTab !== null) {
                  this.activeTab.selectedTrack = null;
                  this.activeTab.view = 0;
                }
                this.manageTabs(this.loops[i]);
                this.activeTab.active = true;
                this.drawersDark = 0;
                for (let t in this.loops[i].tracks) {
                  //this.loops[i].tracks[t].opaLine = 255;
                  for (let n in this.loops[i].tracks[t].notes){
                    this.loops[i].tracks[t].notes[n].x = this.loops[i].tracks[t].particlesPreviewX[nSteps-this.loops[i].tracks[t].notes[n].start+1];
                    this.loops[i].tracks[t].notes[n].y = this.loops[i].tracks[t].particlesPreviewY[ nSteps-this.loops[i].tracks[t].notes[n].start+1];
                  } 
                }
                //synths.exportLoopAudio(this.loops[i],nSteps,setLoading);
                //setLoading(true);
                
                //reset loops position
                for (let j = 0; j < this.loops[i].tracks.length; j++) {
                  this.loops[i].tracks[j].particlesX = this.loops[i].tracks[j].targetXpreview.concat();
                  this.loops[i].tracks[j].particlesY = this.loops[i].tracks[j].targetYpreview.concat();
                }

                //change mouse position to avoid imediate retriggering
                p.mouseX = p.windowWidth / 2;
                //p.mouseIsPressed = false;
              }
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
          p.fill(white[0], white[1], white[2], this.structsOpa/3);
          p.text('Click "+" to create Struct', p.windowWidth-p.windowHeight / 30 + this.structsOffset, p.windowHeight / 2);
        }
        else {}

      } else {
        if (this.structsOffset + this.drawersOffsetInc > p.windowHeight / 25) this.structsOffset = p.windowHeight / 25;
        else this.structsOffset += this.drawersOffsetInc;
        if (this.structsOpa - this.drawersOpaInc < 0) this.structsOpa = 0;
        else this.structsOpa -= this.drawersOpaInc;
      }

      //draw loop or struct dragging
      if (this.loopDrawer === false && this.structDrawer === false) {
        for (let l in this.loops) {
          if (this.loops[l].drawerDragging) {
            if (session.activeTab !== null) {
              if (session.activeTab.type === "loop") document.body.style.cursor = 'not-allowed';
              else document.body.style.cursor ='grabbing';
            } else document.body.style.cursor = 'not-allowed';
            this.loops[l].drawInDrawer(p.mouseX, p.mouseY, p.windowHeight / 15);
          }
          if (p.mouseIsPressed === false && this.loops[l].drawerDragging) {
            dragging = false;
            this.loops[l].drawerDragging = false;
          }
        }
      }

      //draw log
      this.drawLog();
    }

    duplicateLoop(loopId) {
      let newLoop = new Loop(this.loops.length,this.loops[loopId].name + "Copy", this.loops[loopId].tempo);

      //buttons
      newLoop.click.state = this.loops[loopId].click.state;
      newLoop.record.state = this.loops[loopId].record.state;

      for (let t in this.loops[loopId].tracks) {

        let newTrack = new Track(this.loops[loopId].tracks[t].id, newLoop.id, this.loops[loopId].tracks[t].name, this.loops[loopId].tracks[t].iconTargetX);
        
        //knobs
        for (let k in newTrack.knobs) {
          //console.log(newTrack.knobs[k][1]);
          newTrack.knobs[k][1].value = this.loops[loopId].tracks[t].knobs[k][1].value;
          newTrack.knobs[k][1].output = this.loops[loopId].tracks[t].knobs[k][1].output;
          newTrack.knobs[k][1].automating = this.loops[loopId].tracks[t].knobs[k][1].automating;
          newTrack.knobs[k][1].automation = this.loops[loopId].tracks[t].knobs[k][1].automation;
        }

        //buttons
        if (newTrack.name === "DRUMS") for (let b in newTrack.drumButtons) newTrack.drumButtons[b].state = this.loops[loopId].tracks[t].drumButtons[b].state;
        else {
          for (let b in newTrack.oscButtons) {
            newTrack.oscButtons[b].state = this.loops[loopId].tracks[t].oscButtons[b].state;
            newTrack.envButtons[b].state = this.loops[loopId].tracks[t].envButtons[b].state;
          }
        }
        newTrack.filterButton.state = this.loops[loopId].tracks[t].filterButton.state;
        newTrack.distButton.state = this.loops[loopId].tracks[t].distButton.state;
        newTrack.dlyButton.state = this.loops[loopId].tracks[t].dlyButton.state;
        newTrack.revButton.state = this.loops[loopId].tracks[t].revButton.state;

        //scrolls
        newTrack.presetScroll.value = this.loops[loopId].tracks[t].presetScroll.value;
        newTrack.octaveScroll.value = this.loops[loopId].tracks[t].octaveScroll.value;
        newTrack.automationScroll.value = this.loops[loopId].tracks[t].automationScroll.value;

        //gain
        newTrack.gain = this.loops[loopId].tracks[t].gain;

        newTrack.presetChanged = this.loops[loopId].tracks[t].presetChanged;

        newLoop.tracks.push(newTrack);

        for (let n in this.loops[loopId].tracks[t].notes) {
          let newNote = new Note(this.loops[loopId].tracks[t].notes[n].pitch, newLoop.id, newTrack.id, this.loops[loopId].tracks[t].notes[n].start, this.loops[loopId].tracks[t].notes[n].duration,  this.loops[loopId].tracks[t].notes[n].octave, this.loops[loopId].tracks[t].notes[n].color);
          newLoop.tracks[t].notes.push(newNote);
        }
      }

      this.loops.push(newLoop);
      this.manageTabs(this.loops[this.loops.length-1]);
    }

    deleteLoop(loopId) {
      this.activeTab = null;

      for (let l in this.tabs) {
        if (this.tabs[l].id === loopId) {
          this.tabs.splice(l, 1);
          break;
        }
      }

      this.loops.splice(loopId, 1);

      
      for (let l in this.loops) {
        this.loops[l].id = l;

        this.loops[l].menu.tabId = l;
        this.loops[l].plusMenu.tabId = l;

        for (let t in this.loops[l].tracks) {
          this.loops[l].tracks[t].loopId = l;
          for (let n in this.loops[l].tracks[t].notes) {
            this.loops[l].tracks[t].notes[n].loopId = l;
          }
        }
      }

      this.blackoutOpa = 255;
    }

    closeTab(tabId) {
      for (let l in this.tabs) {
        if (this.tabs[l].id === tabId) {
          this.tabs.splice(l, 1);
          break;
        }
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

      synths.releaseAll();
      Tone.Transport.stop();
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

      p.fill(white[0], white[1], white[2], 255/4);
      p.textFont(fontLight);
      if (this.activeTab === null) {
        p.fill(white[0], white[1], white[2]);
        p.textFont(fontMedium);
      }
      else if (p.mouseX > p.windowWidth/2-totalDist/2-p.textWidth("BLOOM")/2 && p.mouseX < p.windowWidth/2-totalDist/2+p.textWidth("BLOOM")/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2 && dragging === false && menuOpened === false) {
        p.fill(white[0], white[1], white[2]);
        p.textFont(fontLight);
        document.body.style.cursor = 'pointer';

        if (p.mouseIsPressed) {
          if (this.activeTab !== null) {
            this.activeTab.play = false;
            this.activeTab.selectedTrack = null;
            this.activeTab.view = 0;
          }
          this.activeTab = null;
          p.mouseIsPressed = false;
          this.blackoutOpa = 255;
          synths.releaseAll();
          Tone.Transport.stop();

        }
      }
      p.push();
      if (menuOpened) p.translate(0,0, p.windowHeight / 30);
      p.text("BLOOM", this.bloomX, p.windowHeight / 30);
      p.pop();

      for (let i = 0; i < this.tabs.length; i++) {

        if (this.loops[i].tabOpa + 5 > 255) this.loops[i].tabOpa = 255;
        else this.loops[i].tabOpa += 5;

        if (this.activeTab === this.tabs[i]) {
          p.fill(white[0], white[1], white[2],this.loops[i].tabOpa);
          p.textFont(fontMedium);
        }

        if (p.mouseX > this.tabsTargetX[i]-p.textWidth(this.tabs[i].name)/2 && p.mouseX < this.tabsTargetX[i]+p.textWidth(this.tabs[i].name)/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2 && dragging === false && menuOpened === false) {
          document.body.style.cursor = 'pointer';

          if (this.activeTab !== this.tabs[i]) {
            p.fill(white[0], white[1], white[2]);
            p.textFont(fontLight);
            if (p.mouseIsPressed) {
              if (this.activeTab !== null) {
                this.activeTab.selectedTrack = null;
                this.activeTab.view = 0;
              }
              this.activeTab = this.tabs[i];
              this.activeTab.active = false;
              p.mouseIsPressed = false;
            }
          }
          else {
            if (p.mouseIsPressed) {
              this.tabs[i].menu.open();
              p.mouseIsPressed = false;
            }
          }

        }
        else if (this.activeTab !== this.tabs[i]) {
          p.fill(white[0], white[1], white[2],255/4);
          p.textFont(fontLight);
        }
        dif = this.tabsTargetX[i] - this.tabsX[i];
        this.tabsX[i] += dif / 10;
        p.push();
        if (menuOpened) p.translate(0,0, p.windowHeight / 30);
        p.text(this.tabs[i].name, this.tabsX[i], p.windowHeight / 30);
        p.pop();
      }

      for (let i = 0; i < this.tabs.length; i++) this.tabs[i].menu.draw(this.tabsX[i]-p.textWidth(this.tabs[i].name)/2, p.windowHeight / 30);
    }

    //draw sugestions
    showSuggestions() {
      if (p.millis() - this.suggestionInstant > 5000) {
        this.suggestionInstant = p.millis();
        this.suggestionIndex = p.floor(p.random(0, obliqueStratagies.length));
      }
       
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.fill(white[0], white[1], white[2],255/2);
      p.textSize(p.windowHeight / 30);
      p.text(obliqueStratagies[this.suggestionIndex], p.windowWidth / 2, p.windowHeight / 2);

      //p.text("LOOP: "+loopSearch, p.windowWidth/2, p.windowHeight/30+p.windowHeight/30);
    }
  }

  class Structure {

    constructor(id, name) {
      this.type = "struct";

      this.name = name;
      this.id = id;
       
      this.tempo = 120;
      this.overrideTempo = false;
      this.transpose = 0;
      this.overrideTranspose = false;

      this.sequence = [session.loops[0],session.loops[1],session.loops[2],session.loops[3],session.loops[4]];
      this.currentLoop = this.sequence[0];
      this.repeats = [];

      this.gap = p.windowWidth / 6;
      this.totalDist = 0;
      this.y = 0;

      this.play = false;

      this.blackoutOpa = 0;
      this.active = false;

      this.tempoScroll = new Scrollable("TEMPO",120,20,400,"BPM",1,5);
      this.transposeScroll = new Scrollable("TRANSPOSE",0,-12,12,"ST",1,1);

      this.tempoButton = new Button("TEMPO", false, white);
      this.transposeButton = new Button("TRANSPOSE", false, white);

      this.menu = new Menu(this.id, null, "menu",["EXPORT","RENAME","DUPLICATE", "CLOSE TAB", "DELETE"],"DROPDOWN");
    }

    draw() {
     
      this.gap = p.windowWidth / 6;
      this.y = p.windowHeight / 2;
      this.totalDist = this.gap * (this.sequence.length - 1);
     // console.log("draw struct");
      //p.fill(255,0,0);
     // p.circle(p.windowWidth / 2, p.windowHeight / 2, p.windowHeight / 4);

      //p.beginShape();
      for (let i = 0; i < this.sequence.length; i++) {
        //console.log(this.sequence[i]);
        p.push();
        p.translate(0,0, -p.windowHeight / 30);
        this.sequence[i].drawInStructure(this.sequence[i], p.windowWidth / 2-this.totalDist/2+i*this.gap, this.y, p.windowWidth/20);
        p.pop();
        
        //p.noFill();
        //p.stroke(white[0], white[1], white[2]);
        //p.strokeWeight(2);
       // p.vertex(p.windowWidth/2-this.totalDist/2+i*this.gap, this.y);
        //if (i < this.sequence.length - 1) {
        //p.stroke(white[0], white[1], white[2]);
        //p.vertex(p.windowWidth/2-this.totalDist/2+i*this.gap+this.gap/2, this.y);
        //}
        //p.circle(p.windowWidth / 2-this.totalDist/2+i*this.gap, this.y, p.windowWidth / 10);
      }

      let auxY = p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2;
      let auxX = (p.windowWidth - gridInitX*2 - p.windowWidth/150*7)/8/2;

      //p.stroke(255,0,0);

      //p.line(p.windowWidth/4,0,p.windowWidth/4,p.windowHeight);
      //p.line(p.windowWidth/4*2,0,p.windowWidth/4*2,p.windowHeight);
      //p.line(p.windowWidth/4*3,0,p.windowWidth/4*3,p.windowHeight);

      p.textSize(p.windowHeight / 65);
      p.textAlign(p.CENTER, p.BOTTOM);
      //let tw = p.textWidth("CLICK");
      
      if (this.tempoButton.state) p.fill(white[0], white[1], white[2]);
      else p.fill(white[0], white[1], white[2], 255/2);
      p.text("OVERRIDE",p.windowWidth/4+auxX*1.5,auxY+p.windowHeight / 40);
      
      if (this.transposeButton.state) p.fill(white[0], white[1], white[2]);
      else p.fill(white[0], white[1], white[2], 255/2);
      p.text("OVERRIDE",p.windowWidth-p.windowWidth/4,auxY+p.windowHeight / 40);
      
      this.tempoScroll.draw(p.windowWidth/4,auxY);
      this.transposeScroll.draw(p.windowWidth-p.windowWidth/4-auxX*1.4,auxY);
      this.tempoButton.draw(p.windowWidth/4+auxX*1.5,auxY-p.windowHeight / 120);
      this.transposeButton.draw(p.windowWidth-p.windowWidth/4,auxY-p.windowHeight / 120);

      //p.endShape();

      //blackout animation
      if (this === session.activeTab) {
        if (this.active === false) this.blackoutOpa = 255;
        this.active = true;
      }

      if (this.blackoutOpa - 10 < 0) this.blackoutOpa = 0;
      else this.blackoutOpa -= 10;

      //black anim transition
      p.fill(0, 0, 0, this.blackoutOpa);
      p.rect(0, 0, p.windowWidth, p.windowHeight);
    }
  }

  class Loop {

    constructor(id, name, tempo) {
      this.type = "loop";

      this.id = id;
      this.name = name;
      this.tracks = [];

      this.nSteps = nSteps;
      this.drawerDragging = false;
      this.dragInstant = 0;

      this.play = false;
      this.active = false;

      this.selectedTrack = null;

      this.view = 0; //0:grid, 1:studio, 2:automation
      this.gridOpa = 0;
      this.studioOpa = 0;
      this.tabOpa = 0;
      this.emptyOpa = 0;
      
      this.blackOpa1 = 255;
      this.blackOpa2 = 255;
      this.blackOpa3 = 0;

      this.tempoScroll = new Scrollable("TEMPO",tempo,20,400,"BPM",1,5);
      // = new Scrollable("TRANSPOSE",0,-12,12,"ST",1,1);

      this.click = new Button("CLICK", false, [white[0], white[1], white[2]]);
      this.record = new Button("RECORD", false, [255,0,0]);

      this.tempo = tempo;
      this.timeBtwSteps = 60 / tempo / 4;
      this.lastInstant = 0;
      this.currentStep = 0;

      this.blackoutOpa = 0;

      this.hover = false;

      this.lastInstPlusMenu = 0;
      this.opaPlus = 0;
      this.opaPlusInc = 10;
      this.opaPlusMax = 255;

      this.plusX = p.windowWidth / 2 - iconSize / 2;
      this.plusY = p.windowHeight - iconSize / 2 - iconSize;
      this.plusTargetX = p.windowWidth / 2 - iconSize / 2;

      this.x = 0;
      this.y = 0;

      this.menu = new Menu(this.id, null, "menu",["EXPORT","RENAME","DUPLICATE","STRUCT FROM", "CLOSE TAB", "DELETE"],"DROPDOWN");
      this.plusMenu = new Menu(this.id, null, "plusMenu",["MELODY", "HARMONY", "DRUMS", "BASS"],"DROPUP");
    }

    updateIconsPos() {
      if (this.tracks.length === 0) {
        this.plusTargetX = p.windowWidth / 2 - iconSize / 2;
        //this.menu.x = this.plusX;
      }
      else {
        let w = (this.tracks.length - 1) * (iconSize/2) + iconSize * (this.tracks.length);
        let anchorRight = p.windowWidth / 2 + w / 2;

        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].iconTargetX = anchorRight - w + i * (iconSize + iconSize / 2);
          this.tracks[i].iconY = p.windowHeight - iconSize / 2 - iconSize;
        }

        this.plusTargetX = anchorRight + iconSize / 4;
        //this.menu.x = this.plusX;
      }

      this.plusY = p.windowHeight - iconSize / 2 - iconSize;
      //this.menu.y = this.plusY - this.menu.optionH * 1.5;
    }

    addTrack(name) {

      let w = this.tracks.length * (iconSize / 4) + iconSize * (this.tracks.length + 1);
      let anchorRight = p.windowWidth / 2 + w / 2;

      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].iconTargetX = anchorRight - w + i * (iconSize + iconSize / 4);
      }

      this.tracks.push(new Track(this.tracks.length, this.id, name, anchorRight - iconSize));
      if (this.selectedTrack !== null) this.selectedTrack = this.tracks[this.tracks.length - 1];

      this.plusTargetX = anchorRight + iconSize / 4;

      //this.menu.x = this.plusTargetX;
      //}
      //console.log(this.loopId,this.trackId);
      //REVER
      /*for (let i = 0; i < 5; i++) {
        let start = p.floor(p.random(0, nSteps));
        let pitch = p.floor(p.random(0,this.tracks[this.tracks.length - 1].nPitches));
        //let duration = p.random(1,4);
        let duration = 1;
        let oct = -1;
        if (this.name === "DRUMS") oct = 0;
        else oct = 3;
        this.tracks[this.tracks.length - 1].notes.push(new Note(pitch, this.id, this.tracks.length - 1, start, duration, oct, this.tracks[this.tracks.length - 1].color));
      }*/
      //saveSession(session);
    }

    /*updateMetronome() {
      if (p.millis() - this.lastInstant >= this.timeBtwSteps * 1000) {
        if (this.currentStep === nSteps-1) this.currentStep = 0;
        else this.currentStep++;

        this.lastInstant = p.millis();
      
        for (let t in this.tracks) {
          for (let n in this.tracks[t].timeline[this.currentStep]) {
            if (this.tracks[t].timeline[this.currentStep][n] !== null) this.tracks[t].timeline[this.currentStep][n].play();
          }
        }
      }
    }*/

    draw() {
      //draw track lines and notes
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].draw();
        this.tracks[i].drawNotes();
      }

        //update metronome
        //if (this.play) this.updateMetronome();

        this.updateIconsPos();

        //update plus button position
        let dif = this.plusTargetX - this.plusX;
        this.plusX += dif / 10;

        //cursor
        if (this.play && this.currentStep >= 0 && (this.view !==1) && session.activeTab.selectedTrack !== null) {
          p.stroke(white[0], white[1], white[2]);
          p.strokeWeight(0.5);
          //p.rect(marginX+this.currentStep*(p.windowWidth-marginX*2)/this.nSteps,0,(p.windowWidth-marginX*2)/this.nSteps,p.windowHeight);
          //p.line(gridInitX + this.currentStep * gridStepSizeX, 0,gridInitX + this.currentStep * gridStepSizeX, p.windowHeight);
          p.line(gridInitX + this.currentStep * gridStepSizeX, gridInitY,gridInitX + this.currentStep * gridStepSizeX, gridInitY+gridStepSizeY*11);
        }

        //hover plus button
        if (p.mouseX > this.plusX && p.mouseX < this.plusX + iconSize && p.mouseY > this.plusY && p.mouseY < this.plusY + iconSize && dragging === false && menuOpened === false && this.tracks.length < maxTracks) {
          this.opaPlus = this.opaPlusMax;

          document.body.style.cursor = 'pointer';

          if (p.mouseIsPressed) {
            this.plusMenu.open();
            p.mouseIsPressed = false;
          }
        } else if (((p.mouseY > gridInitY+11*gridStepSizeY && this.selectedTrack === null || this.selectedTrack !== null) && this.tracks.length < maxTracks || this.tracks.length===0) && menuOpened === false) {
          if (this.opaPlus + this.opaPlusInc > this.opaPlusMax/2) this.opaPlus = this.opaPlusMax/2;
          else this.opaPlus += this.opaPlusInc;
        } else {
          if (this.opaPlus - this.opaPlusInc < 0) this.opaPlus = 0;
          else this.opaPlus -= this.opaPlusInc;
        }

        if (this.plusMenu.state === 0) this.opaPlus = this.opaPlusMax;

        //grid, studio or automation
        if (this.selectedTrack !== null) {
          if (this.view === 0) this.selectedTrack.drawGrid();
          else if (this.view === 1) this.selectedTrack.drawStudio();
          else this.selectedTrack.drawAutomation();

          let auxY = p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2;
          let auxX = (p.windowWidth - gridInitX*2 - p.windowWidth/150*7)/8/2;
          this.tempoScroll.draw(gridInitX + auxX,auxY);
          p.textSize(p.windowHeight / 65);
          p.textAlign(p.CENTER, p.BOTTOM);
          //let tw = p.textWidth("CLICK");
          if (this.click.state) p.fill(white[0], white[1], white[2]);
          else p.fill(white[0], white[1], white[2], 255/2);
          p.text("CLICK",gridInitX + auxX*3+p.windowWidth/150*1,auxY+p.windowHeight / 40);
          if (this.record.state) p.fill(white[0], white[1], white[2]);
          else p.fill(white[0], white[1], white[2], 255/2);
          p.text("RECORD",gridInitX + auxX*5+p.windowWidth/150*2,auxY+p.windowHeight / 40);

          this.click.draw(gridInitX + auxX*3+p.windowWidth/150*1,auxY-p.windowHeight / 120);
          this.record.draw(gridInitX + auxX*5+p.windowWidth/150*2,auxY-p.windowHeight / 120);
          //this.transposeScroll.draw(p.windowWidth/8*2.5,auxY);
          
          if (this.tempoScroll.value !== this.tempo) {
            this.tempo = this.tempoScroll.value;
            this.timeBtwSteps = 60 / this.tempo / 4;
          }
        }
        
        Tone.Transport.bpm.value = this.tempo;

        //plus button
        //p.fill(255, 255, 255, this.opaPlus);
        //p.stroke(white[0], white[1], white[2]);
        //p.strokeWeight(1);
        //p.rect(this.plusX, this.plusY, iconSize, iconSize, iconCorners);

        let y = p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2;

        //track view buttons
        if (this.selectedTrack !== null) {
          let icons = [autoIcon, studioIcon, gridIcon];
          for (let i = 0; i < icons.length; i++) {
            let x =  p.windowWidth - gridInitX*2 - iconSize*(i);
            if ((2-i) === this.view) p.tint(255, 255);
            else p.tint(255, 255/4);
            p.image(icons[i], x, y, p.windowHeight / 35, p.windowHeight / 35);

            if (p.mouseX > x-p.windowHeight / 35 && p.mouseX < x+p.windowHeight / 35 && p.mouseY > y-p.windowHeight / 35 && p.mouseY < y+p.windowHeight / 35 && dragging === false && menuOpened === false) {
              document.body.style.cursor = 'pointer';
              if (p.mouseIsPressed) {
                if (this.view === (2-i)) {
                  this.selectedTrack = null;
                  this.view = 0;
                }
                else {
                  this.view = 2-i;
                  this.blackOpa2 = 255;
                  this.blackOpa3 = 255;
                }
                p.mouseIsPressed = false;
              }
            }
          }
        }

        this.plusMenu.draw(this.plusX, y);

        for (let i = 0; i < this.tracks.length; i++) this.tracks[i].menu.draw(this.tracks[i].iconX, p.windowHeight - gridInitX -p.windowHeight / 40 - p.windowHeight/30);

        p.push();
        p.tint(255, this.opaPlus);
        if (this.plusMenu.state >= 0) p.translate(0,0, p.windowHeight / 30*2);
        p.image(plus, this.plusX + iconSize / 2, y, p.windowHeight / 40, p.windowHeight / 40);
        p.pop();

        //blackout animation
        if (this === session.activeTab) {
          if (this.active === false) this.blackoutOpa = 255;
          this.active = true;
        }

        if (this.active) {
          if (this.blackoutOpa - this.opaPlusInc > 0) this.blackoutOpa -= this.opaPlusInc;
          else this.blackoutOpa = 0;
          if (this.blackOpa1 - this.opaPlusInc < 0) this.blackOpa1 = 0;
          else this.blackOpa1 -= this.opaPlusInc;
          if (this.blackOpa2 - this.opaPlusInc < 0) this.blackOpa2 = 0;
          else this.blackOpa2 -= this.opaPlusInc;
          if (this.blackOpa3 - this.opaPlusInc < 0) this.blackOpa3 = 0;
          else this.blackOpa3 -= this.opaPlusInc;
        }

        //complementary black anim transition
        p.noStroke();
        p.fill(0, 0, 0, this.blackOpa1);
        p.rect(0,p.windowHeight-gridInitY*1.2,p.windowWidth/16*6,gridInitY*1.2);
        p.rect(p.windowWidth-p.windowWidth/16*2.5, p.windowHeight-gridInitY*1.2,p.windowWidth/16*2.5,gridInitY*1.2);
        p.fill(0, 0, 0, this.blackOpa2);
        p.rect(p.windowWidth-p.windowWidth/16*2.5-p.windowWidth/16*3.5, p.windowHeight-gridInitY*1.2,p.windowWidth/16*3.5,gridInitY*1.2);
        p.fill(0, 0, 0, this.blackOpa3);
        p.rect(0, gridInitY-p.windowHeight/100, p.windowWidth, p.windowHeight-gridInitY*2.2);

        //black anim transition
        p.fill(0, 0, 0, this.blackoutOpa);
        p.rect(0, 0, p.windowWidth, p.windowHeight);
    }

    //draw simplified representation of loop in drawer
    drawInDrawer(x, y, radius) {
      if (this.tracks.length === 0) {

        if (this.emptyOpa + this.opaPlusInc > 255) this.emptyOpa = 255;
        else this.emptyOpa += this.opaPlusInc;

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 60);
        if (this.hover) p.fill(white[0], white[1], white[2],this.emptyOpa);
        else p.fill(white[0], white[1], white[2], this.emptyOpa/2);
        p.text("EMPTY", x, y);
      } else {
        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].drawInDrawer(x, y, radius);
        }
      }
    }

    drawInStructure(loop, x, y, radius) {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawInStructure(loop, x, y, radius);
      }
    }

    drawPreview() {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawPreview();
      }
    }
  }

  class Track {

    constructor(id, loopId, name, iconTargetX) {
      this.id = id;
      this.name = name;

      this.loopId = loopId;

      this.notes = [];

      if (this.name === "DRUMS") {
        this.nPitches = theory.drumLabels.length;
        this.color = colors[1];
      }
      else {
        this.nPitches = 24;
        if (this.name === "BASS") this.color = colors[0];
        if (this.name === "MELODY") this.color = colors[3];
        if (this.name === "HARMONY") this.color = colors[2];
      }

      this.menu = new Menu(this.loopId, this.id, "trackMenu",["DELETE","RENAME","EXPORT"],"DROPUP");

      this.ang = p.random(0, p.TWO_PI);
      this.angInc = p.PI / 400;

      this.radiusCol = p.windowHeight / 4;

      this.iconHover = false;
      
      this.hoverVolume = false;
      this.draggingVolume = false;
      this.volumeY = 0;
      this.volumeYmax = 0;
      this.volumeYmin = 0;

      this.draggingAutomation = false;

      this.draggingGrid = false;
      this.draggingSelect = false;
      this.lastGridX = 0;
      this.lastGridY = 0;
      this.tempNote = null;

      this.opaInfoAutomation = 0;

      this.opaLine = 255;
      this.opaLineInc = 10;

      this.iconTargetX = iconTargetX;
      this.iconX = iconTargetX;
      this.iconY = p.windowHeight - iconSize / 2 - iconSize;
      this.opaIcon = 0;
      this.opaIconInc = 5;
      this.opaIconMax = 255;

      this.x = p.windowWidth / 2 + p.windowWidth/8;
      this.y = p.windowHeight / 2;

      this.knobs = [];
      this.param = 0;

      this.gain = 1;

      //check if preset is equal to original preset
      this.presetChanged = false;

      //fx knobs
      this.filterKnob = new Knob("POSITION",0.50,theory.defaultValues,"");
      this.distKnob = new Knob("AMOUNT",0.50,theory.defaultValues,"");
      this.dlyKnobs = [new Knob("TIME",0.50,theory.delayTimes,""),new Knob("FEEDBACK",0.50,theory.defaultValues,""),new Knob("DRY/WET",0.50,theory.defaultValues,"")];
      this.revKnobs = [new Knob("DECAY",0.50,theory.timeValues,"s"),new Knob("DRY/WET",0.50,theory.defaultValues,"")];

      //fx buttons
      this.filterButton = new Button("FILTER", true,this.color);
      this.distButton = new Button("DISTORTION", false,this.color);
      this.dlyButton = new Button("DELAY", false,this.color);
      this.revButton = new Button("REVERB", false,this.color);

      if (this.name === "BASS") {
        this.petal = petal1;
        this.synth = synths.bass;
        this.preset = 0;
      }
      
      if (this.name === "MELODY") {
        this.petal = petal3;
        this.synth = synths.melody;
        this.preset = 0;
      }
      
      if (this.name === "HARMONY") {
        this.petal = petal4;
        this.synth = synths.harmony;
        this.preset = 0;
      }

      //different sinthesis for drums tracks
      if (this.name === "DRUMS") {
        this.preset = 0;
        this.presetScroll = new Scrollable("PRESET",this.preset,0,synths.drumPresets.length-1,"",1,1);
        this.octaveScroll = new Scrollable("OCTAVE",0,0,0,"",1,1);

        this.drumKnobs = [];
        this.drumButtons = [];
        this.petal = petal2;
        this.synth = synths.drums;
        for (let i=0; i<theory.drumLabels.length; i++) { 
          this.drumKnobs.push([new Knob("GAIN",1,theory.defaultValues,""),new Knob("PITCH",0.50, theory.pitchValues,"st")]);
          this.drumButtons.push(new Button("PART "+i,true,this.color));
          this.knobs.push([theory.drumLabels[i],this.drumKnobs[i][0]]);
          this.knobs.push([theory.drumLabels[i],this.drumKnobs[i][1]]);
        }      
      } else {
        this.octaveScroll = new Scrollable("OCTAVE",3,0,theory.octaves.length-1,"",1,1);
        this.presetScroll = new Scrollable("PRESET",this.preset,0,synths.synthPresets.length-1,"",1,1);

        this.oscKnobs = [[new Knob("WAVE", 1, theory.waveTypes, ""),new Knob("PITCH",0.50, theory.pitchValues,"st"),new Knob("VOLUME",0.50,theory.defaultValues,"")],[new Knob("WAVE", 0, theory.waveTypes, ""),new Knob("PITCH",0.50, theory.pitchValues,"st"),new Knob("VOLUME",0.50,theory.defaultValues,"")]];
        this.envKnobs = [[new Knob("ATTACK",0,theory.timeValues,"s"),new Knob("DECAY",0.50,theory.timeValues,"s"),new Knob("SUSTAIN",0.50,theory.defaultValues,""),new Knob("RELEASE",0,theory.timeValues,"s")],[new Knob("ATTACK",0,theory.timeValues,"s"),new Knob("DECAY",0.50,theory.timeValues,"s"),new Knob("SUSTAIN",0.50,theory.defaultValues,""),new Knob("RELEASE",0,theory.timeValues,"s")]];
        this.oscButtons = [new Button("OSCILLATOR 1", true,this.color),new Button("OSCILLATOR 2", true,this.color)];
        this.envButtons = [new Button("ENVELOPE 1", true,this.color),new Button("ENVELOPE 2", true,this.color)];
        
        for (let i = 0; i < 2; i++) {
          this.knobs.push(["OSC "+(i+1),this.oscKnobs[i][0]]);
          this.knobs.push(["OSC "+(i+1),this.oscKnobs[i][1]]);
          this.knobs.push(["OSC "+(i+1),this.oscKnobs[i][2]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][0]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][1]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][2]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][3]]);
        }

      }

      this.knobs.push(["FILTER",this.filterKnob]);
      this.knobs.push(["DIST",this.distKnob]);
      this.knobs.push(["DELAY",this.dlyKnobs[0]]);
      this.knobs.push(["DELAY",this.dlyKnobs[1]]);
      this.knobs.push(["DELAY",this.dlyKnobs[2]]);
      this.knobs.push(["REVERB",this.revKnobs[0]]);
      this.knobs.push(["REVERB",this.revKnobs[1]]);
      this.automationScroll = new Scrollable("PARAMETER",this.param,0,this.knobs.length-1,"",1,1);

      //console.log(this.knobs);

      this.particlesX = [];
      this.particlesY = [];
      this.particlesDrawerX = [];
      this.particlesDrawerY = [];
      this.particlesPreviewX = [];
      this.particlesPreviewY = [];
      this.particlesStructX = [];
      this.particlesStructY = [];

      this.targetXexp = [];
      this.targetYexp = [];
      this.targetXdrawer = [];
      this.targetYdrawer = [];
      this.targetXpreview = [];
      this.targetYpreview = [];
      this.targetXstruct = [];
      this.targetYstruct = [];

      for (let i = 0; i < nSteps + 2; i++) {
        this.particlesX.push(p.windowWidth / 2);
        this.particlesY.push(p.windowHeight / 2);
        this.particlesDrawerX.push(-p.windowWidth/5);
        this.particlesDrawerY.push(p.windowHeight / 2);
        this.particlesPreviewX.push(this.x);
        this.particlesPreviewY.push(p.windowHeight / 2);
        this.particlesStructX.push(p.windowWidth / 2);
        this.particlesStructY.push(p.windowHeight / 2);
        this.targetXexp.push(0);
        this.targetYexp.push(0);
        this.targetXdrawer.push(0);
        this.targetYdrawer.push(0);
        this.targetXpreview.push(0);
        this.targetYpreview.push(0);
        this.targetXstruct.push(0);
        this.targetYstruct.push(0);
      }
    }

    playInputNote(input) {
      if (this.name === "DRUMS") {
        if (input < theory.drumLabels.length) {
          this.synth.parts[input].start(Tone.context.currentTime);

          //stop open hat when closed hat is triggered
          if (input === 2) this.synth.parts[3].stop();
        }
      } else {
        for (let osc in this.synth.oscillators) {
          this.synth.oscillators[osc].triggerAttack(theory.freqs[input]*p.pow(2,currentOctave),Tone.context.currentTime);
        }
      }
    }

    releaseInputNote(input) {
      if (this.name !== "DRUMS") {
        for (let osc in this.synth.oscillators) {
          this.synth.oscillators[osc].triggerRelease(theory.freqs[input]*p.pow(2,currentOctave),Tone.context.currentTime);
        }
      }
    }

    ajustNotes(note) {
      let auxY = 0;

      if (this.name === "DRUMS") auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;
      else auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;

      for (let i = 0; i < this.notes.length; i++) {
        if (this.notes[i] === note) break;
        //same octave and pitch
        if (this.notes[i].pitch === note.pitch && this.notes[i].octave === note.octave) {
          
          //remove a note that starts beetween the start of the new note and its start+duration, as well as its end
          if (this.notes[i].start >= note.start && this.notes[i].start+this.notes[i].duration <= note.start + note.duration) {
            this.notes.splice(i,1);
            i--;
          //shorten a note that starts beetween the start of the new note and its start+duration, but ends after the new note's end
          } 
          if (this.notes[i].start >= note.start && this.notes[i].start+this.notes[i].duration > note.start + note.duration && this.notes[i].start < note.start + note.duration) {
            this.notes[i].duration = this.notes[i].duration - (note.start + note.duration - this.notes[i].start);
            this.notes[i].start = note.start + note.duration;
            this.notes[i].x = this.particlesX[this.notes[i].start+1];
          //create a new note between the start of the new note and its start+duration
          } 
          
          if (this.notes[i].start < note.start && this.notes[i].start+this.notes[i].duration > note.start + note.duration) {
            let aux = this.notes[i].duration;
            this.notes[i].duration = note.start - this.notes[i].start;
            let newNote = new Note(this.notes[i].pitch, this.loopId, this.id, note.start + note.duration, aux - (note.start + note.duration - this.notes[i].start), this.notes[i].octave, this.color);
            newNote.x = this.particlesX[newNote.start+1];
            if (auxY > 11) newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
            else newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
            //if (auxY > 11) newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
            //else this.notes[i].y = gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
            this.notes.push(newNote);
          //shorten a note that starts before the new note and ends after the new note start but before its end
          } 
          if (this.notes[i].start < note.start && this.notes[i].start+this.notes[i].duration > note.start && this.notes[i].start+this.notes[i].duration >= note.start + note.duration) {
            this.notes[i].duration = note.start - this.notes[i].start;
            this.notes[i].x = this.particlesX[this.notes[i].start+1];
          }
        }
      }
    }

    drawGrid() {
      p.stroke(white[0]/5, white[1]/5, white[2]/5);
      p.strokeWeight(1);
      p.line(p.windowWidth-gridInitX,gridInitY,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11));
      for (let i = 0; i < nSteps ; i++) {
        if (i%16 === 0 || i%4 === 0) {
          p.strokeWeight(1);
          if (i%16 === 0) p.stroke(white[0]/5, white[1]/5, white[2]/5);
          else p.stroke(white[0]/8, white[1]/8, white[2]/8);
          p.push();
          p.translate(0,0,-1);
          p.line(gridInitX+gridStepSizeX*i,gridInitY,gridInitX+gridStepSizeX*i,gridInitY+(gridStepSizeY * 11));
          p.pop();
        }
        if (this.octaveScroll.value !== 8) {
          const xPos = gridInitX + gridStepSizeX * i;
          for (let j = 0; j < this.nPitches; j++) {
              const yPos = gridInitY + (gridStepSizeY * 11)/(this.nPitches-1) * j;
              const d = p.dist(p.mouseX,p.mouseY,xPos,yPos);
              p.noStroke();
              if (d < gridStepSizeX*nSteps/6) p.fill(white[0], white[1], white[2],p.map(d,0,gridStepSizeX*nSteps/6,255,255/2.5));
              else p.fill(white[0], white[1], white[2],255/2.5);
              //if (i%16 === 0) p.fill(white[0]/2, white[1]/2, white[2]/2);
              //else p.fill(white[0]/4, white[1]/4, white[2]/4);
              p.push();
              p.translate(0,0,-1);
              p.circle(xPos, yPos, 1, 1);
              p.pop();
          }
        }
      }

      //create notes
      if (this.octaveScroll.value !== 8) {
        const auxX = p.round((p.mouseX - gridInitX) / gridStepSizeX);
        let auxY = 0;

        if (this.name === "DRUMS") auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;
        else auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;

        if (auxX >= 0 && auxX < nSteps && auxY >= 0 && auxY < this.nPitches && dragging === false && menuOpened === false && session.loopDrawer === false && session.structDrawer === false) {
          if (this.isNote(auxX, auxY) === false) document.body.style.cursor = 'pointer';

          if (p.mouseIsPressed && this.draggingGrid === false && this.draggingSelect === false && this.isNote(auxX, auxY) === false) {
            dragging = true;

            if (p.mouseButton === p.LEFT) {
              this.lastGridX = auxX;
              this.lastGridY = auxY;
              this.draggingGrid = true;
              //console.log(auxX,auxY,this.tempNote);
              if (auxY>11) {
                this.tempNote = new Note(auxY-12, this.loopId, this.id, auxX, 1, this.octaveScroll.value+1, this.color);
                this.tempNote.y = gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
              } else {
                this.tempNote = new Note(auxY, this.loopId, this.id, auxX, 1, this.octaveScroll.value, this.color);
                this.tempNote.y = gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
              }
              this.tempNote.x = this.particlesX[this.tempNote.start+1];
              this.tempNote.playShort();
              //console.log(this.tempNote);
              //draw rectangle of selection
            } else if (p.mouseButton === p.RIGHT) {
              for(let n in this.notes) this.notes[n].selected = false;
              this.draggingSelect = true;
              selectX = p.mouseX;
              selectY = p.mouseY;
            }
          }   
        }
          
      if (p.mouseIsPressed === false && this.draggingGrid) {
          dragging = false;
          this.draggingGrid = false;
          this.ajustNotes(this.tempNote);
          this.notes.push(this.tempNote);
       } 
      
       if (p.mouseIsPressed === false && this.draggingSelect) {
          dragging = false;
          this.draggingSelect = false;
      }

      if (this.draggingGrid) {
        if (this.name === "DRUMS") this.tempNote.draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches- this.tempNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1));
        else {
          if (this.tempNote.octave === this.octaveScroll.value) this.tempNote.draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
          else if (this.tempNote.octave === this.octaveScroll.value+1) this.tempNote.draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);
        }

        if (auxX >= 0 && auxX <= nSteps) {
          if (this.lastGridX < auxX) this.tempNote.duration = auxX - this.lastGridX;
          else {
            this.tempNote.start = auxX;
            this.tempNote.duration = this.lastGridX - auxX + 1;
            this.tempNote.x = this.particlesX[this.tempNote.start+1];
          }
        }
        // this.tempNote.duration = auxX - this.lastGridX + 1; 

        this.tempNote.showInfo();
      } 

      if (this.draggingSelect) {
        document.body.style.cursor = 'grabbing';

        for (let n in this.notes) {
          if (this.notes[n].x > selectX && this.notes[n].x < p.mouseX && this.notes[n].y > selectY && this.notes[n].y < p.mouseY && p.mouseX > selectX && p.mouseY > selectY
            || this.notes[n].x > selectX && this.notes[n].x < p.mouseX && this.notes[n].y < selectY && this.notes[n].y > p.mouseY && p.mouseX > selectX && p.mouseY < selectY
            || this.notes[n].x < selectX && this.notes[n].x > p.mouseX && this.notes[n].y > selectY && this.notes[n].y < p.mouseY && p.mouseX < selectX && p.mouseY > selectY
            || this.notes[n].x < selectX && this.notes[n].x > p.mouseX && this.notes[n].y < selectY && this.notes[n].y > p.mouseY && p.mouseX < selectX && p.mouseY < selectY
          ) {
            if (this.notes[n].selected === false) {
              this.notes[n].playShort();
              this.notes[n].selected = true;
            }
          }  else this.notes[n].selected = false;
        }

        p.stroke(this.color[0],this.color[1],this.color[2], 255);
        p.fill(this.color[0],this.color[1],this.color[2], 255/6);
        let aux = p.mouseY-selectY;
        if (p.mouseY > gridInitY+11*gridStepSizeY + gridStepSizeY/4) aux = gridInitY+11*gridStepSizeY + gridStepSizeY/2-selectY;
        if (p.mouseY < gridInitY) aux = gridInitY- gridStepSizeY/2-selectY;
        p.rect(selectX, selectY, p.mouseX-selectX, aux);
      }

          /*if (p.mouseIsPressed) {

            if (this.isNote(auxX, auxY) === false) {
              let oct = -1;
              let pitch = auxY;
              if (pitch > 11) pitch = pitch - 12;
              if (this.name === "DRUMS") oct = 0;
              else if (auxY > 11) oct = this.octaveScroll.value+1;
              else oct = this.octaveScroll.value;
              this.notes.push(new Note(pitch, this.loopId, this.id, auxX, 1, oct , this.color));
              if (this.name === "DRUMS") {
                this.notes[this.notes.length-1].x = session.loops[this.loopId].particlesX[this.notes[this.notes.length-1].start+1];
                this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11)/(this.nPitches-1));
              }
              else {
                if (this.notes[i].octave === this.octaveScroll.value) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
                else if (this.notes[i].octave === this.octaveScroll.value+1) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);
              }
              this.notes[this.notes.length-1].playShort();
              p.mouseIsPressed = false;
            }
          }*/

      }
      
      this.octaveScroll.draw(p.windowWidth/4*2.8,p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2);
    }

    //check if there is a note in the same position
    isNote(x,y) {
      if (y > 11) y = y - 12;
      for (let i = 0; i < this.notes.length; i++) {
        if (this.notes[i].start <= x && this.notes[i].start+this.notes[i].duration > x && this.notes[i].pitch === y) return true;
      }
      return false;
    }

    deselectAllNotes() {
      for (let n in this.notes) this.notes[n].selected = false;
    }

    //get lower and higher notes, and left and right notes boundaries of selected notes
    getSelectionBoundaries() {
      let left = nSteps;
      let right = 0;
      let lower = 11;
      let higher = 0;
      for (let n in this.notes) {
        if (this.notes[n].selected) {
          if (this.notes[n].start < left) left = this.notes[n].start;
          if (this.notes[n].start+this.notes[n].duration > right) right = this.notes[n].start+this.notes[n].duration;
          if (this.notes[n].pitch < lower) lower = this.notes[n].pitch;
          if (this.notes[n].pitch > higher) higher = this.notes[n].pitch;
        }
      }
      return [left,right,lower,higher];
    }

    drawAutomation() {

      p.noFill();
      p.strokeWeight(maxWeightLines);
      if (this.knobs[this.automationScroll.value][1].automating) p.stroke(this.color[0],this.color[1],this.color[2],255/2);
      else p.stroke(white[0],white[1],white[2],255/8);
      //p.rect(gridInitX,gridInitY,gridStepSizeX*(nSteps-1),gridStepSizeY*(12-1),p.windowHeight/200);

      p.beginShape();
      for (let i = 0; i < nSteps; i++) {
        let aux = p.map(this.knobs[this.automationScroll.value][1].automation[i],0,1,gridInitY+gridStepSizeY*11,gridInitY);
        p.vertex(gridInitX+gridStepSizeX*i,aux);
      }
      p.vertex(gridInitX+gridStepSizeX*64,p.map(this.knobs[this.automationScroll.value][1].automation[0],0,1,gridInitY+gridStepSizeY*11,gridInitY));
      p.endShape();

      p.stroke(white[0], white[1], white[2],255/5);
      p.strokeWeight(1);
      p.line(p.windowWidth-gridInitX,gridInitY,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11));

      for (let i = 0; i < nSteps; i++) {
        if (i%16 === 0 || i%4 === 0) {
          p.strokeWeight(1);
          if (i%16 === 0) p.stroke(white[0], white[1], white[2],255/5);
          else p.stroke(white[0], white[1], white[2],255/8);
          p.line(gridInitX+gridStepSizeX*i,gridInitY,gridInitX+gridStepSizeX*i,gridInitY+gridStepSizeY*11);
        }
        let aux = p.map(this.knobs[this.automationScroll.value][1].automation[i],0,1,gridInitY+gridStepSizeY*11,gridInitY);
        if (this.knobs[this.automationScroll.value][1].automating) {
          if (i === session.activeTab.currentStep && session.activeTab.play) {
            p.fill(white[0], white[1], white[2]);
            p.circle(gridInitX+gridStepSizeX*i,aux,p.windowHeight/90);
          } else if (i === p.round((p.mouseX-gridInitX)/gridStepSizeX) && dragging === false && menuOpened === false) {
            p.fill(white[0], white[1], white[2],255/2);
            p.circle(gridInitX+gridStepSizeX*i,aux,p.windowHeight/90);
          }
          else {
            p.fill(this.color[0],this.color[1],this.color[2]);
            p.circle(gridInitX+gridStepSizeX*i,aux,5);
          }
        } else {
          if (i === p.round((p.mouseX-gridInitX)/gridStepSizeX)) {
            p.fill(white[0], white[1], white[2],255/2);
            p.circle(gridInitX+gridStepSizeX*i,aux,p.windowHeight/90);
          } else {
            p.fill(white[0],white[1],white[2],255/4);
            p.circle(gridInitX+gridStepSizeX*i,aux,5);
          }
        }
      }


      //param scroll
      this.automationScroll.draw(p.windowWidth/4*2.8,p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2);
      /*if (this.presetScroll.value !== this.preset) {
        this.preset = this.presetScroll.value;
        if (this.name === "DRUMS") this.switchPreset(synths.drumPresets[this.preset]);
        else this.switchPreset(synths.synthPresets[this.preset]);
      }*/

      if (p.mouseX >= gridInitX-gridStepSizeX/2 && p.mouseX < gridInitX + gridStepSizeX * (nSteps-1)+gridStepSizeX/2 && p.mouseY > gridInitY-gridStepSizeX && p.mouseY < gridInitY + (gridStepSizeY * 11)+gridStepSizeX && session.loopDrawer === false && session.structDrawer === false) {
        let posX = p.round((p.mouseX-gridInitX)/gridStepSizeX);
        let aux = p.map(this.knobs[this.automationScroll.value][1].automation[posX],0,1,gridInitY+(gridStepSizeY*11),gridInitY);

        if (this.opaInfoAutomation + 10 > 255) this.opaInfoAutomation = 255;
        else this.opaInfoAutomation += 10;

        if (dragging === false && menuOpened === false) {
          document.body.style.cursor = 'grab';
          //p.circle(gridInitX + posX*gridStepSizeX, aux, 5);
          if (p.mouseIsPressed) {
            this.draggingAutomation = true;
            dragging = true;
          }
        }
        //p.stroke(255,255,255,255/2);
        //p.strokeWeight(1);
        //p.line(gridInitX, this.mouseY, gridInitX + gridStepSizeX * nSteps, this.mouseY);
        //p.line(this.mouseX, gridInitY, this.mouseX, gridInitY + gridStepSizeY * this.nPitches);
        
        p.push();
        p.translate(0,0,p.windowHeight/30);
        if (this.knobs[this.automationScroll.value][1].automating) p.fill(white[0], white[1], white[2],this.opaInfoAutomation);
        else p.fill(white[0], white[1], white[2],this.opaInfoAutomation/2);

        let knob = this.knobs[this.automationScroll.value][1];
        let text = "";

        if (typeof knob.output === "string") text = knob.options[p.round(p.map(knob.automation[posX],0,1,0,knob.options.length-1))].toUpperCase();
        else if (knob.unit === "st") text = knob.options[p.round(p.map(knob.automation[posX],0,1,0,knob.options.length-1))]/100+knob.unit;
        else text = knob.options[p.round(p.map(knob.automation[posX],0,1,0,knob.options.length-1))]+knob.unit;

        //soften the y position with vector
        
        if (p.mouseX <= p.windowWidth / 2) {
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(p.windowHeight / 40);
          p.textFont(fontMedium);
          if (dragging) p.text(text,gridInitX+posX*gridStepSizeX+gridStepSizeX,p.mouseY-gridStepSizeX*1.4);
          else p.text(text,gridInitX+posX*gridStepSizeX+gridStepSizeX,aux - gridStepSizeX*1.4);
          p.textFont(fontLight);
          p.textSize(p.windowHeight / 65);
          if (dragging) p.text("STEP "+(posX+1), gridInitX+posX*gridStepSizeX+gridStepSizeX, p.mouseY-gridStepSizeX*1.4-p.windowHeight / 50);
          else p.text("STEP "+(posX+1), gridInitX+posX*gridStepSizeX+gridStepSizeX, aux-gridStepSizeX*1.4-p.windowHeight / 50);
        } else {

          p.textAlign(p.RIGHT, p.CENTER);
          p.textSize(p.windowHeight / 40);
          p.textFont(fontMedium);
          if (dragging) p.text(text,gridInitX+posX*gridStepSizeX-gridStepSizeX,p.mouseY-gridStepSizeX*1.4);
          else p.text(text,gridInitX+posX*gridStepSizeX-gridStepSizeX,aux - gridStepSizeX*1.4);
          p.textFont(fontLight);
          p.textSize(p.windowHeight / 65);
          if (dragging) p.text("STEP "+(posX+1), gridInitX+posX*gridStepSizeX-gridStepSizeX, p.mouseY-gridStepSizeX*1.4-p.windowHeight / 50);
          else p.text("STEP "+(posX+1), gridInitX+posX*gridStepSizeX-gridStepSizeX, aux-gridStepSizeX*1.4-p.windowHeight / 50);
        }
        p.pop();

      } else this.opaInfoAutomation = 0;
      
      if (p.mouseIsPressed === false && this.draggingAutomation) {
        this.draggingAutomation = false;
        dragging = false;
      }

      if (this.draggingAutomation) {
        document.body.style.cursor = 'grabbing';
        let posX = p.round((p.mouseX-gridInitX)/gridStepSizeX);
        if (this.knobs[this.automationScroll.value][1].automating === false) this.knobs[this.automationScroll.value][1].automating = true;
        this.knobs[this.automationScroll.value][1].automation[posX] = p.map(p.mouseY,gridInitY+(gridStepSizeY*11),gridInitY,0,1);
        if (this.knobs[this.automationScroll.value][1].automation[posX] < 0) this.knobs[this.automationScroll.value][1].automation[posX] = 0;
        if (this.knobs[this.automationScroll.value][1].automation[posX] > 1) this.knobs[this.automationScroll.value][1].automation[posX] = 1;
      }
    }

    drawStudio() {
      let studioGap = p.windowWidth/150;

      let auxY = (gridStepSizeY*(12-1) - studioGap*2) / 3;
      let col1X = studioGap+p.windowWidth/9;
      let auxX = gridStepSizeX*(nSteps)-col1X;
      let auxXfx = (auxX-studioGap*6)/7;

      let barLeftHeight = 0;
      let barRightHeight = 0;
      let dbs = [this.synth.fxChain.left.getValue(),this.synth.fxChain.right.getValue()];
      if (dbs[0] < -60) dbs[0] = -60;
      if (dbs[1] < -60) dbs[1] = -60;
      
      //barLeftHeight = p.map(dbs[0],-60,0,0, -(gridStepSizeY*(11) - studioGap - auxY-13*studioGap));
      //barRightHeight = p.map(dbs[1],-60,0,0, -(gridStepSizeY*(11) - studioGap - auxY-13*studioGap));
      barLeftHeight = p.map(dbs[0],-60,0,0, this.volumeY-(gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap));
      barRightHeight = p.map(dbs[1],-60,0,0, this.volumeY-(gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap));
      //this.hoverVolume = false;
      //this.draggingVolume = false;
      //this.volumeY = 0;

      p.noStroke();
      p.fill(this.color[0],this.color[1],this.color[2]);
      p.rect(gridInitX + p.windowWidth/9/2 - studioGap/2-studioGap*2,gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap,studioGap*2,barLeftHeight);
      p.rect(gridInitX + p.windowWidth/9/2 + studioGap/2,gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap,studioGap*2,barRightHeight);

      //preset scroll
      this.presetScroll.draw(p.windowWidth/4*2.8,p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2);
      if (this.presetScroll.value !== this.preset) {
        this.preset = this.presetScroll.value;
        if (this.name === "DRUMS") this.switchPreset(synths.drumPresets[this.preset]);
        else this.switchPreset(synths.synthPresets[this.preset]);
      }

      //p.stroke(255);
      p.strokeWeight(1);
      //p.fill(0);

      p.stroke(white[0], white[1], white[2],255/4);
      p.noFill();

      //volume fader
      p.rect(gridInitX + p.windowWidth/9/2 - studioGap/2-studioGap*2,gridInitY+studioGap + auxY +5*studioGap,studioGap*2, gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap); //volume fader
      p.rect(gridInitX + p.windowWidth/9/2 + studioGap/2,gridInitY+studioGap + auxY +5*studioGap,studioGap*2, gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap); //volume fader
      
      p.fill(white[0], white[1], white[2]);
      
      let gainTodB = p.map(this.gain,0,1,-48,0);
      gainTodB = Math.round(gainTodB*10)/10;

      p.textSize(p.windowHeight/55);
      p.textAlign(p.CENTER,p.TOP);
      if (gainTodB === -48) p.text("-Inf",gridInitX+p.windowWidth/9/2,gridInitY+studioGap*2.7+auxY*2+auxY/2+p.windowHeight/15/1.7);
      else if (gainTodB%1 === 0) p.text(gainTodB+".0dB",gridInitX+p.windowWidth/9/2,gridInitY+studioGap*2.7+auxY*2+auxY/2+p.windowHeight/15/1.7);
      else p.text(gainTodB+"dB",gridInitX+p.windowWidth/9/2,gridInitY+studioGap*2.7+auxY*2+auxY/2+p.windowHeight/15/1.7);
      
      this.volumeYmax = gridInitY+studioGap + auxY +5*studioGap;
      this.volumeYmin = gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap;
      this.volumeY = p.map(this.gain,1,0,this.volumeYmax,this.volumeYmin);

      p.rect(gridInitX + p.windowWidth/9/2 - studioGap/2 -studioGap*2,this.volumeY,studioGap*5, p.windowHeight/250);
      p.noFill();

      if (p.mouseX > gridInitX + p.windowWidth/9/2 - studioGap/2 - studioGap*2 && p.mouseX < gridInitX + p.windowWidth/9/2 - studioGap/2 -studioGap*2 + studioGap*5 
      && p.mouseY > this.volumeYmax && p.mouseY < this.volumeYmin && dragging === false && menuOpened === false) {
        document.body.style.cursor = 'grab';
        this.hoverVolume = true;
        
        if (p.mouseIsPressed) {
          this.draggingVolume = true;
          dragging = true;
        }
      } else this.hoverVolume = false;


      if (p.mouseIsPressed === false && this.draggingVolume) {
        this.draggingVolume = false;
        dragging = false;
      }

      if (this.draggingVolume) {
        document.body.style.cursor = 'grabbing';
        this.gain = p.map(p.mouseY,this.volumeYmax,this.volumeYmin,1,0);
        if (this.gain > 1) this.gain = 1;
        if (this.gain < 0) this.gain = 0;
      }

      //boxes
      p.rect(gridInitX,gridInitY, p.windowWidth/9, auxY, p.windowHeight/200); //visualizer
      p.rect(gridInitX,gridInitY+studioGap + auxY,p.windowWidth/9, gridStepSizeY*(12-1) - studioGap - auxY,p.windowHeight/200); //volume fader
      p.rect(gridInitX+col1X,gridInitY+studioGap*2+auxY*2,auxXfx,auxY,p.windowHeight/200); //filter
      p.rect(gridInitX+col1X+auxXfx+studioGap,gridInitY+studioGap*2+auxY*2,auxXfx,auxY,p.windowHeight/200); //distortion
      p.rect(gridInitX+col1X+auxXfx*2+studioGap*2,gridInitY+studioGap*2+auxY*2,auxXfx*3+studioGap*2,auxY,p.windowHeight/200); //delay
      p.rect(gridInitX+col1X+auxXfx*5+studioGap*5,gridInitY+studioGap*2+auxY*2,auxXfx*2+studioGap,auxY,p.windowHeight/200); //reverb

      if (this.name === "DRUMS") {
        for(let i=0; i<this.drumKnobs.length; i++) p.rect(gridInitX+col1X+(i*auxXfx)+i*studioGap,gridInitY, auxXfx ,auxY*2 + studioGap,p.windowHeight/200);
      } else {
        p.rect(gridInitX+col1X,gridInitY, auxXfx*3 + studioGap*2,auxY,p.windowHeight/200); //oscillator 1
        p.rect(gridInitX+col1X,gridInitY+auxY+studioGap, auxXfx*3 + studioGap*2,auxY,p.windowHeight/200); //oscillator 2
        p.rect(gridInitX+col1X + auxXfx*3 + studioGap*3, gridInitY, auxXfx*4 + studioGap*3,auxY,p.windowHeight/200); //envelope 1
        p.rect(gridInitX+col1X + auxXfx*3 + studioGap*3, gridInitY+auxY+studioGap, auxXfx*4 + studioGap*3,auxY,p.windowHeight/200); //envelope 2
      }

      //petal visualizer

      p.push();
      p.noStroke();
      p.fill(this.color[0], this.color[1], this.color[2], this.opaLine);
      p.translate(gridInitX+p.windowWidth/9/2, gridInitY+auxY/2,-p.windowHeight/12);
      p.scale(p.windowHeight/12 / petalModelSize);
      p.rotateX(p.PI/2);
      p.rotateY(this.ang);
      p.rotateZ(p.sin(this.ang)*p.PI/3);
      p.model(this.petal);
      p.pop();

      //boxes labels

      p.fill(this.color[0],this.color[1],this.color[2]);
      p.noStroke();
      p.textAlign(p.LEFT,p.TOP);
      p.textSize(p.windowHeight/60);

      p.text("VOLUME",gridInitX+studioGap*1.2,gridInitY+auxY+studioGap*2);
      p.fill(this.color[0],this.color[1],this.color[2],this.filterButton.opa);
      p.text("FILTER",gridInitX+col1X+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      p.fill(this.color[0],this.color[1],this.color[2],this.distButton.opa);
      p.text("DISTORTION",gridInitX+col1X+auxXfx+studioGap+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      p.fill(this.color[0],this.color[1],this.color[2],this.dlyButton.opa);
      p.text("DELAY",gridInitX+col1X+auxXfx*2+studioGap*2+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      p.fill(this.color[0],this.color[1],this.color[2],this.revButton.opa);
      p.text("REVERB",gridInitX+col1X+auxXfx*5+studioGap*5+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      
      if (this.name === "DRUMS") {
        for(let i=0; i<this.drumKnobs.length; i++) {
          p.fill(this.color[0],this.color[1],this.color[2],this.drumButtons[i].opa);
          p.text(theory.drumLabels[i],gridInitX+col1X+studioGap*1.2+(i*auxXfx)+i*studioGap,gridInitY+studioGap);
        }
      } else {
        p.fill(this.color[0],this.color[1],this.color[2],this.oscButtons[0].opa);
        p.text("OSCILLATOR 1",gridInitX+col1X+studioGap*1.2,gridInitY+studioGap);
        p.fill(this.color[0],this.color[1],this.color[2],this.oscButtons[1].opa);
        p.text("OSCILLATOR 2",gridInitX+col1X+studioGap*1.2,gridInitY+auxY+studioGap*2);
        p.fill(this.color[0],this.color[1],this.color[2],this.envButtons[0].opa);
        p.text("ENVELOPE 1",gridInitX+col1X+auxXfx*3+studioGap*3+studioGap*1.2,gridInitY+studioGap);
        p.fill(this.color[0],this.color[1],this.color[2],this.envButtons[1].opa);
        p.text("ENVELOPE 2",gridInitX+col1X+auxXfx*3+studioGap*3+studioGap*1.2,gridInitY+auxY+studioGap*2);
      }

      //knobs and buttons

      this.filterKnob.draw(gridInitX+col1X+auxXfx/2,gridInitY+studioGap*2.7+auxY*2+auxY/2,this.filterButton.opa);
      this.filterButton.draw(gridInitX+col1X+auxXfx-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      this.distKnob.draw(gridInitX+col1X+auxXfx/2+auxXfx+studioGap,gridInitY+studioGap*2.7+auxY*2+auxY/2,this.distButton.opa);
      this.distButton.draw(gridInitX+col1X+auxXfx*2+studioGap-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      for (let i=0; i<3; i++) this.dlyKnobs[i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i+2)+studioGap*(i+2),gridInitY+studioGap*2.7+auxY*2+auxY/2,this.dlyButton.opa);
      this.dlyButton.draw(gridInitX+col1X+auxXfx*5+studioGap*4-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      for (let i=0; i<2; i++) this.revKnobs[i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(3+i+2)+studioGap*(3+i+2),gridInitY+studioGap*2.7+auxY*2+auxY/2,this.revButton.opa);
      this.revButton.draw(gridInitX+col1X+auxXfx*7+studioGap*6-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      if (this.name === "DRUMS") {
        for(let i=0; i<this.drumKnobs.length; i++) {
          this.drumKnobs[i][0].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+studioGap*1.5+auxY/2,this.drumButtons[i].opa);
          this.drumKnobs[i][1].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),studioGap+gridInitY-studioGap*2+auxY+auxY/2,this.drumButtons[i].opa);
          this.drumButtons[i].draw(gridInitX+col1X+auxXfx*(i+1)+studioGap*(i)-studioGap*2,gridInitY+studioGap*2);

          p.rect(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+auxY*2-studioGap*2);
        }
      } else {
        for (let i=0; i<3; i++) this.oscKnobs[0][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+studioGap*0.7+auxY/2, this.oscButtons[0].opa);
        this.oscButtons[0].draw(gridInitX+col1X+auxXfx*3+studioGap*2-studioGap*2,gridInitY+studioGap*2);
        for (let i=0; i<4; i++) this.envKnobs[0][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i+3)+studioGap*(i+3),gridInitY+studioGap*0.7+auxY/2, this.envButtons[0].opa);
        this.envButtons[0].draw(gridInitX+col1X+auxXfx*7+studioGap*6-studioGap*2,gridInitY+studioGap*2);
        for (let i=0; i<3; i++) this.oscKnobs[1][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+studioGap*1.7+auxY+auxY/2, this.oscButtons[1].opa);
        this.oscButtons[1].draw(gridInitX+col1X+auxXfx*3+studioGap*2-studioGap*2,gridInitY+studioGap+auxY+studioGap*2);
        for (let i=0; i<4; i++) this.envKnobs[1][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i+3)+studioGap*(i+3),gridInitY+studioGap*1.7+auxY+auxY/2, this.envButtons[1].opa);
        this.envButtons[1].draw(gridInitX+col1X+auxXfx*7+studioGap*6-studioGap*2,gridInitY+studioGap+auxY+studioGap*2);
      }

      //this.updateSynthValues();
    }

    drawPreview() {

      this.x = p.windowWidth / 2 + p.windowWidth/8;
      this.y = p.windowHeight / 2;
      this.radiusCol = p.windowHeight / 5;

      p.noFill();
      p.stroke(white[0], white[1], white[2],previewOpa);
      p.strokeWeight(maxWeightLines / (this.id + 1));

      p.push();
      p.translate(0, 0, 2);
      p.beginShape();

      let fadeLength = 6; // Length of the fade
      let shapeLength = this.particlesPreviewX.length-1;
      let currentStep = (session.loops[this.loopId].currentStep - 1 + shapeLength) % shapeLength; // One step behind

      for (let i = 0; i < shapeLength; i++) {
        // Calculate the difference to currentStep considering wrap-around
        let dif = Math.min(
          Math.abs(currentStep - i),
          Math.abs(currentStep - (i + shapeLength)),
          Math.abs(currentStep - (i - shapeLength))
        );

        if (dif > fadeLength) dif = fadeLength;

        // Calculate the opacity based on dif and apply a smooth transition
        let opacity = previewOpa * (fadeLength - dif) / fadeLength;

        if (opacity < previewOpa/6) opacity = previewOpa/6;

        p.stroke(white[0], white[1], white[2], opacity);

        // Use modulo for indices to handle wrap-around
        let index = (shapeLength - i + shapeLength) % shapeLength;
        p.vertex(this.particlesPreviewX[index], this.particlesPreviewY[index]);
      }

      p.endShape(p.CLOSE);
      p.pop();

      let angle = -p.PI / 2;
      let angles = [];
      angles.push(angle);

      for (let i = 0; i < this.targetXpreview.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, this.radiusCol/2.5);

        this.targetXpreview[i] = this.x + p5.Vector.fromAngle(angle, this.radiusCol + r).x;
        this.targetYpreview[i] = this.y + p5.Vector.fromAngle(p.PI - angle, this.radiusCol + r).y;

        angle -= p.TWO_PI / this.targetXpreview.length + p.TWO_PI / this.targetXpreview.length / this.targetXpreview.length;
        angles.push(angle);
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesPreviewX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesPreviewX[i] - this.targetXpreview[i], this.particlesPreviewY[i] - this.targetYpreview[i]));
        let d = p.dist(this.particlesPreviewX[i], this.particlesPreviewY[i], this.targetXpreview[i], this.targetYpreview[i]);

        this.particlesPreviewX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesPreviewY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }

      for (let i = 0; i<this.notes.length; i++) {
        this.notes[i].drawCollapsed(angles,this.particlesPreviewX[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/50).x,this.particlesPreviewY[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(p.PI - angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/50).y);
      }

      //prevent param updating when not needed
      if (session.activeTab === null) {
        this.updateSynthParams();
        for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
      } 
      else if (session.activeTab.selectedTrack !== null) {
        if (session.activeTab.selectedTrack === this){
          this.updateSynthParams();
          for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
        }
      }
    }

    drawInDrawer(x, y, radius) {

      p.noFill();
      if(session.loops[this.loopId].hover === true) p.stroke(white[0], white[1], white[2]);
      else p.stroke(white[0], white[1], white[2],255/3);
      p.strokeWeight(maxWeightLines / (this.id + 1));

      p.push();
      p.translate(0,0,2);
      p.beginShape();
      for (let i = 0; i < this.particlesDrawerX.length; i++) if(i%8 !== 0) p.vertex(this.particlesDrawerX[i], this.particlesDrawerY[i]);
      p.endShape(p.CLOSE);
      p.pop();
      //p.circle(x, y, radius);

      let angle = -p.PI / 2;

      for (let i = 0; i < this.targetXdrawer.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/3);
        phase += 0.000006;
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

      for (let i = 0; i<this.notes.length; i++) {
        this.notes[i].drawCollapsedDrawer(this.particlesDrawerX[nSteps-this.notes[i].start+1],this.particlesDrawerY[nSteps-this.notes[i].start+1]);
      }
    }

    /*drawInStructure(loop, x, y, radius) {
        p.noFill();
        //if(session.loops[this.loopId].hover === true) p.stroke(white[0], white[1], white[2]);
        //else p.stroke(white[0], white[1], white[2],255/3);
        p.stroke(white[0], white[1], white[2],255);
        p.strokeWeight(maxWeightLines / (this.id + 1));

        //p.circle(x, y, radius);
        //p.push();
        //p.translate(0,0,2);
        p.beginShape();
        for (let i = 0; i < this.particlesStructX.length; i++) p.vertex(this.particlesStructX[i], this.particlesStructY[i]);
        p.endShape(p.CLOSE);
        //p.pop();
        //p.circle(x, y, radius);
  
        let angle = -p.PI / 2;
  
        for (let i = 0; i < this.targetXstruct.length; i++) {
  
          let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
          let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
          let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/3);
          phase += 0.000006;
          zoff += 0.000002;
  
          this.targetXstruct[i] = x + p5.Vector.fromAngle(angle, radius + r).x;
          this.targetYstruct[i] = y + p5.Vector.fromAngle(p.PI - angle, radius + r).y;
  
          angle -= p.TWO_PI / this.targetXstruct.length + p.TWO_PI / this.targetXstruct.length / this.targetXstruct.length;
        }
  
        //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);
  
        for (let i = 0; i < this.particlesStructX.length; i++) {
          let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesStructX[i] - this.targetXstruct[i], this.particlesStructY[i] - this.targetYstruct[i]));
          let d = p.dist(this.particlesStructX[i], this.particlesStructY[i], this.targetXstruct[i], this.targetYstruct[i]);
  
          this.particlesStructX[i] -= p5.Vector.fromAngle(a, d / 6).y;
          this.particlesStructY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
        }
  
        for (let i = 0; i<this.notes.length; i++) {
          this.notes[i].drawCollapsedDrawer(this.particlesDrawerX[nSteps-this.notes[i].start+1],this.particlesDrawerY[nSteps-this.notes[i].start+1]);
        }
      }  */
    

    drawInStructure(loop, x, y, radius) {

      //this.radiusCol = p.windowHeight / 4;

      p.noFill();
      p.strokeWeight(maxWeightLines / (this.id + 1));

      //p.push();
      //p.translate(0, 0, 2);
      p.beginShape();
      let opacity = 255/5;

      let fadeLength = 6; // Length of the fade
      let shapeLength = this.particlesStructX.length-1;
      let currentStep = (loop.currentStep - 1 + shapeLength) % shapeLength; // One step behind

      for (let i = 0; i < shapeLength; i++) {
        // Calculate the difference to currentStep considering wrap-around
        if (loop.playing) {
          let dif = Math.min(
            Math.abs(currentStep - i),
            Math.abs(currentStep - (i + shapeLength)),
            Math.abs(currentStep - (i - shapeLength))
          );

          if (dif > fadeLength) dif = fadeLength;

          // Calculate the opacity based on dif and apply a smooth transition
          opacity = 255* (fadeLength - dif) / fadeLength;

          if (opacity < 255/6) opacity = 225/6;
        }

        p.stroke(white[0], white[1], white[2], opacity);

        // Use modulo for indices to handle wrap-around
        let index = (shapeLength - i + shapeLength) % shapeLength;
        p.vertex( this.particlesStructX[i],  this.particlesStructY[i]);
      }

      p.endShape(p.CLOSE);
      //p.pop();

      let angle = -p.PI / 2;
      let angles = [];
      angles.push(angle);

      for (let i = 0; i < this.targetXstruct.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/2.5);

        if (session.loopDrawer === false && session.structDrawer === false) {
          phase += 0.00001;
          zoff += 0.000004;
        }

        this.targetXstruct[i] = x + p5.Vector.fromAngle(angle, radius + r).x;
        this.targetYstruct[i] = y + p5.Vector.fromAngle(p.PI - angle, radius + r).y;

        angle -= p.TWO_PI / this.targetXstruct.length + p.TWO_PI / this.targetXstruct.length / this.targetXstruct.length;
        angles.push(angle);
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesStructX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesStructX[i] - this.targetXstruct[i], this.particlesStructY[i] - this.targetYstruct[i]));
        let d = p.dist(this.particlesStructX[i], this.particlesStructY[i], this.targetXstruct[i], this.targetYstruct[i]);

        this.particlesStructX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesStructY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }

      for (let i = 0; i<this.notes.length; i++) {
        this.notes[i].drawCollapsed(angles,this.particlesStructX[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/50).x,this.particlesStructY[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(p.PI - angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/50).y);
      }
/*
      //prevent param updating when not needed
      if (session.activeTab === null) {
        this.updateSynthParams();
        for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
      } 
      else if (session.activeTab.selectedTrack !== null) {
        if (session.activeTab.selectedTrack === this){
          this.updateSynthParams();
          for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
        }
      }*/
    }

    switchPreset(preset) {
      if (this.name === "DRUMS") {
        
        for (let i=0; i<this.synth.parts.length; i++) {
          //console.log(preset);
          this.synth.parts[i].load(preset.kit[i]);
          this.drumButtons[i].state = preset.partState[i];
          this.drumKnobs[i][0].value = preset.partVol[i];
          this.drumKnobs[i][1].value = preset.partPitch[i];
        }
      }
      else {
        for (let i=0; i<this.synth.oscillators.length; i++) {
          this.oscButtons[i].state = preset.oscState[i];
          for (let j=0; j<preset.osc[i].length; j++) this.oscKnobs[i][j].value = preset.osc[i][j];
          this.envButtons[i].state = preset.envState[i];
          for (let j=0; j<preset.env[i].length; j++) this.envKnobs[i][j].value = preset.env[i][j];
        }
      }

      this.filterButton.state = preset.filterState;
      this.filterKnob.value = preset.filter;
      this.distButton.state = preset.distortionState;
      this.distKnob.value = preset.distortion;
      this.dlyButton.state = preset.delayState;
      for (let i=0; i<preset.delay.length; i++) this.dlyKnobs[i].value = preset.delay[i];
      this.revButton.state = preset.reverbState;
      for (let i=0; i<preset.reverb.length; i++) this.revKnobs[i].value = preset.reverb[i];
    }
    

    updateSynthParams() {

      if (this.synth.fxChain.gain.gain.value !== this.gain) this.synth.fxChain.gain.gain.value = this.gain;

      if (this.name === "DRUMS") {
        for (let i=0; i<this.synth.parts.length; i++) {
          let mapping = p.map(this.drumKnobs[i][0].value,0,1,-50,0);
          if (this.drumButtons[i].state) {
            if (this.synth.parts[i].volume.value !== mapping) {
              if (this.drumKnobs[i][0].value === 0) this.synth.parts[i].volume.value = -Infinity;
              else this.synth.parts[i].volume.value = mapping;
            }
          } else if (this.synth.parts[i].volume.value !== -Infinity) this.synth.parts[i].volume.value = -Infinity;

          mapping = p.map(this.drumKnobs[i][1].output/100,-12,12,0.02,2);
          if (this.synth.parts[i].playbackRate !== mapping) this.synth.parts[i].playbackRate = mapping;
        }
      }
      else {
        let oscInfo = [];
        oscInfo.push(this.synth.oscillators[0].get());
        oscInfo.push(this.synth.oscillators[1].get());
        //console.log(oscInfo);

        for (let i=0; i<2; i++) {
          if (this.oscButtons[i].state) {
            if (oscInfo[i].oscillator.type !== this.oscKnobs[i][0].output.toLowerCase()) this.synth.oscillators[i].set({oscillator: {type: this.oscKnobs[i][0].output.toLowerCase()}});
            if (oscInfo[i].detune !== this.oscKnobs[i][1].output) this.synth.oscillators[i].set({detune: this.oscKnobs[i][1].output});
            if (oscInfo[i].volume !== p.map(this.oscKnobs[i][2].output,0,1,-50,0)) this.synth.oscillators[i].set({volume: p.map(this.oscKnobs[i][2].output,0,1,-50,0)});
          }
          else if (oscInfo[i].volume !== -Infinity) this.synth.oscillators[i].set({volume: -Infinity});

          if (this.envButtons[i].state) {
            if (oscInfo[i].envelope.attack !== this.envKnobs[i][0].output) this.synth.oscillators[i].set({envelope: {attack: this.envKnobs[i][0].output}});
            if (oscInfo[i].envelope.decay !== this.envKnobs[i][1].output) this.synth.oscillators[i].set({envelope: {decay: this.envKnobs[i][1].output}});
            if (oscInfo[i].envelope.sustain !== this.envKnobs[i][2].output) this.synth.oscillators[i].set({envelope: {sustain: this.envKnobs[i][2].output}});
            if (oscInfo[i].envelope.release !== this.envKnobs[i][3].output) this.synth.oscillators[i].set({envelope: {release: this.envKnobs[i][3].output}});
          }
          else this.synth.oscillators[i].set({envelope: {attack: 0, decay: 0, sustain: 1, release: 0}});
        }
      }

      if (this.filterButton.state) {
        let mapping = p.map(this.filterKnob.output,0,1,100,10000);

        if (this.synth.fxChain.filter.frequency !== mapping) this.synth.fxChain.filter.frequency.value = mapping;

      } else if (this.synth.fxChain.filter.frequency) {
        this.synth.fxChain.filter.frequency.value = 20000;
      }

      if (this.distButton.state) {
        if (this.synth.fxChain.distortion.wet !== 0.5) this.synth.fxChain.distortion.wet.value = 0.5;
        if (this.synth.fxChain.distortion.distortion !== this.distKnob.value) this.synth.fxChain.distortion.distortion = this.distKnob.value;
      }
      else if (this.synth.fxChain.distortion.wet !== 0) {
        this.synth.fxChain.distortion.wet.value = 0;
        this.synth.fxChain.distortion.distortion = 0;
      }

      if (this.dlyButton.state) {
        //let dTime = session.loops[this.loopId].timeBtwSteps*(p.round(p.map(this.dlyKnobs[0].value,0,1,0,theory.delayTimes.length-1)));
        let dTime = this.dlyKnobs[0].output.split("/")[1]+"n";
        if (this.synth.fxChain.delay.delayTime !== dTime) this.synth.fxChain.delay.delayTime.value = dTime;

        if (this.synth.fxChain.delay.feedback !== this.dlyKnobs[1].value) this.synth.fxChain.delay.feedback.value = this.dlyKnobs[1].value;
        if (this.synth.fxChain.delay.wet !== this.dlyKnobs[2].value) this.synth.fxChain.delay.wet.value = this.dlyKnobs[2].value;
      }
      else if (this.synth.fxChain.delay.wet !== 0) {
        this.synth.fxChain.delay.wet.value = 0;
        this.synth.fxChain.delay.feedback.value = 0;
      }
      

      if (this.revButton.state) {
        if (this.synth.fxChain.reverb.decay !== this.revKnobs[0].output) this.synth.fxChain.reverb.decay = this.revKnobs[0].output;
        if (this.synth.fxChain.reverb.wet !== this.revKnobs[1].output) this.synth.fxChain.reverb.wet.value = this.revKnobs[1].output;
      }
      else {
        if (this.synth.fxChain.reverb.wet !== 0) {
          this.synth.fxChain.reverb.wet.value = 0;
          this.synth.fxChain.reverb.decay = 0.01;
        }
      } 
    } 


    draw() {
      this.updateSynthParams();
      for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId]);

      if (session.activeTab.selectedTrack !== null && session.activeTab.selectedTrack !== this) {
        if (this.opaLine - this.opaLineInc < 255/4) this.opaLine = 255/4;
        else this.opaLine -= this.opaLineInc;
      } else {
        if (this.opaLine + this.opaLineInc > 255) this.opaLine = 255;
        else this.opaLine += this.opaLineInc;
      }

      if (session.activeTab.selectedTrack === null) {
        p.noFill();
        //p.ambientMaterial(255, 0, 0);
        p.stroke(white[0], white[1], white[2], this.opaLine);
        p.strokeWeight(maxWeightLines / (this.id + 1));
        //p.strokeWeight(maxWeightLines);

        p.beginShape();
        for (let i = 0; i < this.particlesX.length; i++) {
          //let dif = session.loops[this.loopId].currentStep - i;
          //let aux = p.map(dif, -session.loops[this.loopId].nSteps, session.loops[this.loopId].nSteps, 0, 255);
          //p.stroke(255, 255, 255,aux);
          let dif = p.abs(session.activeTab.currentStep-i);
          if (session.activeTab.play === false) dif = 6;
          else if (dif > 6) dif = 6;
          p.stroke(white[0], white[1], white[2], this.opaLine/dif);
          p.vertex(this.particlesX[i], this.particlesY[i],-p.windowHeight/50*(maxTracks+2));
        }
        p.endShape();
      }

      //p.stroke(255, 0, 0);

      let n = p.noise(0, this.id * 0.3, p.frameCount * 0.002);
      let y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
      this.targetXexp[0] = 0;
      this.targetYexp[0] = p.windowHeight / 2 + y;

      let index = 1;

      //error with (nSteps-1) instead of nSteps
      for (let x = gridInitX; x <= gridInitX + (gridStepSizeX * nSteps); x += gridStepSizeX) {
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
      p.noStroke();
      p.textFont(fontLight);
      p.fill(white[0], white[1], white[2], this.opaLine);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(p.windowHeight / 65);

      p.push();
      if (this.menu.state >= 0) p.translate(0,0, p.windowHeight / 30*2);
      p.text(this.name, this.iconX + iconSize / 2, p.windowHeight - marginX);
      p.pop();

      if (this.id%2 === 0) this.ang += this.angInc;
      else this.ang -= this.angInc;

      //p.fill(this.color[0], this.color[1], this.color[2], this.opaIcon);
      p.fill(this.color[0], this.color[1], this.color[2], this.opaLine);
      p.push();
      if (this.menu.state >= 0) p.translate(0,0, p.windowHeight / 30*2);
      p.translate(this.iconX + iconSize / 2, p.windowHeight - marginX -p.windowHeight / 40 - p.windowHeight/30,-p.windowHeight/30);
      p.scale(p.windowHeight/30 / petalModelSize);
      p.rotateX(p.PI/2);
      p.rotateY(this.ang);
      p.rotateZ(p.sin(this.ang)*p.PI/3);
      p.model(this.petal);
      p.pop();

      //hover and track select
      if (p.mouseX > this.iconX && p.mouseX < this.iconX+p.windowHeight/30*2 && p.mouseY > p.windowHeight - marginX -p.windowHeight / 45 - p.windowHeight/30*2 && p.mouseY < p.windowHeight - marginX -p.windowHeight / 45 && dragging === false && menuOpened === false) {
        document.body.style.cursor = 'pointer';
        if (this.iconHover === false) this.angInc = p.PI / 20;
        this.iconHover = true;
        
        if (p.mouseIsPressed) {
          if (session.activeTab.selectedTrack !== this) {
            if (session.activeTab.selectedTrack === null) session.loops[this.loopId].blackOpa1 = 255;
            session.loops[this.loopId].blackOpa2 = 255;
            session.loops[this.loopId].blackOpa3 = 255;
            session.activeTab.selectedTrack = this;
          } else this.menu.open();
          p.mouseIsPressed = false;

        }
      }
      else this.iconHover = false;

      if (this.angInc > p.PI / 400) this.angInc -= 0.002;
      
      /*p.strokeWeight(1);
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
      p.text(this.name, this.iconX + iconSize / 2, this.iconY + iconSize - iconSize / 5);*/
    }

    drawNotes() {
      for (let i = 0; i < this.notes.length; i++) {
        if (session.activeTab.selectedTrack !== null) {
          if (this.name === "DRUMS") this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11)/(this.nPitches-1));
          else {
            if (this.notes[i].octave === this.octaveScroll.value) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
            else if (this.notes[i].octave === this.octaveScroll.value+1) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);
          }
        }
        else {
          this.notes[i].draw(this.particlesX[this.notes[i].start+1], this.particlesY[this.notes[i].start+1]);
        }
      }

      //loop ends and recorded notes are pending
      if (session.loops[this.loopId].currentStep === nSteps-1) {
        if (recordedNotes.length !== 0) {
          for (let i = 0; i < recordedNotes.length; i++) {
            if (recordedNotes[i].trackId === this.id) {
              recordedNotes[i].duration = session.loops[this.loopId].currentStep - recordedNotes[i].start+1;
              if (recordedNotes[i].duration === 0) recordedNotes[i].duration = 1;
              this.ajustNotes(recordedNotes[i]);
              this.notes.push(recordedNotes[i]);
              recordedNotes.splice(i,1);
              i--;
            }
          }
        }
      } 

      //draw recording notes
      for (let i = 0; i < recordedNotes.length; i++) {
        if (recordedNotes[i].trackId === this.id) {
          recordedNotes[i].x = this.particlesX[recordedNotes[i].start+1];

          recordedNotes[i].duration = session.loops[this.loopId].currentStep - recordedNotes[i].start;
          
          if (recordedNotes[i].octave === this.octaveScroll.value) recordedNotes[i].y = gridInitY + (this.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1));
          else if (recordedNotes[i].octave === this.octaveScroll.value+1) recordedNotes[i].y = gridInitY + (this.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4;
      
          recordedNotes[i].draw(this.particlesX[recordedNotes[i].start+1], recordedNotes[i].y);
          if (session.loops[this.loopId].currentStep >= recordedNotes[i].start && session.loops[this.loopId].currentStep <= recordedNotes[i].start+recordedNotes[i].duration) recordedNotes[i].spawnParticles(gridInitX+session.loops[this.loopId].currentStep*gridStepSizeX, recordedNotes[i].y);
        }
      }
    }
  }

  class Note {

    constructor(pitch, loopId, trackId, start, duration, octave, color) {
      this.start = start;
      this.duration = duration;

      this.octave = octave;

      this.hover = false;
      this.dragging = false;
      this.selected = false;
      this.offsetDrag = 0;

      //this.pitch = theory.freqs[p.floor(p.random(0, theory.freqs.length))]*8;
      this.pitch = pitch;

      this.colorOrig = color;
      this.color = color;

      this.loopId = loopId;
      this.trackId = trackId;

      this.size = p.windowHeight / 60;

      this.x = p.random(0, p.windowWidth);
      this.y = p.random(0, p.windowHeight);

      this.opa = 255;
      this.opaInc = 10;

      this.opaInfo = 0;

      this.animOpa = 0;
      this.animR = 0;
      this.animOpaInc = 10;
      this.animRInc = p.windowHeight / 400;

      this.offset = p.windowHeight / 40;
      this.drawerAng = p.PI * p.random(0, 100);
      this.drawerAngInc = p.random(p.PI / 190,p.PI / 210);
      this.ang = p.PI * p.random(0, 100);
      this.angInc = p.random(p.PI / 190,p.PI / 210);

      //session.loops[this.loopId].tracks[this.trackId].notes.push(this);
      this.particles = [];
      this.pool = [];
    }

    spawnParticles(x,y) {
      var particle, theta, force;
      if ( this.particles.length >= playParticlesMax ) this.pool.push( this.particles.shift() );
      
      particle = new PlayParticle(x, y, p.random(playSize1,playSize2),this.color);
      particle.wander = p.random( wander1, wander2 );
      particle.drag = p.random( drag1, drag2 );
      theta = p.random( p.TWO_PI );
      force = p.random( force1, force2 );
      particle.velocity.x = p.sin( theta ) * force;
      particle.velocity.y = p.cos( theta ) * force;
      this.particles.push( particle );
    }
    
    updateParticles() {
      var i, particle;
      for ( i = this.particles.length - 1; i >= 0; i-- ) {
          particle = this.particles[i];
          if ( particle.alive ) particle.move();
          else this.pool.push(this.particles.splice( i, 1 )[0]);
      }
    } 

    stop(time) {
      let pitch = this.pitch;
      if (pitch > 11) pitch = pitch-12;

      if (session.loops[this.loopId].tracks[this.trackId].name !== "DRUMS") {
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerRelease(theory.freqs[pitch]*p.pow(2,this.octave),time);
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerRelease(theory.freqs[pitch]*p.pow(2,this.octave),time); 
    
      }
    }

    play(time) {
      this.angInc = p.PI / 12;
      this.animOpa = 255;
      this.animR = this.size;
      this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];


      if (session.loops[this.loopId].tracks[this.trackId].name === "DRUMS") {
        session.loops[this.loopId].tracks[this.trackId].synth.parts[this.pitch].stop(time);
        session.loops[this.loopId].tracks[this.trackId].synth.parts[this.pitch].start(time);
        if (this.pitch === 2) session.loops[this.loopId].tracks[this.trackId].synth.parts[3].stop(time);
      }
      else {
        //let t = session.loops[this.loopId].timeBtwSteps*this.duration;
        let pitch = this.pitch;
        if (pitch > 11) pitch = pitch-12;
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerAttack(theory.freqs[pitch]*p.pow(2,this.octave),time);
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerAttack(theory.freqs[pitch]*p.pow(2,this.octave),time);
      }
      //synths.melody.triggerAttackRelease(theory.freqs[this.pitch]*p.pow(2,this.octave), session.activeTab.timeBtwSteps);
    }

    playShort() {
      this.angInc = p.PI / 12;
      this.animOpa = 255;
      this.animR = this.size;
      this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
      //synth.triggerAttackRelease("C3", "16n");
      if (session.activeTab.tracks[this.trackId].name === "DRUMS") {
        session.activeTab.tracks[this.trackId].synth.parts[this.pitch].start();
      } else {
        let pitch = this.pitch;
        if (pitch > 11) pitch = pitch-12;
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerAttackRelease(theory.freqs[pitch]*p.pow(2,this.octave),0.1);
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerAttackRelease(theory.freqs[pitch]*p.pow(2,this.octave),0.1);
      }
      for (let i=0;i<10;i++) this.spawnParticles(this.x,this.y);
    }

    showInfo() {
      p.fill(white[0], white[1], white[2], this.opaInfo);

      if (this.opaInfo + this.opaInc > 255) this.opaInfo = 255;
      else this.opaInfo += this.opaInc;

      //let pitch = this.pitch;
      //if (pitch > 11) pitch = pitch-12;

      p.push();
      p.translate(0,0,p.windowHeight/30);
      if (this.x <= p.windowWidth / 2) {
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(p.windowHeight / 40);
        p.textFont(fontMedium);
        if (session.activeTab.selectedTrack.name === "DRUMS") p.text(theory.drumLabels[this.pitch], this.x+gridStepSizeX, this.y-gridStepSizeX*1.4);
        else p.text(theory.noteLabels[this.pitch] + this.octave, this.x+gridStepSizeX, this.y-gridStepSizeX*1.4);
        p.textFont(fontLight);
        p.textSize(p.windowHeight / 65);
        if (this.duration === 1) p.text("STEP "+(this.start+1), this.x+gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        else p.text("STEP "+(this.start+1)+"-"+(this.start+this.duration), this.x+gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        //p.fill(this.color[0], this.color[1], this.color[2], this.opaInfo);
        //p.text(session.activeTab.tracks[this.trackId].name, this.x+gridStepSizeX, this.y-gridStepSizeX*1.4+p.windowHeight / 42);
      } else {
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(p.windowHeight / 40);
        p.textFont(fontMedium);
        if (session.activeTab.selectedTrack.name === "DRUMS") p.text(theory.drumLabels[this.pitch], this.x-gridStepSizeX, this.y-gridStepSizeX*1.4);
        else p.text(theory.noteLabels[this.pitch] + this.octave, this.x-gridStepSizeX, this.y-gridStepSizeX*1.4);
        p.textFont(fontLight);
        p.textSize(p.windowHeight / 65);
        if (this.duration === 1) p.text("STEP "+(this.start+1), this.x-gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        else p.text("STEP "+(this.start+1)+"-"+(this.start+this.duration), this.x-gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        //p.fill(this.color[0], this.color[1], this.color[2], this.opaInfo);
        //p.text(session.activeTab.tracks[this.trackId].name, this.x-gridStepSizeX, this.y-gridStepSizeX*1.4+p.windowHeight / 42);
      }
      p.pop();
    }
    /*triggerRelease() {
      if (session.loops[this.loopId].currentStep === this.start+this.duration) {
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerRelease(theory.freqs[this.pitch]*p.pow(2,this.octave));
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerRelease(theory.freqs[this.pitch]*p.pow(2,this.octave));
      }
    }*/

    drawCollapsedDrawer(targetX, targetY) {
      if (session.loops[this.loopId].hover) p.fill(this.colorOrig[0],this.colorOrig[1],this.colorOrig[2],255);
      else p.fill(this.colorOrig[0],this.colorOrig[1],this.colorOrig[2],255/2);
      
      this.drawerAng += this.drawerAngInc;

      p.noStroke();
      p.push();
      p.translate(targetX,targetY,p.windowHeight/60);
      p.scale(p.windowHeight/140 / petalModelSize);
      p.rotateX(this.drawerAng );
      p.rotateY(this.drawerAng );
      p.model(session.loops[this.loopId].tracks[this.trackId].petal);
      p.pop();
    }

    drawCollapsed(angles,targetX, targetY) {
      if (session.loops[this.loopId].play && this.start <= session.loops[this.loopId].currentStep && this.start+this.duration >= session.loops[this.loopId].currentStep) {
        if (session.activeTab !== null) {
          if (this.loopId !== session.activeTab.id) this.angInc = p.PI / 12;
        } else this.angInc = p.PI / 12;        //this.animOpa = 255;
        this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
        if(this.start+this.duration > session.loops[this.loopId].currentStep) this.spawnParticles(targetX,targetY);
      }

      for ( let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].alive) {
          this.particles[i].move();
          p.push();
          p.translate(0,0,1);
          this.particles[i].show();
          p.pop();
        } else this.pool.push(this.particles.splice( i, 1 )[0]);  
      } 

      for (let i = 0; i < this.color.length; i++) {
        if (this.color[i] - 5 < this.colorOrig[i]) this.color[i] = this.colorOrig[i];
        else this.color[i] -= 5;
      }
      if (session.activeTab !== null) {
        if (this.loopId !== session.activeTab.id)  {
          if (this.angInc > p.PI / 200) this.angInc -= 0.005;
          if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
          else this.animOpa -= this.animOpaInc;
          if (this.animR < p.windowHeight/15) this.animR += this.animRInc;
          this.ang += this.angInc;
        }
      } else {
        if (this.angInc > p.PI / 200) this.angInc -= 0.005;
        if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
        else this.animOpa -= this.animOpaInc;
        if (this.animR < p.windowHeight/15) this.animR += this.animRInc;
        this.ang += this.angInc;
      }

      //while is playing, set bright and rotatation to max
      if (this.start <= session.loops[this.loopId].currentStep && this.start+this.duration >= session.loops[this.loopId].currentStep) {
        if (session.activeTab !== null) {
          if (this.loopId !== session.activeTab.id) this.angInc = p.PI / 12;
        } else this.angInc = p.PI / 12;
        this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
        if(this.start+this.duration > session.loops[this.loopId].currentStep) this.spawnParticles(
          session.loops[this.loopId].tracks[this.trackId].particlesPreviewX[session.loops[this.loopId].tracks[this.trackId].particlesPreviewX.length-session.loops[this.loopId].currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(this.ang/2)*p.windowHeight/50).x,
          session.loops[this.loopId].tracks[this.trackId].particlesPreviewY[session.loops[this.loopId].tracks[this.trackId].particlesPreviewY.length-session.loops[this.loopId].currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(p.PI/2-this.ang/2)*p.windowHeight/50).y);
      }

      p.fill(this.color[0],this.color[1],this.color[2],previewOpa);
      p.noStroke();
      p.push();
      p.translate(targetX,targetY,p.windowHeight/60);
      p.scale(p.windowHeight/50 / petalModelSize);
      p.rotateX(this.ang);
      p.rotateY(this.ang);
      p.model(session.loops[this.loopId].tracks[this.trackId].petal);
      p.pop();

      p.push();
      p.noFill();
      p.translate(0,0,2);
      p.stroke(this.color[0], this.color[1], this.color[2], this.animOpa);
      p.strokeWeight(this.size / 12);
      if (this.animOpa > 0) p.circle(targetX,targetY, this.animR, this.animR);
      p.pop();
    }

    draw(targetX, targetY) {

      //release
      /*if (session.loops[this.loopId].tracks[this.trackId].name !== "DRUMS") {
        //console.log(this.loopId,this.trackId);
        this.triggerRelease();
      }*/

      for (let i = 0; i < this.color.length; i++) {
        if (this.color[i] - 5 < this.colorOrig[i]) this.color[i] = this.colorOrig[i];
        else this.color[i] -= 5;
      }

      this.size = p.windowHeight / 60;
      let initialX = this.start;
      let initialY = this.pitch;

      if (p.mouseX > targetX - gridStepSizeX/2 && p.mouseX < targetX + gridStepSizeX*(this.duration-1) + gridStepSizeX/2 
        && p.mouseY > targetY - gridStepSizeX/2 && p.mouseY < targetY + gridStepSizeX/2
        && session.activeTab.selectedTrack === session.activeTab.tracks[this.trackId] && session.activeTab.view === 0 && dragging === false && menuOpened === false && session.loopDrawer === false && session.structDrawer  === false) {
          document.body.style.cursor = 'grab';
          
          if (this.hover === false) {
            this.opaInfo = 0;
            this.angInc = p.PI / 12;
            this.offsetDrag = 1;
          }

          this.hover = true;

          if (p.mouseIsPressed && this.dragging === false) {
            initialX = this.start;
            initialY = this.pitch;
            this.playShort();
            this.selected = true;
            this.dragging = true;
            dragging = true;
          }
          
      } else this.hover = false;

      if (p.mouseIsPressed === false && this.dragging === true) {
        this.dragging = false;
        dragging = false;
        this.hover = true;
        for (let n in session.loops[this.loopId].tracks[this.trackId].notes) {
          if (session.loops[this.loopId].tracks[this.trackId].notes[n].selected) {
            //console.log("ai");
            session.loops[this.loopId].tracks[this.trackId].ajustNotes(session.loops[this.loopId].tracks[this.trackId].notes[n]);
          }
        }
      }

      if (this.dragging) {
        const auxX = p.round((p.mouseX - gridInitX) / gridStepSizeX);
        let auxY = 0;
        
        if (session.loops[this.loopId].tracks[this.trackId].name === "DRUMS") auxY = session.loops[this.loopId].tracks[this.trackId].nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(session.loops[this.loopId].tracks[this.trackId].nPitches-1)))-1;
        else auxY = session.loops[this.loopId].tracks[this.trackId].nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(session.loops[this.loopId].tracks[this.trackId].nPitches-1)))-1;
        //console.log(auxX,auxY);

        //console.log(session.loops[this.loopId].tracks[this.trackId].nPitches,this.start,this.pitch,auxX,auxY);
        if (auxX >= 0 && auxX < nSteps && auxY >= 0 && auxY < session.loops[this.loopId].tracks[this.trackId].nPitches) {
          /*if (session.activeTab.selectedTrack.timeline[this.start][this.pitch] !== session.activeTab.selectedTrack.timeline[auxX][auxY]) {
            session.activeTab.selectedTrack.timeline[auxX][auxY] = this;
            session.activeTab.selectedTrack.timeline[this.start][this.pitch] = null;*/

            for (let n in session.loops[this.loopId].tracks[this.trackId].notes) {
              let note = session.loops[this.loopId].tracks[this.trackId].notes[n];
              if (note !== this && note.selected) {
                note.start = note.start + (auxX - initialX);
                if (auxY > 11) {
                  note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value+1;
                  note.pitch =  note.pitch+(auxY-initialY-12);
                } else {
                  note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value;
                  note.pitch = note.pitch+(auxY-initialY);
                }

                //note.pitch = note.pitch + (this.pitch - initialY);
                //note.pitch = this.pitch;
              }
            }

            if (auxY > 11) {
              this.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value+1;
              auxY = auxY-12;
            } else this.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value;
            
            
            if (this.pitch !== auxY) {
              this.start = auxX;
              this.pitch = auxY;
              this.playShort();
            } else if (this.pitch === auxY && this.start !== auxX) {
              this.start = auxX;
              this.pitch = auxY;
              this.angInc = p.PI / 12;
            }

            //prevent passing boundaries of the grid
            if (this.start+this.duration >= nSteps) {
              this.start = nSteps-this.duration;
            } 

            //targetX = p.abs(gridInitX + p.round((p.mouseX - gridInitX) / gridStepSizeX) * gridStepSizeX);
            //targetY = p.abs(gridInitY + p.round((p.mouseY - gridInitY) / gridStepSizeY) * gridStepSizeY);
            //if (targetX > gridInitX + (nSteps-1) * gridStepSizeX) targetX = gridInitX + (nSteps-1) * gridStepSizeX;
            //if (targetY > gridInitY + (12-1) * gridStepSizeY) targetY = gridInitY + (12-1) * gridStepSizeY;
          //}
        }
        this.showInfo();
        document.body.style.cursor = 'grabbing';
      }

      if (this.hover) this.showInfo();

      if (session.activeTab.selectedTrack !== session.activeTab.tracks[this.trackId]) {
        if (this.opa - this.opaInc < 255/2) this.opa = 255/2;
        else this.opa -= this.opaInc;
      } else {
        if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
        else this.opa += this.opaInc;
      }

      if (this.angInc > p.PI / 200) this.angInc -= 0.005;

      if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
      else this.animOpa -= this.animOpaInc;

      if (this.animR < p.windowHeight/15) this.animR += this.animRInc;

      //REVER ISTO
      if (session.activeTab.selectedTrack === null) targetY = targetY + p.sin(this.ang/2) * this.offset;
      this.ang += this.angInc;

      if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
      else this.opa += this.opaInc;

      let a = p.createVector(0, -1).angleBetween(p.createVector(this.x - targetX, this.y - targetY));
      let d = p.dist(this.x, this.y, targetX, targetY);

      this.x -= p5.Vector.fromAngle(a, d / 15).y;
      this.y -= p5.Vector.fromAngle(p.PI - a, d / 15).x;

      //p.circle(this.x, this.y, this.size, this.size);
      //if (session.loops[this.loopId].tracks[this.trackId].notes.includes(this) === false) console.log("ai", this.octave);

      if (session.activeTab.selectedTrack === null || session.activeTab.selectedTrack !== null && session.activeTab.view === 0 && (session.activeTab.selectedTrack.octaveScroll.value === this.octave || session.activeTab.selectedTrack.octaveScroll.value+1 === this.octave) && session.activeTab.selectedTrack.id === this.trackId) {
        for ( let i = 0; i < this.particles.length; i++) {
          if (this.particles[i].alive) {
            this.particles[i].move();
            p.push();
            p.translate(0,0,-p.windowHeight/60*(session.activeTab.tracks[this.trackId].id+2));
            this.particles[i].show();
            p.pop();
          } else this.pool.push(this.particles.splice( i, 1 )[0]);  
        }

        p.fill(this.color[0], this.color[1], this.color[2], this.opa);

        //while is playing, set bright and rotatation to max
        if (session.activeTab.play && this.start <= session.activeTab.currentStep && this.start+this.duration >= session.activeTab.currentStep) {
          this.angInc = p.PI / 12;
          //this.animOpa = 255;
          this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
          if(this.start+this.duration > session.activeTab.currentStep) this.spawnParticles(gridInitX+session.activeTab.currentStep*gridStepSizeX,this.y);
        }
        p.noStroke();

        //selected
        if (this.selected) {
          this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
          if (this.animOpa === 0) {
            this.animOpa = 255;
            this.animR = this.size;
          }
        } 
        
        p.push();
        if (session.activeTab.selectedTrack === session.activeTab.tracks[this.trackId]) p.translate(this.x,this.y,-p.windowHeight/60);
        else p.translate(this.x,this.y,-p.windowHeight/60*(session.activeTab.tracks[this.trackId].id+2));
        p.scale(p.windowHeight/60 / petalModelSize);
        p.rotateX(this.ang);
        p.rotateY(this.ang);
        p.model(session.activeTab.tracks[this.trackId].petal);
        p.pop();

        if (session.activeTab.selectedTrack !== null && session.activeTab.view === 0) {
          p.noFill();
          p.stroke(this.color[0], this.color[1], this.color[2], this.opa);
          p.strokeWeight(p.windowHeight/120);
          p.beginShape();
          for (let i = 0; i < this.duration+1; i++) {
            //p.stroke(this.color[0], this.color[1], this.color[2], (this.opa / this.duration)*(this.duration-i-1));
            p.stroke(this.color[0], this.color[1], this.color[2], 100);
            p.vertex(this.x+i*gridStepSizeX, this.y);
          }
          p.endShape();

          //p.noStroke();
          /*p.stroke(this.color[0], this.color[1], this.color[2], 100);

          p.push();
          p.translate(this.x+(this.duration)*gridStepSizeX,this.y,-p.windowHeight/60*(session.activeTab.tracks[this.trackId].id+1));
          p.scale(p.windowHeight/60 / petalModelSize);
          //p.rotateX(this.ang+p.PI);
          //p.rotateY(this.ang+p.PI);
          p.rotateX(this.ang);
          p.rotateY(this.ang);
          p.model(session.activeTab.tracks[this.trackId].petal);
          p.pop();*/
        }

          /*p.push();
          if (session.activeTab.selectedTrack === session.activeTab.tracks[this.trackId]) p.translate(this.x+this.duration*gridStepSize,this.y,p.windowHeight/60);
          else p.translate(this.x+this.duration*gridStepSizeX,this.y,-p.windowHeight/60 * (session.activeTab.tracks[this.trackId].id+1));
          p.scale(p.windowHeight/60 / petalModelSize);
          p.rotateX(this.ang);
          p.rotateY(this.ang);
          p.model(session.activeTab.tracks[this.trackId].petal);
          p.pop();*/
        
          p.noFill();
          p.stroke(this.color[0], this.color[1], this.color[2], this.animOpa);
          p.strokeWeight(this.size / 12);
          if (this.animOpa > 0) p.circle(this.x, this.y, this.animR, this.animR);
      }
    }
  }

  class Menu {

    constructor(tabId,trackId,label,options,mode) {
      this.tabId = tabId;
      this.trackId = trackId;

      this.label = label;
      this.mode = mode;

      this.state = -1; //-1: ckosed, 0: opened, 1: opened and option selected, 2: ai generated selection, 3: confirm delete

      this.options = options;
      this.nOptions = options.length;

      this.lastInstant = 0;
      this.interval = 50;

      this.dark = 0;
      this.darkMax = 200;
      this.darkInc = 10;

      this.offsetValue = p.windowHeight / 25;
      this.offsetInc = p.windowHeight / 200;
      this.opaInc = 15;
      this.opaMax = 255;

      this.optionW = this.getWidestOption();
      this.optionH = p.windowHeight / 30;

      this.lastOption = "";

      this.optionsCheck = [];
      this.optionsOpa = [];
      this.optionsOffset = [];

      this.menuOpa = 0;

      for (let i = 0; i < this.nOptions; i++) {
        this.optionsCheck.push(false);
        this.optionsOpa.push(0);
        this.optionsOffset.push(this.offsetValue);
      }
    }

    getWidestOption() {
      let widest = 0;
      p.textSize(p.windowHeight / 45);
      for (let i = 0; i < this.nOptions; i++) {
        if (p.textWidth(this.options[i]) > widest) widest = p.textWidth(this.options[i]);
      }
      return widest;
    }

    close() {
      menuOpened = false;
      this.state = -1;
    }

    open() {
      for (let i = 0; i < this.nOptions; i++) {
        this.optionsCheck[i] = false;
        this.optionsOpa[i] = 0;
        this.optionsOffset[i] = this.offsetValue;
      }

      menuOpened = true;
      this.state = 0;
    }

    drawOptions(x,y) {

      p.textSize(p.windowHeight / 45);
      p.textAlign(p.LEFT, p.TOP);
      p.noStroke();

      for (let i = 0; i < this.nOptions; i++) {
        if (this.optionsCheck[i]) {

          if (this.options[i] === "DELETE") p.fill(225, 0, 0, this.optionsOpa[i]);
          else p.fill(white[0], white[1], white[2], this.optionsOpa[i]);
          p.textFont(fontLight);

          if (this.optionsOffset[i] - this.offsetInc < 0) this.optionsOffset[i] = 0;
          else this.optionsOffset[i] -= this.offsetInc;
          if (this.optionsOpa[i] + this.opaInc > this.opaMax) this.optionsOpa[i] = this.opaMax;
          else this.optionsOpa[i] += this.opaInc;

          //drop down menu
          if (this.mode === "DROPDOWN") {
            //Remove after dev
            if (this.options[i] === "RENAME") this.optionsOpa[i] = 50;

            if (p.mouseX > x && p.mouseX < x + this.optionW && p.mouseY > y  + this.optionH*2 + i * this.optionH && p.mouseY < y  +this.optionH*2 + i * this.optionH + this.optionH) {
              //Remove after dev
              if (this.options[i] === "RENAME") document.body.style.cursor = 'not-allowed';
              else document.body.style.cursor = 'pointer';

              for (let j = 0; j < this.nOptions; j++) if (j !== i) this.optionsOpa[j] = 50;

              if (p.mouseIsPressed) {
                //session.activeTab.addTrack(this.options[i]);
                if (this.label === "menu") {
                  switch (this.options[i]) {
                    case "RENAME":
                      this.optionsOpa[i] = 50;
                      //not developed yet
                      break;
                    case "DUPLICATE":
                      session.duplicateLoop(this.tabId);
                      this.close();
                      break;
                    case "EXPORT":
                      //not developed yet
                      this.close();
                      break;
                    case "STRUCT FROM":
                      //not developed yet
                      break;
                    case "CLOSE TAB":
                      session.closeTab(this.tabId);
                      this.close();
                      break;
                    case "DELETE":
                      this.state = 3;
                      this.menuOpa = 0;
                      break;
                  }
                }
                p.mouseIsPressed = false;
              }
            } 

            p.text(this.options[i], x, y +this.optionH*2 + i * this.optionH - this.optionsOffset[i]);
          
          //drop up menu
          } else {
            //check if the option is the same as an existing track
            let notAllowed = false;
            for (let j = 0; j < session.loops[this.tabId].tracks.length; j++) {
              if (this.options[i] === session.loops[this.tabId].tracks[j].name) notAllowed = true;
            }

            if (notAllowed) this.optionsOpa[i] = 50;

            if (p.mouseX > x && p.mouseX < x + this.optionW && p.mouseY > y  -this.optionH*2 - i * this.optionH && p.mouseY < y  -this.optionH*2 - i * this.optionH + this.optionH) {
              
              if (notAllowed) document.body.style.cursor = 'not-allowed';
              else document.body.style.cursor = 'pointer';

              for (let j = 0; j < this.nOptions; j++) if (j !== i) this.optionsOpa[j] = 50;

              if (p.mouseIsPressed && notAllowed === false) {
                //session.activeTab.addTrack(this.options[i]);
                //this.reset();
                this.menuOpa = 0;
                if (this.label === "plusMenu") this.state = 1;
                p.mouseIsPressed = false;
                this.lastOption = this.options[i];
              }
            } 

            p.text(this.options[i], x, y -this.optionH*2 - i * this.optionH + this.optionsOffset[i]);
          }
        }
      }
    }

    drawModeOptions() {
      let icons = [];
      let labels = [];

      if (this.menuOpa + this.opaInc > 255) this.menuOpa = 255;
      else this.menuOpa += this.opaInc;

      if (this.label === "plusMenu") { 

          if (session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack = null;
          if (session.activeTab.view !== 0) session.activeTab.view = 0;
          if (session.activeTab.play) {
            session.activeTab.play = false;
            Tone.Transport.stop();
          }

          if (this.lastOption === "MELODY") {
            icons = [scratch,ai,sing];
            labels = ["FROM SCRATCH","AI SUGGESTION","HUM/SING"];
          } else {
            icons = [scratch,ai];
            labels = ["FROM SCRATCH","AI SUGGESTION"];
          }

          p.textAlign(p.CENTER, p.TOP);
          p.textFont(fontLight);

          p.textSize(p.windowHeight / 50);
          if (p.mouseX > p.windowWidth/2-p.textWidth("CANCEL")/2 && p.mouseX < p.windowWidth/2+p.textWidth("CANCEL")/2 && p.mouseY > p.windowHeight/2 + p.windowHeight/8*2 && p.mouseY < p.windowHeight/2 + p.windowHeight/8*2 + p.windowHeight / 50) {
             p.fill(white[0], white[1], white[2], this.menuOpa);
             document.body.style.cursor = 'pointer';
          } else p.fill(white[0], white[1], white[2], this.menuOpa/2);
          p.text("CANCEL", p.windowWidth/2, p.windowHeight/2 + p.windowHeight/8*2);

          p.textSize(p.windowHeight / 40);

          let textWidth = p.textWidth("NEW  ")/2+p.textWidth("  TRACK")/2+p.textWidth(this.lastOption);

          p.fill(white[0], white[1], white[2], this.menuOpa);
          p.text("NEW ", p.windowWidth/2-textWidth/2, p.windowHeight/2 - p.windowHeight/8*2.5);
          p.text(" TRACK",  p.windowWidth/2-textWidth/2+p.textWidth("NEW ")/2+p.textWidth(this.lastOption)+p.textWidth(" TRACK")/2, p.windowHeight/2 - p.windowHeight/8*2.5);
          
          let c = [0,0,0];
          if (this.lastOption === "MELODY") c = colors[3];
          else if (this.lastOption === "DRUMS") c = colors[1];
          else if (this.lastOption === "BASS") c = colors[0];
          else if (this.lastOption === "HARMONY") c = colors[2];
          
          p.fill(c[0],c[1],c[2], this.menuOpa);
          p.text(this.lastOption, p.windowWidth/2-textWidth/2+p.textWidth("NEW ")/2+p.textWidth(this.lastOption)/2, p.windowHeight/2 - p.windowHeight/8*2.5);

          let totalWidth = (icons.length-1)*(p.windowHeight/6*2);

          for (let i = 0; i < icons.length; i++) {
            let width = p.windowWidth/2 - totalWidth/2 + i*p.windowHeight/6*2;


            if (p.mouseX > width-p.windowHeight/7 && p.mouseX < width + p.windowHeight/7 && p.mouseY > p.windowHeight/2 - this.optionH*2 - p.windowHeight/7 && p.mouseY < p.windowHeight/2 - this.optionH*2 + p.windowHeight/7) {
              document.body.style.cursor = 'pointer';
              p.fill(white[0], white[1], white[2], this.menuOpa);
              p.tint(255, this.menuOpa);

              if (p.mouseIsPressed) {
                if (i === 0) {
                  session.activeTab.addTrack(this.lastOption);
                  this.close();
                } else if (i === 1) {
                  console.log("AKS TO THE SERVER");
                  this.close();
                } else {
                  console.log("REQUEST TO BASIC PITCH");
                  this.close();
                }

                p.mouseIsPressed = false;
              }

            } else {
              p.fill(white[0], white[1], white[2], this.menuOpa/3);
              p.tint(255, this.menuOpa/4);
            }
            if (i === 0) p.image(icons[i],  width, p.windowHeight/2 - this.optionH*2, p.windowHeight/8, p.windowHeight/8);
            else p.image(icons[i], width, p.windowHeight/2 - this.optionH*2, p.windowHeight/7, p.windowHeight/7);
            p.text(labels[i], width, p.windowHeight/2 - this.optionH*2 + p.windowHeight/8);
          }
      }
    }

    drawSelection() {
      p.textAlign(p.CENTER, p.TOP);
      p.textFont(fontLight);
    }

    confirmDelete() {
      if (session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack = null;
      if (session.activeTab.view !== 0) session.activeTab.view = 0;
      if (session.activeTab.play) {
        session.activeTab.play = false;
        Tone.Transport.stop();
      }

      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(fontLight);
      p.textSize(p.windowHeight / 40);
      p.fill(white[0], white[1], white[2], this.menuOpa);

      if (this.menuOpa + this.opaInc > 255) this.menuOpa = 255;
      else this.menuOpa += this.opaInc;

      if(this.label === "menu") {
        p.text('Are you sure you want to delete "'+session.loops[this.tabId].name+'"?', p.windowWidth/2, p.windowHeight/2 - p.windowHeight/20);
      }

      p.textSize(p.windowHeight / 50);
      if (p.mouseX > p.windowWidth/2-p.windowHeight/10-p.textWidth("CANCEL")/2 && p.mouseX < p.windowWidth/2-p.windowHeight/10+p.textWidth("CANCEL")/2 && p.mouseY > p.windowHeight/2 + p.windowHeight/20-p.windowHeight / 50 /2 && p.mouseY < p.windowHeight/2 + p.windowHeight/20 + p.windowHeight / 50 /2) {
        document.body.style.cursor = 'pointer';
        p.fill(white[0], white[1], white[2], this.menuOpa);
      } else p.fill(white[0], white[1], white[2], this.menuOpa/2);
      p.text("CANCEL", p.windowWidth/2-p.windowHeight/10, p.windowHeight/2 + p.windowHeight/20);
     
      p.textSize(p.windowHeight / 40);
      if (p.mouseX > p.windowWidth/2+p.windowHeight/10-p.textWidth("DELETE")/2 && p.mouseX < p.windowWidth/2+p.windowHeight/10+p.textWidth("DELETE")/2 && p.mouseY > p.windowHeight/2 + p.windowHeight/20-p.windowHeight / 40 /2 && p.mouseY < p.windowHeight/2 + p.windowHeight/20 + p.windowHeight / 40 /2) {
        document.body.style.cursor = 'pointer';
        p.fill(225,0,0, this.menuOpa);
        if (p.mouseIsPressed) {
          session.deleteLoop(this.tabId);
          this.close();
          p.mouseIsPressed = false;
        }
      } else p.fill(225,0,0, this.menuOpa/2);
      p.text("DELETE", p.windowWidth/2+p.windowHeight/10, p.windowHeight/2 + p.windowHeight/20);
    }

    draw(x,y) {
      //update responsive
      this.optionW = this.getWidestOption();
      this.optionH = p.windowHeight / 30;

      p.noStroke();
      p.fill(0, 0, 0, this.dark);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      if (this.state === -1) {
        if (this.dark - this.darkInc < 0) this.dark = 0;
        else this.dark -= this.darkInc;
      }
      else {

        if (this.state === 3) {
          if (this.dark + this.darkInc > 255) this.dark = 255;
          else this.dark += this.darkInc;
        } else {
          if (this.dark + this.darkInc > this.darkMax) this.dark = this.darkMax;
          else this.dark += this.darkInc;
        }

        if (p.millis() - this.lastInstant > this.interval) {
          this.lastInstant = p.millis();
          for (let i = 0; i < this.nOptions; i++) {
            if (this.optionsCheck[i] === false) {
              this.optionsCheck[i] = true;
              break;
            }
          }
        }

        if (this.state === 0) this.drawOptions(x,y);
        else if (this.state === 1) this.drawModeOptions();
        else if (this.state === 2) this.drawSelection();
        else if (this.state === 3) this.confirmDelete();

        if (p.mouseX < x || p.mouseX > x + this.optionW || p.mouseY < y  -this.optionH*2 - (this.options.length-1) * this.optionH || p.mouseY > y  -this.optionH*2 + this.optionH) {
          if (p.mouseIsPressed) {
            this.close();
            p.mouseIsPressed = false;
          }
        }
      }
    }
  }

  class Knob {
    constructor(label,value,options,unit) {
      this.label = label;
      
      this.radius = p.windowHeight / 15;

      this.lastY;

      this.value = value;
      this.tempValue = value;
      this.inc = 0.01;

      this.options = options;
      this.unit = unit;

      this.automation = new Array(nSteps).fill(0.5);
      this.automating = false;

      this.hover = false;
      this.dragging = false;

      this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))];
    }

    knobAutomate(loop) {
      if (this.automating && loop.currentStep > -1) {
        this.value = this.automation[loop.currentStep];
        if (typeof this.output === "string") this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))].toUpperCase();
        else this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))];
      }
    }

    findKnob() {
      for(let i=0;i<session.activeTab.selectedTrack.knobs.length;i++) {
        if (session.activeTab.selectedTrack.knobs[i][1] === this) return i;
      }
    }
 
    draw(x,y,opa) {
      this.radius = p.windowHeight / 15;
    
      if (this.automating === false) { 
        if (typeof this.output === "string") this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))].toUpperCase();
        else this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))];
      }

      p.fill(white[0], white[1], white[2],opa);
      p.noStroke();
      p.textSize(p.windowHeight/65);
      p.textAlign(p.CENTER,p.BOTTOM);
      p.text(this.label,x,y-this.radius/1.7);
      p.textAlign(p.CENTER,p.TOP);
      p.textSize(p.windowHeight/55);
      if (this.label === "PITCH") p.text((this.output/100)+this.unit,x,y+this.radius/1.7);
      else p.text(this.output+this.unit,x,y+this.radius/1.7);

      if (this.automating) p.fill(session.activeTab.selectedTrack.color[0], session.activeTab.selectedTrack.color[1], session.activeTab.selectedTrack.color[2],opa/2);
      else p.noFill();
      p.stroke(white[0], white[1], white[2],opa);
      p.strokeWeight(1);
      p.push();
      p.translate(x,y);
      //console.log(this.value,p.PI/2+p.PI/4,p.PI+p.PI/4);
      p.rotate(p.map(this.value,0,1,-p.PI/2-p.PI/4, 3*(p.PI/2)-p.PI/2-p.PI/4));
      p.translate(-x,-y);
      p.push();
      p.translate(0,0,-1);
      p.circle(x, y, this.radius);
      p.pop();
      p.line(x,y,x,y-this.radius/2);
      p.pop();

      if (p.mouseX > x -this.radius/2 && p.mouseX < x+this.radius/2 && p.mouseY > y -this.radius/2 && p.mouseY < y +this.radius/2
        && dragging === false && menuOpened === false) {
          document.body.style.cursor = 'grab';
          
          this.hover = true;

          if (p.mouseIsPressed && this.dragging === false) {
            session.activeTab.selectedTrack.presetChanged = true;

            if (this.automating) {
              session.alertLog('Automation "'+this.label+'" disabled.');
              this.automating = false;
            }
            session.activeTab.selectedTrack.automationScroll.value = this.findKnob();
            this.lastY = p.mouseY;
            this.dragging = true;
            dragging = true;
            this.tempValue = this.value;
          }
          
      } else this.hover = false;

      if (p.mouseIsPressed === false && this.dragging === true) {
        this.dragging = false;
        dragging = false;
        this.hover = true;
      }

      if (this.dragging) {
        document.body.style.cursor = 'grabbing';
        if (p.mouseY > this.lastY) {
          let d = p.dist(x,p.mouseY,x, this.lastY);
          this.value = p.round(this.tempValue - this.inc*p.round(d/(p.windowHeight/250)),2);
        }
        else if (p.mouseY < this.lastY)  {
          let d = p.dist(x,p.mouseY,x, this.lastY);
          this.value = p.round(this.tempValue + this.inc*p.round(d/(p.windowHeight/250)),2);
        }

        if (this.value > 1) this.value = 1;
        if (this.value < 0) this.value = 0;
      }
    }
  }

  //on/off button
  class Button {
    constructor(label,state,color) {
      this.label = label;
      this.state = state;
      this.color = color;
      this.radius = p.windowWidth / 100;

      this.clickOpa = 255;

      this.hover = false;

      if (state) this.opa = 255;
      else this.opa = 255/3;
    }

    draw(x,y) {
      this.radius = p.windowWidth / 100;

      if (this.state) this.opa = 255;
      else this.opa = 255/3;

      if (session.activeTab.currentStep%4 === 0) {
        this.clickOpa = 255;
        this.lastClick = session.activeTab.currentStep;
      }

      if (this.clickOpa - 50 < 0) this.clickOpa = 0;
      else this.clickOpa -= 50;

      p.noFill();
      p.strokeWeight(1);
      p.stroke(white[0], white[1], white[2],this.opa);
      p.circle(x, y, this.radius);
      if (this.state) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2],this.opa);
        p.circle(x, y, this.radius/1.8);
        if (this.label === "CLICK" && session.activeTab.play) {
          let c = session.activeTab.selectedTrack.color;
          p.fill(c[0], c[1], c[2],this.clickOpa);
          p.circle(x, y, this.radius/1.8);
        }
      }

      if (p.mouseX > x -this.radius/2 && p.mouseX < x+this.radius/2 && p.mouseY > y -this.radius/2 && p.mouseY < y +this.radius/2  && dragging === false && menuOpened === false) {
        document.body.style.cursor = 'pointer';

        this.hover = true;

        if (p.mouseIsPressed) {
          if (this.label !== "CLICK" && this.label !== "RECORD" && this.label !== "TEMPO" && this.label !== "TRANSPOSE") session.activeTab.selectedTrack.presetChanged = true;
          this.state = !this.state;
          p.mouseIsPressed = false;
        }
      } else this.hover = false;
    }
  }

  class Scrollable {
    constructor(label,value,min,max,unit,inc,inc2) {
      this.label = label;
      this.unit = unit;

      this.value = value;
      this.min = min;
      this.max = max;

      this.opa = 0;

      this.inc = inc;
      this.inc2 = inc2;

      this.hover = false;
      this.hoverUp = false;
      this.hoverDown = false;
      this.pressing = false;
      this.timer = 0;

      this.w = p.windowWidth / 10;
      this.h = p.windowHeight / 20;
    }

    increment(inc) {
      if (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE") {
        if (this.value + inc <= this.max) this.value += inc;
        else this.value = this.max;
      } else {
        if (this.value - inc >= this.min) {
          this.value -= inc;
          if (this.label === "PRESET") session.activeTab.selectedTrack.presetChanged = false;

        }
        else this.value = this.min;
      }
    }

    decrement(inc) {
      if (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE") {
        if (this.value - inc >= this.min) this.value -= inc;
        else this.value = this.min;
      } else {
        if (this.value + inc <= this.max) {
          this.value += inc;
          if (this.label === "PRESET") session.activeTab.selectedTrack.presetChanged = false;
        }
        else this.value = this.max;
      }
    }

    draw(x,y) {
      this.w = p.windowWidth / 10;
      this.h = p.windowHeight / 20;
      //if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
      //else this.opa += this.opaInc;

      //p.fill(255, 0, 0, this.opa/2);
      //p.rect(x-this.w/2,y-this.h/2,this.w,this.h);

      p.noStroke();
      
      p.fill(white[0], white[1], white[2]);
      p.textSize(p.windowHeight/40);
      p.textAlign(p.LEFT,p.TOP);
      if (this.label === "PRESET") {
        //console.log(session.activeTab.selectedTrack);
        if (session.activeTab.selectedTrack.presetChanged) {
          if (session.activeTab.selectedTrack.name === "DRUMS") p.text(synths.drumPresets[this.value].name+"*", x-this.w/3.2, y-this.h/2);
          else p.text(synths.synthPresets[this.value].name+"*", x-this.w/3.2, y-this.h/2);
        } else {
          if (session.activeTab.selectedTrack.name === "DRUMS") p.text(synths.drumPresets[this.value].name, x-this.w/3.2, y-this.h/2);
          else p.text(synths.synthPresets[this.value].name, x-this.w/3.2, y-this.h/2);
        }
      }
      else if (this.label === "PARAMETER") {
        let knob = session.activeTab.selectedTrack.knobs[this.value];
        p.text(knob[0] + " - " + knob[1].label, x-this.w/3.2, y-this.h/2);
      }
      else if (this.label === "OCTAVE") {
        if (session.activeTab.selectedTrack.name === "DRUMS") p.text("KICK-CRASH", x-this.w/3.2, y-this.h/2);
        else p.text(theory.octaves[this.value], x-this.w/3.2, y-this.h/2);
        
      }
      else p.text(this.value + " " + this.unit, x-this.w/3.2, y-this.h/2);

      p.textAlign(p.LEFT,p.BOTTOM);
      p.fill(white[0], white[1], white[2], 255/2);
      p.textSize(p.windowHeight/65);
      p.text(this.label, x-this.w/3.2, y+this.h/2);

      p.push();
      if (p.mouseX > x - this.w/2 && p.mouseX < x+this.w/2 && p.mouseY > y -this.h/2 && p.mouseY < y +this.h/2
        && dragging === false && menuOpened === false) {

          if (this.opa + 15 < 255) this.opa += 15;
          else this.opa = 255;

          this.hover = true;
          if (p.mouseX < x - this.w/2 + this.h/2) {
            if (p.mouseY < y) {
              if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE")) {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE") {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else p.tint(255,this.opa/4);

              p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);
              if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE")) p.tint(255,this.opa/2);
              else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE") p.tint(255,this.opa/2);
              else p.tint(255,this.opa/4);
              p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);

              if (p.mouseIsPressed) {
                if (this.pressing === false) {
                  this.increment(this.inc);
                  this.pressing = true;
                  this.timer = p.millis();
                } else if (p.millis() - this.timer > 500) this.increment(this.inc2);
              } else this.pressing = false;
            }
            else {
              if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE")) {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE") {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else p.tint(255,this.opa/4);

              p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);
              if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE")) p.tint(255,this.opa/2);
              else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE") p.tint(255,this.opa/2);
              else p.tint(255,this.opa/4);
              p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);

              if (p.mouseIsPressed) {
                if (this.pressing === false) {
                  this.decrement(this.inc);
                  this.pressing = true;
                  this.timer = p.millis();
                } else if (p.millis() - this.timer > 500) this.decrement(this.inc2);
              } else this.pressing = false;
            }
          } else {
            if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE")) p.tint(255,this.opa/2);
            else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE") p.tint(255,this.opa/2);
            else p.tint(255,this.opa/4);
            p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);
            if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE")) p.tint(255,this.opa/2);
            else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE") p.tint(255,this.opa/2);
            else p.tint(255,this.opa/4);
            p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);
          }
      } else {
        if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE")) p.tint(255,this.opa/2);
        else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE") p.tint(255,this.opa/2);
        else p.tint(255,this.opa/4);
        p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);
        if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE")) p.tint(255,this.opa/2);
        else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE") p.tint(255,this.opa/2);
        else p.tint(255,this.opa/4);
        p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);
        this.hover = false;
        if (this.opa - 15 > 0) this.opa -= 15;
        else this.opa = 0;
      }
      p.pop();
    }
  }

  // --------------------------------------------------------------------------------------
  p.preload = function () {
    loopsIcon = p.loadImage(loopsSVG);
    structsIcon = p.loadImage(structsSVG);
    gridIcon = p.loadImage(gridSVG);
    studioIcon = p.loadImage(studioSVG);
    autoIcon = p.loadImage(autoSVG);

    plus = p.loadImage(plusSVG);
    arrowUp = p.loadImage(arrowUpPNG);
    arrowDown = p.loadImage(arrowDownPNG);

    ai = p.loadImage(aiPNG);
    sing = p.loadImage(singPNG);
    scratch = p.loadImage(scratchPNG);

    petal1 = p.loadModel(petalOBJ1);
    petal2 = p.loadModel(petalOBJ2);
    petal3 = p.loadModel(petalOBJ3);
    petal4 = p.loadModel(petalOBJ4);

    fontLight = p.loadFont(poppinsLightFont);
    fontMedium = p.loadFont(poppinsMediumFont);
    fontBold = p.loadFont(poppinsBoldFont);
  }

  // --------------------------------------------------------------------------------------
  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.frameRate(60);
    p.imageMode(p.CENTER);
    p.textFont(fontLight);

    //console.log(sesh);
    //p.pixelDensity(1);

    // Set up orthographic projection
    p.ortho(-p.windowWidth / 2, p.windowWidth / 2, -p.windowHeight / 2, p.windowHeight / 2, 0, 1000);

    //protect initial trigger of drawers
    p.mouseX = p.windowWidth / 2;
    p.mouseY = p.windowHeight / 2;

    //marginX = p.windowWidth / maxSteps;
    marginX = p.windowHeight / 30;
    iconSize = p.windowHeight / 15;
    iconCorners = p.windowHeight / 100;
    
    playSize1 = p.windowHeight/150;
    playSize2 = p.windowHeight/100;

    gridStepSizeX = (p.windowWidth - p.windowHeight / 30 * 3) / (nSteps - 1);
    gridStepSizeY = ((p.windowHeight - p.windowHeight / 30) * 3.8) / (nSteps - 1);
    gridInitX = p.windowWidth / 2 - gridStepSizeX * (nSteps-1) / 2;
    //REVER
    gridInitY = p.windowHeight / 2 - (gridStepSizeY * (12-1)) / 2;

    //if (sesh === "bin file not found") {
    session = new Session();
    for (let i = 0; i < 5; i++) {
      session.loops.push(new Loop(i, "myloop"+i, 120));
      session.loops[i].tracks.push(new Track(0, i, "MELODY", p.windowWidth / 2));
      for (let j = 0; j < 5; j++) {
        let start = p.floor(p.random(0, nSteps));
        let pitch = p.floor(p.random(0,12));
        //let duration = p.random(1,4);
        let duration = 1;
        session.loops[i].tracks[0].notes.push(new Note(pitch, session.loops[i].id, 0, start, duration, 3, session.loops[i].tracks[0].color));
      }
    }

    //ref session to synth.js
    synths.setSession(session);

    //console.log(session);

    //} else {
    //  initLoadedSesh();
    //}

    for (let i = 0; i < particles.length; i++) particles[i] = new Particle();
    for (let i = 0; i < petalParticles.length; i++) petalParticles[i] = new PetalParticle();
    diagonal = p.sqrt(p.windowWidth * p.windowWidth + p.windowHeight * p.windowHeight) / 2;
  }

  // --------------------------------------------------------------------------------------
  p.draw = function () {
    document.body.style.cursor = 'default';

    // Set up orthographic projection
    p.ortho(-p.windowWidth / 2, p.windowWidth / 2, -p.windowHeight / 2, p.windowHeight / 2, 0, 1000);

    petalModelSize = calculateBoundingBox(petal1).width;
    //p.lightFalloff(40,0,0);
    //p.spotLight(255, 255, 255, p.mouseX-p.windowWidth/2, p.mouseY-p.windowHeight/2, 10, 0, 0, -1); // Set spot light color, position, and direction
    //p.pointLight(255, 255, 255, p.mouseX-p.windowWidth/2, p.mouseY-p.windowHeight/2, 2);
    //p.translate(-p.windowWidth/2,-p.windowHeight/2);
    //update responsive values
    marginX = p.windowHeight / 30;
    iconSize = p.windowHeight / 15;
    iconCorners = p.windowHeight / 100;
    gridStepSizeX = (p.windowWidth - p.windowHeight / 30 * 3) / (nSteps);
    gridStepSizeY = ((p.windowHeight - p.windowHeight / 30) * 4.3) / (nSteps - 1);
    gridInitX = p.windowWidth / 2 - gridStepSizeX * (nSteps) / 2;
    gridInitY = p.windowHeight / 2 - (gridStepSizeY * 11.9) / 2;
    playSize1 = p.windowHeight/150;
    playSize2 = p.windowHeight/100;

    p.translate(-p.windowWidth/2,-p.windowHeight/2);
    p.background(0);

    p.push();
    p.translate(0,0,2);
    drawParticles();
    p.pop();

    session.draw();
    //p.fill(255, 255, 255);
    //p.circle(p.mouseX, p.mouseY, 10, 10); 
    //let bbox = calculateBoundingBox(petal1);
    //console.log("Bounding box dimensions:", bbox);
  }

  p.keyPressed = function () {
    if (p.key === ' ' && session.loopDrawer === false && session.structDrawer === false && menuOpened === false && session.activeTab !== null) {
      if (session.activeTab.play) {
        session.activeTab.play = false;
        Tone.Transport.stop();
        synths.releaseAll();
      }
      else {
        session.activeTab.currentStep = -1;
        session.activeTab.play = true;
        Tone.Transport.start();
      }
    }
    if (p.keyCode === p.BACKSPACE) {
      if (session.loopDrawer) loopSearch = loopSearch.slice(0, -1);
      else if (session.activeTab !== null) {
        if (session.activeTab.selectedTrack !== null) {
          let notes = session.activeTab.selectedTrack.notes;
          for (let i = 0; i < notes.length; i++) {
            if (notes[i].selected) {
              notes[i].stop();
              notes.splice(i, 1);
              i--;
            }
          }
        }
      }
    }

    if (inputNotes.length < maxInputNotes) {
      let input = theory.keysDecode(p.key.toUpperCase());
      if (input !== -1 && inputNotes.indexOf(input) === -1) {
        inputNotes.push(input);
        if (session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack.playInputNote(input);
        if (session.activeTab.record.state && session.activeTab.play && session.activeTab.currentStep > -1) {
          let check = false;
          for (let n in recordedNotes) {
            if (recordedNotes[n].pitch === input && recordedNotes[n].octave === currentOctave && recordedNotes[n].trackId === session.activeTab.selectedTrack.id) {
              check = true;
              break;
            }  
          }
          if (check === false) recordedNotes.push(new Note(input, session.activeTab.id, session.activeTab.selectedTrack.id, session.activeTab.currentStep, 1, currentOctave, session.activeTab.selectedTrack.color)); 
        }
      }
    }
  }

  p.keyReleased = function () {
    if (p.key === ' ' && session.loopDrawer === false && session.structDrawer === false && menuOpened === false && session.activeTab !== null) {
      if (session.activeTab.play === false) {
        Tone.Transport.stop();
        synths.releaseAll();
      }
    }

    if (session.activeTab !== null && menuOpened === false) {
    if (session.activeTab.selectedTrack !== null) {
      if (p.key.toUpperCase() === 'Z') if (currentOctave > minOctave) {
        currentOctave--;
        session.alertLog("Current keyboard octave: "+currentOctave);
        for (let i = 0; i < inputNotes.length; i++) {
          session.activeTab.selectedTrack.releaseInputNote(inputNotes[i]);
          inputNotes.splice(i, 1);
          i--;
        }
      }
      if (p.key.toUpperCase() === 'X') if (currentOctave < maxOctave) {
        currentOctave++;
        session.alertLog("Current keyboard octave: "+currentOctave);
        for (let i = 0; i < inputNotes.length; i++) {
          session.activeTab.selectedTrack.releaseInputNote(inputNotes[i]);
          inputNotes.splice(i, 1);
          i--;
        }
      }
      if (p.keyCode === p.LEFT_ARROW) if (session.activeTab.view > 0) {
        session.activeTab.view--;
        session.activeTab.blackOpa2 = 255;
        session.activeTab.blackOpa3 = 255;
      }
      if (p.keyCode === p.RIGHT_ARROW) if (session.activeTab.view < 2) {
        session.activeTab.view++;
        session.activeTab.blackOpa2 = 255;
        session.activeTab.blackOpa3 = 255;
      }
      if (p.keyCode === p.ESCAPE) {
        session.activeTab.selectedTrack = null;
        session.activeTab.view = 0;
      }
    }
  }

    let input = theory.keysDecode(p.key.toUpperCase());
    if (input !== -1) {
      let index = inputNotes.indexOf(input);
      if (index !== -1) {
        inputNotes.splice(index, 1);
        if (session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack.releaseInputNote(input);
        if (session.activeTab.record && session.activeTab.play) {
          for (let i = 0; i < recordedNotes.length; i++) {
            if (recordedNotes[i].pitch === input && recordedNotes[i].trackId === session.activeTab.selectedTrack.id) {
              //recordedNotes[i].duration = session.activeTab.currentStep - recordedNotes[i].start;
              
              //let track = session.activeTab.tracks[recordedNotes[i].trackId];

              //recordedNotes[i].x = gridInitX + recordedNotes[i].start * gridStepSizeX;

              //if (recordedNotes[i].octave === track.octaveScroll.value) recordedNotes[i].y = gridInitY + (track.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(track.nPitches-1));
              //else if (recordedNotes[i].octave === track.octaveScroll.value+1) recordedNotes[i].y = gridInitY + (track.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(track.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4;

              //if (recordedNotes[i].octave === track.octaveScroll.value) recordedNotes[i].draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
              //else if (recordedNotes[i].octave === track.octaveScroll.value+1) recordedNotes[i].draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);

              if (recordedNotes[i].duration === 0) recordedNotes[i].duration = 1;
              session.activeTab.selectedTrack.ajustNotes(recordedNotes[i]);
              session.activeTab.selectedTrack.notes.push(recordedNotes[i]);
              recordedNotes.splice(i, 1);
              break;
            }
          }
        }
      }
    }
  }

  //scrolling event
  p.mouseWheel = function (event) {
    if (session.activeTab !== null) {
      let s = session.activeTab.tempoScroll;
      if (s.hover) {
        if (event.delta > 0) s.increment(s.inc);
        else s.decrement(s.inc);
      } else {
        for (let n in session.activeTab.selectedTrack.notes) {
          let note = session.activeTab.selectedTrack.notes[n];
          if (note.selected) {
            if (event.delta > 0) {
              if (note.start+note.duration < nSteps) {
                note.duration++;
                session.activeTab.selectedTrack.ajustNotes(note);
              }
            } else {
              if (note.duration > 1) {
                note.duration--;
                session.activeTab.selectedTrack.ajustNotes(note);
              }
            }
          }
        }
      }
    }
  }

function calculateBoundingBox(model) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  // Iterate through all vertices of the model
  for (let i = 0; i < model.vertices.length; i++) {
    let v = model.vertices[i];
    minX = p.min(minX, v.x);
    minY = p.min(minY, v.y);
    minZ = p.min(minZ, v.z);
    maxX = p.max(maxX, v.x);
    maxY = p.max(maxY, v.y);
    maxZ = p.max(maxZ, v.z);
  }

  // Calculate dimensions
  let width = maxX - minX;
  let height = maxY - minY;
  let depth = maxZ - minZ;

  return {
    width: width,
    height: height,
    depth: depth
  };
}

}

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
            }
          }
      }
  });

});

export default sketch;