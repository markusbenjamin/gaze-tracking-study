//let canvas = document.getElementById("tracker-canvas");
//gazefilter.visualizer.setCanvas(canvas);
console.log("aa");

function onmouseclick(event) {
    gazefilter.tracker.calibrate(
        event.timeStamp,  // relative to performance.timeOrigin
        event.screenX,  // in pixels
        event.screenY,  // in pixels
        1.0  // see note below
    );
}

function oncalib(response) {
    console.log("calibration error: ", response.errorValue);
}

// enable mouse calibration
window.addEventListener("click", onmouseclick);

// listen calibration process
gazefilter.tracker.addListener("calib", oncalib);

gazefilter.tracker.addListener("filter", event => {
    fixPointPrediction = event.fixationPoint();
    pointOfGazePrediction = event.pogArray();
    if (isNaN(pointOfGazePrediction[0]) == false) {
        pointOfGazePredictions.push(pointOfGazePrediction);
    }
    counter++;
    //console.log(event.timestamp, event.eventType, event.detected, event.bestGazePoint());
});