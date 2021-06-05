console.log("gaze.js is running");


//SHOW WEBCAM CAPTURE & FACIAL LANDMARKS
//let canvas = document.getElementById("tracker-canvas");
//gazefilter.visualizer.setCanvas(canvas);


//CALIBRATION
// enable mouse calibration
function onmouseclick(clickevent) {
    gazefilter.tracker.calibrate(
        clickevent.timeStamp,  // relative to performance.timeOrigin
        clickevent.screenX,  // in pixels
        clickevent.screenY,  // in pixels
        1.0  // see note below
    );
}

window.addEventListener("click", onmouseclick);

// listen to calibration process
function oncalib(response) {
    calibErrorString = [
        "calib acquired",
        "screen dimensions aren't set",
        "calib sample cannot be created",
        "not enough data to fit"
    ][response.errorCode];

    calibEyeString = [
        "no eye",
        "left eye",
        "right eye",
        "both eyes"
    ][response.eye];

    calibError = Math.round(response.errorValue);

    console.log(
        calibErrorString +
        "; error: " + calibError + "px" +
        "; " + calibEyeString
    );
}

gazefilter.tracker.addListener("calib", oncalib);


//TRACKING
function ontrack(trackevent) {
    if (trackevent.detected) {
        faceStatus = "detected";
    }
    else {
        faceStatus = "not detected";
    }

    trackingStatus = [
        "no tracked face",
        "tracked face found",
        "face tracked",
        "tracked face lost"
    ][trackevent.eventType];
    pog = trackevent.pogArray();
    if (isNaN(pog[0]) == false) {
        pogs.push(pog);
    }
    bestGazeP = trackevent.bestGazePoint();

    fixPoint = trackevent.fixationPoint();
    fixDur = Math.round(trackevent.fixationDuration());
    fixStatus = [
        "no fixation",
        "fixation acquired",
        "fixation",
        "fixation lost"
    ][trackevent.fixationEvent()];
}

gazefilter.tracker.addListener("filter", ontrack);