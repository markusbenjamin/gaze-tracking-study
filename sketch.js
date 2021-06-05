let WASM_URL;

async function loadGazeFilter() {
  WASM_URL = "./gazefilter.wasm";
  await gazefilter.init("gazefilter.wasm");
  await gazefilter.tracker.connect();
}

var fixPointPrediction;
var pointOfGazePrediction;
var pointOfGazePredictions = [];
var gazeSmoothNum;
var pogSmooth;
var counter = 0;

var alma = [
  [0,0,0],
  [1,1,1],
  [2,2,2],
  [3,3,3],
  [4,4,4],
  [5,5,5],
  [6,6,6],
  [7,7,7],
  [8,8,8]
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 1);
  rectMode(CENTER);
  textAlign(CENTER);
  noStroke();
  noFill();

  loadGazeFilter();

  gazeSmoothNum = 40;
}

function windowResized() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  fill(1, 0.01);
  stroke(0);
  rect(width * 0.5, height * 0.5, width, height);
  noFill
  noStroke();

  /*if (pointOfGazePrediction != undefined) {
    stroke(1, 1, 1);
    ellipse(pointOfGazePrediction[0], pointOfGazePrediction[1], 10, 10);
    stroke(0.333, 1, 1);
    ellipse(pointOfGazePrediction[2], pointOfGazePrediction[3], 10, 10);
  }

  if (fixPointPrediction != undefined) {
    stroke(0);
    line(fixPointPrediction[0] - 40, fixPointPrediction[1], fixPointPrediction[0] + 40, fixPointPrediction[1]);
    line(fixPointPrediction[0], fixPointPrediction[1] - 40, fixPointPrediction[0], fixPointPrediction[1] + 40);
  }*/

  if(gazeSmoothNum < pointOfGazePredictions.length){
    pogSmooth = mean(pointOfGazePredictions.slice(-gazeSmoothNum));
    stroke(1, 1, 1,0.1);
    ellipse(pogSmooth[0], pogSmooth[1], 40, 40);
    stroke(0.333, 1, 1,0.1);
    ellipse(pogSmooth[2], pogSmooth[3], 40, 40);
    stroke(0);
    ellipse((pogSmooth[0]+pogSmooth[2])/2, (pogSmooth[1]+pogSmooth[3])/2, 40, 40);
  }

  noFill();
  noStroke();
}