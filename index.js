var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

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

var WALL_HEIGHT = 3;
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

    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");

    return prog;
}

function setupModel (gl) {
    var verts = Uint8Array.from(COLUMN);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var indxs = Uint8Array.from(COLUMN_FACES);
    var elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

var cameraPos = vec3.fromValues(0, 0, 0);
var lookPos = vec3.fromValues(0, 0, 1);
var currentAngle = Math.PI / 2; // 90 degrees
var dAngle = 5 * (Math.PI / 180); // 1 degree
var lookDir = vec3.fromValues(0, 0, 1); // looking north

function onKeyDown(event) {
    var keyCode = event.keyCode;

    // first handle changes to the currentAngle
    switch (keyCode) {
    case 68: //d
        currentAngle += dAngle;
        break;
    case 65: //a
        currentAngle -= dAngle;
        break;
    }

    // update the direction we're looking based on currentAngle
    var lookX = Math.cos(currentAngle);
    var lookY = Math.sin(currentAngle);
    vec3.set(lookDir, lookX, 0, lookY);

    // move forward or backward based on the current lookDir. if strafing,
    // move in the direction of lookDir rotated 90 degrees left/right
    switch (keyCode) {
    case 87: //w
        vec3.add(cameraPos, cameraPos, lookDir);
        break;
    case 83: //s
        var invLookDir = vec3.create();
        vec3.negate(invLookDir, lookDir);
        vec3.add(cameraPos, cameraPos, invLookDir);
        break;
    case 81: //q
        var rotLeftLookDir = vec3.fromValues(lookDir[2], 0, -lookDir[0]);
        vec3.add(cameraPos, cameraPos, rotLeftLookDir);
        break;
    case 69: //e
        var rotRightLookDir = vec3.fromValues(-lookDir[2], 0, lookDir[0]);
        vec3.add(cameraPos, cameraPos, rotRightLookDir);
        break;
    }

    // set the camera position to 1 unit ahead of where we're looking
    vec3.add(lookPos, cameraPos, lookDir);
}
window.addEventListener('keydown', onKeyDown, false);

function createWalls () {
    // camera starts at top left cell
    var maze_data = [
        '00100',
        '10101',
        '10101',
        '10001',
        '11111',
    ]
    var walls = [];
    for (var row in maze_data) {
        for (var letterIdx in maze_data[row]) {
            var letter = maze_data[row][letterIdx];
            if (letter == '1')
                walls.push(createWall(row, letterIdx));
        }
    }
    return walls;
}

var time = 0;
function update (gl, prog, walls) {
    time++;

    var view = mat4.create();
    mat4.lookAt(view, cameraPos, lookPos, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, Math.PI/4, 4/3, 0.1, 100); // random defaults

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);

    gl.uniform1i(prog.timeLocation, time);

    gl.vertexAttribPointer(prog.positionLocation, 3, gl.BYTE, false, 0, 0);
    gl.enableVertexAttribArray(prog.positionLocation);

    walls.forEach(function (w) {
        gl.uniformMatrix4fv(prog.modelLocation, false, w.model);
        gl.uniformMatrix4fv(prog.viewLocation, false, view);
        gl.uniformMatrix4fv(prog.projLocation, false, projection);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 8);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 12);
    });
}

window.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    document.body.appendChild(canvas);

    var gl = canvas.getContext('webgl');
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    setupModel(gl);
    prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    walls = createWalls();

    function mainloop() {
        update(gl, prog, walls);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
};
