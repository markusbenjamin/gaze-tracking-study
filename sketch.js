console.log("sketch.js is running");

//load gaze filter
let WASM_URL;

async function loadGazeFilter() {
  WASM_URL = "./gazefilter.wasm";
  await gazefilter.init("gazefilter.wasm");
  await gazefilter.tracker.connect();
}

//calibration data
var calibStatus;
var calibEyeString;
var calibError;

//tracking data
var faceStatus; //TrackEvent.detected

var trackingStatus; //TrackEvent.eventType
var pog; //TrackEvent.pogArray()
var bestGazeP; //TrackEvent.bestGazePoint()

var fixPoint; //TrackEvent.fixationPoint()
var fixDur; //TrackEvent.fixationDuration()
var fixStatus; //TrackEvent.fixationEvent()

//settings, misc vars
var gazeSmoothNum;
var pogs = [];
var pogSmooth;

//nofixtest vars
var nofixTest;
var nofixFix;
var nofixNofix;
var nofixTestStart;
var nofixSwitchTime;
var nofixTestLength;
var nofixTestData;
var nofixTarget;

//discriminator
var discrOn;
var discrDist;
var discrTime;
var discrCounter;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 1);
  rectMode(CENTER);
  noStroke();
  noFill();

  loadGazeFilter();
  pogSmooth = [-1, -1];

  gazeSmoothNum = 15;

  nofixTest = false;
  nofixFix = false;
  nofixNofix = false;
  nofixTestLength = 240 * 1000;
  nofixFixLength = 5 * 1000;
  nofixNofixLength = 5 * 1000;
  nofixTarget = [width * 0.5, height * 0.5];

  discrOn = false;
  discrDist = 200;
  discrTime = 10;
  discrCounter = 0;
}

function windowResized() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  fill(0);
  stroke(1);
  rect(width * 0.5, height * 0.5, width, height);
  noFill
  noStroke();

  if (nofixTest) {
    doNofixTest();
  }
  else {
    showPredictions();
    showStatus();
  }
}


//tracking
function calcPogSmooth() {
  pogSmooth = mean(pogs.slice(-gazeSmoothNum));
}

function showPredictions() {
  if (bestGazeP != undefined) {
    stroke(1, 1, 1);
    line(bestGazeP[0] - 20, bestGazeP[1] - 20, bestGazeP[0] + 20, bestGazeP[1] + 20);
    line(bestGazeP[0] - 20, bestGazeP[1] + 20, bestGazeP[0] + 20, bestGazeP[1] - 20);
    noStroke();
  }

  if (gazeSmoothNum < pogs.length) {
    stroke(1, 1, 1, 0.1);
    ellipse(pogSmooth[0], pogSmooth[1], 20, 20);
    stroke(0.333, 1, 1, 0.1);
    ellipse(pogSmooth[2], pogSmooth[3], 20, 20);
    stroke(1);
    ellipse((pogSmooth[0] + pogSmooth[2]) / 2, (pogSmooth[1] + pogSmooth[3]) / 2, 20, 20);
    noStroke();
  }

  if (fixStatus === "fixation") {
    stroke(1);
    line(fixPoint[0] - 40, fixPoint[1], fixPoint[0] + 40, fixPoint[1]);
    line(fixPoint[0], fixPoint[1] - 40, fixPoint[0], fixPoint[1] + 40);
    noStroke();
  }
}

function showStatus() {
  textSize(20);
  fill(1);
  text(
    "FACE: " + faceStatus +
    "\nCALIBRATION: " + calibEyeString + ", error: " + calibError + " px" +
    "\nTRACKING: " + trackingStatus +
    "\nFIXATION: " + fixStatus + ", duration: " + fixDur / 1000 + " s"
    , width * 0.015, height * 0.05);
  noFill();
}

function keyPressed() {
  if (key == 'n' || key == 'N') {
    startNofixTest();
  }

  if (key == 'd' || key == 'D') {
    discriminatorOn = !discriminatorOn;
  }
}

//nofixtest
function startNofixTest() {
  nofixTest = true;
  nofixFix = true;

  nofixTestData = new p5.Table();
  nofixTestData.addColumn('nofixTestTime');
  nofixTestData.addColumn('calibError');
  nofixTestData.addColumn('lpogx');
  nofixTestData.addColumn('lpogy');
  nofixTestData.addColumn('rpogx');
  nofixTestData.addColumn('rpogy');
  nofixTestData.addColumn('bestpogx');
  nofixTestData.addColumn('bestpogy');
  nofixTestData.addColumn('fixpx');
  nofixTestData.addColumn('fixpy');
  nofixTestData.addColumn('fixdur');
  nofixTestData.addColumn('fixstatus');
  nofixTestData.addColumn('targetx');
  nofixTestData.addColumn('targety');

  nofixPhi = 0;
  nofixR = 0;

  nofixTestStart = millis();
  nofixSwitchTime = nofixTestStart;
}

function doNofixTest() {
  if (nofixFix) {
    nofixTarget = [width * 0.5, height * 0.5];
    console.log("nofixFix");
    if (millis() - nofixSwitchTime > nofixFixLength) {
      nofixFix = false;
      nofixNofix = true;
      var nofixR = random(height * 0.5);
      var nofixPhi = random(TAU);
      nofixTarget = [
        width * 0.5 + cos(nofixPhi) * nofixR,
        height * 0.5 + sin(nofixPhi) * nofixR
      ];
      nofixSwitchTime = millis();
    }
  }
  else if (nofixNofix) {
    /*
    var prog = (millis() - nofixTestStart) / nofixTestLength;
    nofixTarget = [
      width * 0.5 + cos(3 * TAU * prog) * prog * height * 0.5,
      height * 0.5 + sin(3 * TAU * prog) * prog * height * 0.5
    ];
    */

    console.log("nofixNofix");
    if (millis() - nofixSwitchTime > nofixNofixLength) {
      nofixNofix = false;
      nofixFix = true;
      nofixTarget = [width * 0.5, height * 0.5];
      nofixSwitchTime = millis();
    }
  }

  fixCross(nofixTarget[0], nofixTarget[1], 80);

  let newRow = nofixTestData.addRow();
  newRow.setNum('nofixTestTime', millis() - nofixTestStart);
  newRow.setNum('calibError', calibError);
  newRow.setNum('lpogx', pog[0]);
  newRow.setNum('lpogy', pog[1]);
  newRow.setNum('rpogx', pog[2]);
  newRow.setNum('rpogy', pog[3]);
  newRow.setNum('bestpogx', bestGazeP[0]);
  newRow.setNum('bestpogy', bestGazeP[1]);
  newRow.setNum('fixpx', fixPoint[0]);
  newRow.setNum('fixpy', fixPoint[1]);
  newRow.setNum('fixdur', fixDur);
  newRow.setString('fixstatus', fixStatus);
  newRow.setString('targetx', nofixTarget[0]);
  newRow.setString('targety', nofixTarget[1]);

  if (millis() - nofixTestStart > nofixTestLength) {
    endNofixTest();
  }
}

function endNofixTest() {
  nofixTest = false;
  nofixFix = false;
  nofixNofix = false;

  saveTable(nofixTestData, 'nofixTestData' + millis() + '.csv');
}

//misc
function fixCross(x, y, s) {
  stroke(1);
  strokeWeight(2);
  line(x - s / 2, y, x + s / 2, y);
  line(x, y - s / 2, x, y + s / 2);
  noStroke();
  strokeWeight(1);
}