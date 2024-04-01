/* BASED ON:
Tom Holloway. "Flow Fields and Noise Algorithms with P5.js". 2020.
https://dev.to/nyxtom/flow-fields-and-noise-algorithms-with-p5-js-5g67
(acedido em 12/11/2023)
*/

import disketFont from '../Fonts/Disket-Mono-Regular.ttf';
import helveticaFont from '../Fonts/HelveticaNeue Thin.ttf';
import plusSVG from '../Assets/plus.svg';
import arrowSVG from '../Assets/arrow.svg';
import * as Tone from 'tone';
import p5 from 'p5';

let font1,font2;
let plus, arrow;

const synth = new Tone.Synth().toDestination();

let currentLoop = null;

let phase = 0;
let zoff = 0;
let noiseMax = 1;

var particles = new Array(50);
var totalFrames = 240;
let counter = 0;

let maxWeightLines = 2;
let maxBars = 16;
let maxSteps = 4*maxBars;

let marginX;
let iconSize;
let iconCorners;

const instruments = ["record","melody","harmony","drums","bass"]; 

let project;

// --------------------------------------------------------------------------------------

const sketch = (saveProject,proj) => (p) => {

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
      p.fill(this.rn(a), this.gn(a), this.bn(a), this.an(a)*0.75);
      p.circle(this.xn(a), this.yn(a), this.dn(a) / 2);
    }
  }

  function initLoadedProj() {
    project = new Project();
    project.view = proj.view;
    for (let i = 0; i < proj.loops.length; i++) {
      let loop = new Loop(proj.loops[i].id,proj.loops[i].name,proj.loops[i].nBars,proj.loops[i].tempo);
      for (let j = 0; j < proj.loops[i].tracks.length; j++) {
        let track = new Track(proj.loops[i].tracks[j].id,proj.loops[i].tracks[j].loopId,proj.loops[i].tracks[j].name,proj.loops[i].tempo,proj.loops[i].nSteps,proj.loops[i].tracks[j].iconTargetX);
        for (let k = 0; k < proj.loops[i].tracks[j].timeline.length; k++) {
          for (let l = 0; l < proj.loops[i].tracks[j].timeline[k].length; l++) {
            let note = new Note(proj.loops[i].tracks[j].timeline[k][l].name,proj.loops[i].tracks[j].timeline[k][l].trackId,proj.loops[i].tracks[j].timeline[k][l].start,proj.loops[i].tracks[j].timeline[k][l].duration);
            track.timeline[k].push(note);
          }
        }
        loop.tracks.push(track);
      }
      project.loops.push(loop);
    }
  }

  function getResponsive() {
    marginX = p.windowWidth/maxSteps;
    iconSize = p.windowHeight/15;
    iconCorners = p.windowHeight/100;
  }
  p.getResponsive = getResponsive;

  //================================================================================================

  class Project {

    constructor() {
      this.view = -1;
      this.loops = [];
      this.structures = [];
    }

    draw() {
      this.loops[0].draw();
    }
  }

  class Structure {

    constructor(id,tempo,key) {
      this.id = id;
      this.loops = [];
      this.repeats = [];
      this.tempo = tempo;
      this.key = key;
    }
  }

  class Loop {

    constructor(id,name,nBars,tempo) {
      this.id = id;
      this.name = name;
      this.tracks = [];
      this.key = "";
      this.nBars = nBars;
      this.nSteps = 4*nBars;

      this.play = false;

      this.tempo = tempo;
      this.timeBtwSteps = 60/tempo/4;
      this.lastInstant = 0;
      this.currentStep = 0;

      this.lastInstPlusMenu = 0;
      this.opaPlus = 0;
      this.opaPlusInc = 5;
      this.opaPlusMax = 50;

      this.plusX = p.windowWidth/2-iconSize/2;
      this.plusY = p.windowHeight-iconSize/2-iconSize;
      this.plusTargetX = p.windowWidth/2-iconSize/2;

      this.x = 0;
      this.y = 0;

      this.menu = new Menu(this.plusX,this.plusY,instruments);
    }

    addTrack(name) {

        let w = this.tracks.length*(iconSize/4)+iconSize*(this.tracks.length+1);
        let anchorRight = p.windowWidth/2+w/2;

        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].iconTargetX = anchorRight-w+i*(iconSize+iconSize/4);
        }
        this.tracks.push(new Track(this.tracks.length,this.id,name,this.tempo,this.nSteps,anchorRight-iconSize));
        this.plusTargetX = anchorRight+iconSize/4;
        this.menu.x = this.plusTargetX;
      //}

      //CODIGO PROVISORIO
      for (let i = 0; i < 5; i++) {
        let start = p.round(p.random(0,this.nSteps));
        //let duration = p.random(1,4);
        let duration = 1;
        this.tracks[this.tracks.length-1].timeline[start].push(new Note("C1",this.tracks.length-1,start,duration));
      }
      saveProject(project);
    }

    switchView() {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].expanded = !this.tracks[i].expanded;
      }
    }

    updateMetronome() {
      if (p.millis()-this.lastInstant >= this.timeBtwSteps*1000) {
        //console.log(this.currentStep);
        this.currentStep++;
        this.lastInstant = p.millis();
        if (this.currentStep === this.nSteps) this.currentStep = 0;
        
        for (let t in currentLoop.tracks) {
          for (let n in currentLoop.tracks[t].timeline[this.currentStep]) {
            currentLoop.tracks[t].timeline[this.currentStep][n].play();
          }
        }
      }
    }

    draw() {

      //update metronome
      if (this.play) this.updateMetronome();

      //update plus button position
      let dif = this.plusTargetX - this.plusX;
      if (dif > 0) this.plusX += dif/10;

      //loop name
      p.textFont(font1);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(p.windowHeight/50);
      p.fill(255);
      p.noStroke();
      p.text(this.name, marginX*2, marginX);

      //go back button
      //p.rect(marginX, marginX, iconSize/4, iconSize/3);

      //p.image(arrow, marginX+arrow.width/2, marginX+arrow.height/2, arrow.width,arrow.height);

      //cursor
      if (currentLoop.play) {
        p.stroke(255,255,255);
        p.strokeWeight(1);
        //p.rect(marginX+this.currentStep*(p.windowWidth-marginX*2)/this.nSteps,0,(p.windowWidth-marginX*2)/this.nSteps,p.windowHeight);
        p.line(marginX+this.currentStep*(p.windowWidth-marginX*2)/this.nSteps,0,marginX+this.currentStep*(p.windowWidth-marginX*2)/this.nSteps,p.windowHeight);
      }

      //draw track lines
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawLine();
      }

      //draw notes over all track lines
      for (let i = 0; i < this.tracks.length; i++) {
         this.tracks[i].drawNotes();
      }

      //hover plus button
      if (p.mouseX>this.plusX && p.mouseX<this.plusX+iconSize && p.mouseY>this.plusY && p.mouseY<this.plusY+iconSize) {
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
      p.fill(255,255,255,this.opaPlus);
      p.stroke(255);
      p.strokeWeight(1);
      p.rect(this.plusX, this.plusY, iconSize, iconSize, iconCorners);
      p.image(plus, this.plusX+iconSize/2, p.windowHeight-iconSize, p.windowHeight/50,p.windowHeight/50);
    }
  }

  class Track {

    constructor(id,loopId,name,tempo,nSteps,iconTargetX) {
      this.id = id;
      this.name = name;

      this.loopId = loopId;

      this.timeline = [];

      this.tempo = tempo;
      this.nSteps = nSteps;

      this.expanded = true;
      this.radiusCol = p.windowHeight/10;

      this.opaLine = 0;
      this.opaLineInc = 5;
      this.opaLineMax = 255;

      this.iconTargetX = iconTargetX;
      this.iconX = iconTargetX;
      this.iconY = p.windowHeight-iconSize/2-iconSize;
      this.opaIcon = 0;
      this.opaIconInc = 5;
      this.opaIconMax = 255;

      this.x = p.windowWidth/2;
      this.y = p.windowHeight/2;

      this.particlesX = [];
      this.particlesY = [];

      this.targetXexp = [];
      this.targetYexp = [];
      this.targetXcol = [];
      this.targetYcol = [];

      for (let i = 0; i<this.nSteps+3;i++) {
        this.particlesX.push(p.windowWidth/2);
        this.particlesY.push(p.windowHeight/2);
        this.targetXexp.push(0);
        this.targetYexp.push(0);
        this.targetXcol.push(0);
        this.targetYcol.push(0);
        if (i<this.nSteps) this.timeline.push([]);
      }

      console.log(this.timeline[0]);
    }

    drawLine() {

      if (this.opaLine + this.opaLineInc > this.opaLineMax) this.opaLine = this.opaLineMax;
      else this.opaLine += this.opaLineInc;

      p.noFill();
      p.stroke(255,255,255,this.opaLine);
      p.strokeWeight(maxWeightLines/(this.id+1));

      p.beginShape();
      for (let i = 0; i<this.particlesX.length;i++) p.vertex(this.particlesX[i], this.particlesY[i]);
      p.endShape();

      p.stroke(255,0,0);

      if (this.expanded) {
      
      let n = p.noise(0, this.id * 0.3, p.frameCount * 0.002);
      let y = p.map(n, 0, 1, -p.windowHeight/10, p.windowHeight/10);
      this.targetXexp[0] = 0;
      this.targetYexp[0] = p.windowHeight/2+y;

      let index = 1;

      for (let x = marginX; x <= p.windowWidth-marginX; x += (p.windowWidth-marginX*2)/this.nSteps) {
        n = p.noise(x * 0.0005, this.id * 0.3, p.frameCount * 0.002);
        y = p.map(n, 0, 1, -p.windowHeight/10, p.windowHeight/10);
        this.targetXexp[index] = x;
        this.targetYexp[index] = p.windowHeight/2+y;
        index++;
      }

      n = p.noise(p.windowWidth* 0.0005, this.id * 0.3, p.frameCount * 0.002);
      y = p.map(n, 0, 1, -p.windowHeight/10, p.windowHeight/10);
      this.targetXexp[this.targetXexp.length-1] = p.windowWidth;
      this.targetYexp[this.targetXexp.length-1] = p.windowHeight/2+y;

      //for (let i = 0; i<this.targetXexp.length;i++) p.point(this.targetXexp[i], this.targetYexp[i]);

      for (let i = 0; i<this.targetXexp.length;i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesX[i] - this.targetXexp[i], this.particlesY[i] - this.targetYexp[i]));
        let d = p.dist(this.particlesX[i], this.particlesY[i], this.targetXexp[i], this.targetYexp[i]);

        this.particlesX[i] -= p5.Vector.fromAngle(a, d/6).y;
        this.particlesY[i] -= p5.Vector.fromAngle(p.PI - a, d/6).x;
      }

      } else {

        let angle = -p.PI/2;

        for (let i = 0; i<this.targetXcol.length;i++) {

          let xoff = p.map(p.cos(angle*(1+this.id) + phase), -1, 1, 0, noiseMax);
          let yoff = p.map(p.sin(angle*(1+this.id) + phase), -1, 1, 0, noiseMax);
          let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, 50);
          phase += 0.00003;
          zoff += 0.000001;

          this.targetXcol[i] = this.x + p5.Vector.fromAngle(angle, this.radiusCol+r).x;
          this.targetYcol[i] = this.y + p5.Vector.fromAngle(p.PI - angle, this.radiusCol+r).y;

          angle -= p.TWO_PI/this.targetXcol.length+p.TWO_PI/this.targetXcol.length/this.targetXcol.length;
        }

        //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

        for (let i = 0; i<this.targetXcol.length;i++) {
          let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesX[i] - this.targetXcol[i], this.particlesY[i] - this.targetYcol[i]));
          let d = p.dist(this.particlesX[i], this.particlesY[i], this.targetXcol[i], this.targetYcol[i]);
  
          this.particlesX[i] -= p5.Vector.fromAngle(a, d/6).y;
          this.particlesY[i] -= p5.Vector.fromAngle(p.PI - a, d/6).x;
        }
      }

      //update icon position
      let dif = this.iconTargetX - this.iconX;
      this.iconX += dif/10;

      if (this.opaIcon + this.opaIconInc > this.opaIconMax) this.opaIcon = this.opaIconMax;
      else this.opaIcon += this.opaIconInc;

      //icon
      p.strokeWeight(1);
      p.stroke(255,255,255,this.opaIcon);
      p.rect(this.iconX, this.iconY, iconSize, iconSize, iconCorners);

      p.noStroke();
      p.textFont(font1);
      p.fill(255,255,255,this.opaIcon);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(p.windowHeight/35);
      p.text('0'+(this.id+1), this.iconX+iconSize/2, this.iconY+iconSize/7);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(p.windowHeight/90);
      p.text(this.name, this.iconX+iconSize/2, this.iconY+iconSize-iconSize/5);
    }

    drawNotes() {
      for (let i = 0; i < this.timeline.length; i++) {
        for (let j = 0; j < this.timeline[i].length; j++) {
          this.timeline[i][j].draw(this.particlesX[i],this.particlesY[i]);
        }
      }
    }
  }

  class Note {

    constructor(name,trackId,start,duration) {
      this.name = name;
      this.start = start;
      this.duration = duration;

      this.trackId = trackId;

      this.size = p.windowHeight/50;

      this.x = p.random(0,p.windowWidth);
      this.y = p.random(0,p.windowHeight);

      this.opa = 255;
      this.opaInc = 1;
      this.opaMax = 255;

      this.animOpa = 0;
      this.animR = 0;
      this.animOpaInc = 10;
      this.animRInc = p.windowHeight/250;
      this.animScale = this.size*0.2;
      this.animScaleInc = p.windowHeight/100;

      this.offset = p.windowHeight/50;
      this.ang = p.PI*p.random(0,10);
      this.angInc = p.PI/200;
    }

    play() {
      this.animOpa = 255;
      this.animR = this.size;
      this.animScale = this.size*0.2;
      synth.triggerAttackRelease("C3", "16n");
    }

    draw(targetX,targetY) {

      if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
      else this.animOpa -= this.animOpaInc;

      if (this.animOpa>0) this.animR += this.animRInc;

      if (currentLoop.tracks[0].expanded) {
        targetY = targetY + p.sin(this.ang)*this.offset;
        this.ang += this.angInc;
      }

      if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
      else this.opa += this.opaInc;

      let a = p.createVector(0, -1).angleBetween(p.createVector(this.x - targetX, this.y - targetY));
      let d = p.dist(this.x, this.y, targetX, targetY);

      this.x -= p5.Vector.fromAngle(a, d/10).y;
      this.y -= p5.Vector.fromAngle(p.PI - a, d/10).x;

      p.fill(255,0,0,this.opa);
      p.noStroke();
      p.circle(this.x,this.y,this.size,this.size);

      p.noFill();
      p.stroke(255,0,0,this.animOpa);
      p.strokeWeight(this.size/10);
      p.circle(this.x,this.y,this.animR,this.animR);
    }
  }

  class Menu {

    constructor(x,y,options) {
      
      this.lastInstant = 0;
      
      this.state = -1;
      this.options = options;
      this.nOptions = options.length;

      this.interval = 50;

      this.dark = 0;
      this.darkMax = 200;
      this.darkInc = 10;

      this.textSize = p.windowHeight/40;

      this.offsetValue = p.windowHeight/25;
      this.offsetInc = p.windowHeight/200;
      this.opaInc = 15;
      this.opaMax = 255;

      this.optionW = p.windowWidth/14;
      this.optionH = p.windowHeight/28;


      this.x = x;
      this.y = y-this.optionH*1.5;

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
      for (let i = 0; i <this.nOptions; i++) {
        this.optionsCheck[i] = false;
        this.optionsOpa[i] = 0;
        this.optionsOffset[i] = this.offsetValue;
      }
      this.state = -1;
    }

    draw() {
      p.noStroke();
      p.fill(0,0,0,this.dark);
      p.rect(0,0,p.windowWidth,p.windowHeight);

      if (this.state === -1) {
        if (this.dark - this.darkInc < 0) this.dark = 0;
        else this.dark -= this.darkInc;
      } else {
        if (this.dark + this.darkInc > this.darkMax) this.dark = this.darkMax;
        else this.dark += this.darkInc;

        if(p.millis()-this.lastInstant > this.interval) {
          this.lastInstant = p.millis();
          for (let i=0;i<this.nOptions;i++) {
            if (this.optionsCheck[i] === false) {
              this.optionsCheck[i] = true;
              break;
            }
          }
        }
  
        p.textFont(font1);
        p.textSize(p.windowHeight/40);
        p.textAlign(p.LEFT, p.TOP);
        for (let i = 0; i < this.nOptions; i++) {
          if (this.optionsCheck[i]) {
            
            if (p.mouseX>this.x && p.mouseX<this.x+this.optionW && p.mouseY>this.y-i*this.optionH && p.mouseY<this.y-i*this.optionH+this.optionH) {
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
            p.fill(255,255,255,this.optionsOpa[i]);
            p.text(this.options[i], this.x, this.y-i*this.optionH+this.optionsOffset[i]);
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
    font2 = p.loadFont(helveticaFont);
  }

  // --------------------------------------------------------------------------------------
  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.frameRate(60);
    p.imageMode(p.CENTER);

    console.log(proj);

    marginX = p.windowWidth/maxSteps;
    iconSize = p.windowHeight/15;
    iconCorners = p.windowHeight/100;

    if (proj === "bin file not found") {
      project = new Project();
      project.loops.push(new Loop(0,"myloop1",16,120));
    } else {
      initLoadedProj();
    }
    currentLoop = project.loops[0];

    for (let i = 0; i < particles.length; i++) particles[i] = new Particle();
  }

  // --------------------------------------------------------------------------------------
  p.draw = function () {
    //p.translate(-p.windowWidth/2,-p.windowHeight/2);
    p.background(0);
    //drawParticles();

    project.draw();
  }

  p.keyPressed = function () {
    if (p.key === ' '){ 
      if (currentLoop.play) {
        currentLoop.play = false;
      }
      else {
        //currentLoop.currentStep = 0;
        currentLoop.play = true;
      }
    }  
    if (p.key === 'e'){ 
      currentLoop.switchView();
    }  
  }
}

export default sketch;