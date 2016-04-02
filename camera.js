function setupCamera (initialAngle) {
    var currentAngle = initialAngle * (Math.PI / 180);
    var dtheta = 5 * (Math.PI / 180); // 1 degree

    var camera = {
        pos: vec3.fromValues(0, 0, 0), // position of the camera
        look: vec3.fromValues(0, 0, 1), // position its looking at
    };

    function getLookDir () {
        // update the direction we're looking based on currentAngle
        var lookX = Math.cos(currentAngle);
        var lookY = Math.sin(currentAngle);
        return vec3.fromValues(lookX, 0, lookY);
    }

    function updateCamera (lookDir) {
        // set the camera position to 1 unit ahead of where we're looking
        vec3.add(camera.look, camera.pos, lookDir);
    }

    window.addEventListener('keydown', function (event) {
        var keyCode = event.keyCode;

        // first handle changes to the currentAngle
        switch (keyCode) {
        case 68: //d
            currentAngle += dtheta;
            break;
        case 65: //a
            currentAngle -= dtheta;
            break;
        }

        var lookDir = getLookDir();

        // move forward or backward based on the current lookDir. if strafing,
        // move in the direction of lookDir rotated 90 degrees left/right
        switch (keyCode) {
        case 87: //w
            vec3.add(camera.pos, camera.pos, lookDir);
            break;
        case 83: //s
            var invLookDir = vec3.create();
            vec3.negate(invLookDir, lookDir);
            vec3.add(camera.pos, camera.pos, invLookDir);
            break;
        case 81: //q
            var rotLeftLookDir = vec3.fromValues(lookDir[2], 0, -lookDir[0]);
            vec3.add(camera.pos, camera.pos, rotLeftLookDir);
            break;
        case 69: //e
            var rotRightLookDir = vec3.fromValues(-lookDir[2], 0, lookDir[0]);
            vec3.add(camera.pos, camera.pos, rotRightLookDir);
            break;
        }

        updateCamera(lookDir);
    }, false);

    updateCamera(getLookDir());
    return camera;
}
