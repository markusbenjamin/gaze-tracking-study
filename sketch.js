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

//fixtest vars
var fixTest;
var fixTestStart;
var fixTestLength;
var fixTestData;
var fixTarget;

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
var discriminatorOn;
var discStatus;
var discDist;
var discTime;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 1);
  rectMode(CENTER);
  noStroke();
  noFill();

  loadGazeFilter();
  pogSmooth = [-1, -1];

  gazeSmoothNum = 15;
  fixTest = false;
  fixTestLength = 60 * 1000;
  fixTarget = [width * 0.5, height * 0.5];

  nofixTest = false;
  nofixFix = false;
  nofixNofix = false;
  nofixTestLength = 120 * 1000;
  nofixFixLength = 5 * 1000;
  nofixNofixLength = 10 * 1000;
  nofixTarget = [width * 0.5, height * 0.5];

  discriminatorOn = false;
  discDist = 200;
  discTime = 10;
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

  if (fixTest) {
    doFixTest();
    if (millis() - fixTestStart > fixTestLength) {
      endFixTest();
    }
  }
  else if (nofixTest) {
    doNofixTest();
  }
  else {
    showPredictions();
    showStatus();
  }

  if (discriminatorOn) {
    stroke(1);
    ellipse(fixTarget[0], fixTarget[1], 2 * discDist, 2 * discDist)
    noStroke();
    var discResult = discriminate(bestGazeP, fixTarget);
    if (discResult == -1) {
      fill(0.55, 1, 1);
    }
    else {
      if (discResult == 0) {
        discStatus = 0;
      }
      else {
        discStatus += discResult;
      }
      if (discStatus > discTime) {
        fill(1, 1, 1);
      }
      else {
        fill(0.33, 1, 1);
      }
    }
    rect(width * 0.5, height * 0.5, 100, 100);
    noFill();
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

//fixtest
function startFixTest() {
  fixTest = true;

  fixTestData = new p5.Table();
  fixTestData.addColumn('fixTestTime');
  fixTestData.addColumn('calibError');
  fixTestData.addColumn('lpogx');
  fixTestData.addColumn('lpogy');
  fixTestData.addColumn('rpogx');
  fixTestData.addColumn('rpogy');
  fixTestData.addColumn('smoothpogx');
  fixTestData.addColumn('smoothpogy');
  fixTestData.addColumn('bestpogx');
  fixTestData.addColumn('bestpogy');
  fixTestData.addColumn('fixpx');
  fixTestData.addColumn('fixpy');
  fixTestData.addColumn('fixdur');
  fixTestData.addColumn('fixstatus');
  fixTestData.addColumn('targetx');
  fixTestData.addColumn('targety');

  fixTestStart = millis();
}

function doFixTest() {
  fixCross(width * 0.5, height * 0.5, 80);

  let newRow = fixTestData.addRow();
  newRow.setNum('fixTestTime', millis() - fixTestStart);
  newRow.setNum('calibError', calibError);
  newRow.setNum('lpogx', pog[0]);
  newRow.setNum('lpogy', pog[1]);
  newRow.setNum('rpogx', pog[2]);
  newRow.setNum('rpogy', pog[3]);
  newRow.setNum('smoothpogx', pogSmooth[0]);
  newRow.setNum('smoothpogy', pogSmooth[1]);
  newRow.setNum('bestpogx', bestGazeP[0]);
  newRow.setNum('bestpogy', bestGazeP[1]);
  newRow.setNum('fixpx', fixPoint[0]);
  newRow.setNum('fixpy', fixPoint[1]);
  newRow.setNum('fixdur', fixDur);
  newRow.setString('fixstatus', fixStatus);
  newRow.setString('targetx', fixTarget[0]);
  newRow.setString('targety', fixTarget[1]);
}

function endFixTest() {
  fixTest = false;

  saveTable(fixTestData, 'fixTestData' + millis() + '.csv');
}

function keyPressed() {
  if (key == 'f' || key == 'F') {
    startFixTest();
  }

  if (key == 'n' || key == 'N') {
    startNofixTest();
  }

  if (key == 'd' || key == 'D') {
    discriminatorOn = !discriminatorOn;
    if (discriminatorOn) {
      startDiscriminator();
    }
  }
}

//discriminator
function startDiscriminator() {
  discStatus = -1;
}

function discriminate(gaze, target) {
  if (isNaN(gaze[0])) {
    return -1;
  }
  else if (dist(gaze[0], gaze[1], target[0], target[1]) > discDist) {
    return 1;
  }
  else {
    return 0;
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
  nofixTestData.addColumn('smoothpogx');
  nofixTestData.addColumn('smoothpogy');
  nofixTestData.addColumn('bestpogx');
  nofixTestData.addColumn('bestpogy');
  nofixTestData.addColumn('fixpx');
  nofixTestData.addColumn('fixpy');
  nofixTestData.addColumn('fixdur');
  nofixTestData.addColumn('fixstatus');
  nofixTestData.addColumn('targetx');
  nofixTestData.addColumn('targety');

  nofixTestStart = millis();
  nofixSwitchTime = nofixTestStart;
}

function doNofixTest() {
  if (nofixFix) {
    nofixTarget = [width * 0.5, height * 0.5];
    console.log("nofixFix");
    if (millis() - nofixSwitchTime > nofixFixLength) {
      nofixSwitchTime = millis();
      nofixFix = false;
      nofixNofix = true;
    }
  }
  else if (nofixNofix) {
    var prog = (millis() - nofixTestStart) / nofixTestLength;
    nofixTarget = [
      width * 0.5 + cos(3 * TAU * prog) * prog * height * 0.5,
      height * 0.5 + sin(3 * TAU * prog) * prog * height * 0.5
    ];
    console.log("nofixNofix");
    if (millis() - nofixSwitchTime > nofixNofixLength) {
      nofixSwitchTime = millis();
      nofixNofix = false;
      nofixFix = true;
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
  newRow.setNum('smoothpogx', pogSmooth[0]);
  newRow.setNum('smoothpogy', pogSmooth[1]);
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