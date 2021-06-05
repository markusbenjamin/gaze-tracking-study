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

//fixation test
var fixTest;
var fixTestStart;
var fixTestLength;
var fixTestData;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 1);
  rectMode(CENTER);
  noStroke();
  noFill();

  loadGazeFilter();

  gazeSmoothNum = 15;
  fixTest = false;
  fixTestLength = 60 * 1000;
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
  else {
    showPredictions();
    showStatus();
  }
}


//tracking

function showPredictions() {
  if (bestGazeP != undefined) {
    stroke(1, 1, 1);
    line(bestGazeP[0] - 20, bestGazeP[1] - 20, bestGazeP[0] + 20, bestGazeP[1] + 20);
    line(bestGazeP[0] - 20, bestGazeP[1] + 20, bestGazeP[0] + 20, bestGazeP[1] - 20);
    noStroke();
  }

  if (gazeSmoothNum < pogs.length) {
    pogSmooth = mean(pogs.slice(-gazeSmoothNum));
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

  fixTestStart = millis();
}

function doFixTest() {
  stroke(1);
  strokeWeight(2);
  line(width * 0.5 - 40, height * 0.5, width * 0.5 + 40, height * 0.5);
  line(width * 0.5, height * 0.5 - 40, width * 0.5, height * 0.5 + 40);
  noStroke();
  strokeWeight(1);

  let newRow = fixTestData.addRow();
  newRow.setNum('fixTestTime',millis()-fixTestStart);
  newRow.setNum('calibError',calibError);
  newRow.setNum('lpogx',pog[0]);
  newRow.setNum('lpogy',pog[1]);
  newRow.setNum('rpogx',pog[2]);
  newRow.setNum('rpogy',pog[3]);
  newRow.setNum('smoothpogx',pogSmooth[0]);
  newRow.setNum('smoothpogy',pogSmooth[1]);
  newRow.setNum('bestpogx',bestGazeP[0]);
  newRow.setNum('bestpogy',bestGazeP[1]);
  newRow.setNum('fixpx',fixPoint[0]);
  newRow.setNum('fixpy',fixPoint[1]);
  newRow.setNum('fixdur',fixDur);
  newRow.setString('fixstatus',fixStatus);
}

function endFixTest() {
  fixTest = false;

  saveTable(fixTestData, 'fixTestData'+millis()+'.csv');
}

function keyPressed(){
  if(key == 'f' || key == 'F'){
    startFixTest();
  }
}