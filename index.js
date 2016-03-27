var CANVAS_HEIGHT = window.innerHeight;
var CANVAS_WIDTH = window.innerWidth;

var COLUMN = [
    -1,  1,  1, // A
     1,  1,  1, // B
    -1, -1,  1, // C
     1, -1,  1, // D
    -1,  1, -1, // E
     1,  1, -1, // F
    -1, -1, -1, // G
     1, -1, -1, // H
];

var COLUMN_FACES = [
    0, 1, 2, 3,
    4, 5, 6, 7,
    4, 0, 6, 2,
    5, 1, 7, 3,
];

var WALL_HEIGHT = 5;
var WALL_WIDTH = 2;

function createWall (mazeX, mazeY) {
    model = mat4.create();

    var worldX = mazeX * WALL_WIDTH * 2;
    var worldY = 0;
    var worldZ = mazeY * WALL_WIDTH * 2;
    var position = vec3.fromValues(worldX, worldY, worldZ);
    mat4.translate(model, model, position);

    var scale = vec3.fromValues(WALL_WIDTH, WALL_HEIGHT, WALL_WIDTH);
    mat4.scale(model, model, scale);

    return {
        model: model,
        pos: position,
    };
}

function fetchFile(path) {
    var request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.overrideMimeType('text/plain');
    request.send();
    return request.responseText;
}

function compileShader(gl, str, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function createProgram(gl, vertFile, fragFile) {
    var vert = fetchFile(vertFile);
    var frag = fetchFile(fragFile);

    var vertShader = compileShader(gl, vert, gl.VERTEX_SHADER);
    var fragShader = compileShader(gl, frag, gl.FRAGMENT_SHADER);

    var prog = gl.createProgram();
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        return null;
    }

    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");

    return prog;
}

function setupModel (gl) {
    var verts = Float32Array.from(COLUMN);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var indxs = Uint8Array.from(COLUMN_FACES);
    var elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

function createWalls (userStart, mazeData) {
    var walls = [];
    for (var y in mazeData) {
        for (var x in mazeData[y]) {
            var letter = mazeData[y][x];
            var normalizedX = x - userStart.x;
            var normalizedY = y - userStart.y;
            if (letter == '1')
                walls.push(createWall(normalizedX, normalizedY));
        }
    }
    return walls;
}

var time = 0;
function update (gl, prog, walls, camera) {
    time++;

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, Math.PI/4, 4/3, 0.1, 100); // random defaults

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1i(prog.timeLocation, time);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(prog.positionLocation);

    walls.forEach(function (w) {
        renderWall(gl, prog, w.model, view, projection);
    });
}

function renderWall (gl, prog, model, view, projection) {
    gl.uniformMatrix4fv(prog.modelLocation, false, model);
    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 8);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 12);
}

function setupCamera () {
    var currentAngle = Math.PI / 2; // 90 degrees
    var dtheta = 5 * (Math.PI / 180); // 1 degree

    var camera = {
        pos: vec3.fromValues(0, 0, 0), // position of the camera
        look: vec3.fromValues(0, 0, 1), // position its looking at
    };

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

        // update the direction we're looking based on currentAngle
        var lookX = Math.cos(currentAngle);
        var lookY = Math.sin(currentAngle);
        var lookDir = vec3.fromValues(lookX, 0, lookY);

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

        // set the camera position to 1 unit ahead of where we're looking
        vec3.add(camera.look, camera.pos, lookDir);
    }, false);

    return camera;
}

window.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    document.body.appendChild(canvas);

    var gl = canvas.getContext('webgl');
    window.gl = gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    gl.useProgram(prog);

    setupModel(gl);
    var camera = setupCamera();
    var initialPosition = {
        x: 3,
        y: 0,
    };
    var mazeData = [
        '   v   ',
        '       ',
        '       ',
        '  1 1  ',
        '11   11',
        '1     1',
        '11111 1',
        '1   1 1',
        '1 1   1',
        '1 11111',
        '1      ',
        '1111111',
        '       ',
    ]
    var walls = createWalls(initialPosition, mazeData);

    function mainloop() {
        update(gl, prog, walls, camera);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
};
