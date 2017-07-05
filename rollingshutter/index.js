var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var MAX_ROTATIONAL_SPEED = 1/50;
var MIN_ROTATIONAL_SPEED = 1/500;

function lerp (t, min, max) { return min + t * (max - min); }

var PROP_VERTS = [
    0,  1, 0, // A
   -1,  0, 0, // B
    0, -1, 0, // C
    1,  0, 0, // D
];

var PROP_FACES = [
    0, 1, 3, 2
];

function createPropeller (ctrPos, rotationOffset, rotationRate) {
    var model = mat4.create();
    var pos = vec3.create();
    vec3.add(pos, ctrPos, vec3.fromValues(0, 1, 0));
    mat4.rotateZ(model, model, rotationOffset + time * rotationRate);
    mat4.translate(model, model, pos);
    mat4.scale(model, model, vec3.fromValues(0.1, 1, 1));
    return model;
}

var time = 0;
function updateWebGL (gl, prog, rotationalSpeedPct, propAnglePct) {
    time++;

    var projection = mat4.create();
    mat4.perspective(projection, Math.PI/2, 4/3, 0.1, 100); // random defaults
    gl.uniformMatrix4fv(prog.projLocation, false, projection);

    var view = mat4.create();
    mat4.lookAt(view, vec3.fromValues(0, 0, -2), vec3.fromValues(0, 0, 0), [0, 1, 0]); // y axis is up
    var propAngle = lerp(propAnglePct, 0, Math.PI / 2);
    mat4.rotateY(view, view, propAngle);
    gl.uniformMatrix4fv(prog.viewLocation, false, view);

    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(prog.positionLocation);

    var center = vec3.fromValues(0, 0, 0);
    var qtrRot = Math.PI / 2;
    var rotRate = lerp(rotationalSpeedPct, MIN_ROTATIONAL_SPEED, MAX_ROTATIONAL_SPEED);
    var rotDist = 1 / rotRate;
    renderPropeller(gl, prog, createPropeller(center, 0 * qtrRot, rotRate));
    renderPropeller(gl, prog, createPropeller(center, 1 * qtrRot, rotRate));
    renderPropeller(gl, prog, createPropeller(center, 2 * qtrRot, rotRate));
    renderPropeller(gl, prog, createPropeller(center, 3 * qtrRot, rotRate));
}

function renderPropeller (gl, prog, model) {
    gl.uniformMatrix4fv(prog.modelLocation, false, model);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
}

function setupModel (gl) {
    var verts = Float32Array.from(PROP_VERTS);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var indxs = Uint8Array.from(PROP_FACES);
    var elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

var shutterData = new ImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
var cursorData = new Uint8ClampedArray(CANVAS_WIDTH * 4);
for (let i=0; i < CANVAS_WIDTH * 4; i += 4) {
    cursorData[i+0] = 255;
    cursorData[i+1] = 0;
    cursorData[i+2] = 0;
    cursorData[i+3] = 255;
}
var shutterCursor = new ImageData(cursorData, CANVAS_WIDTH, 1);
function fillShutterRow (sourceData, rowN) {
    var rowWidth = CANVAS_WIDTH * 4;
    var startIdx = rowN * rowWidth;
    var endIdx = (rowN + 1) * rowWidth;
    shutterData.data.set(sourceData.subarray(startIdx, endIdx), startIdx);
    if (rowN < CANVAS_HEIGHT - 1) {
        shutterData.data.set(cursorData, endIdx);
    }
}

var currShutterRow = 0;
function updateShutter (gl, shutterCtx) {
    var data = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT * 4);
    gl.readPixels(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, data);

    fillShutterRow(data, currShutterRow);
    fillShutterRow(data, currShutterRow + 1);
    currShutterRow = (currShutterRow + 2) % CANVAS_HEIGHT;
   shutterCtx.putImageData(shutterData, 0, 0);
}

window.onload = function () {
    // init webgl
    var webglCanvas = document.getElementById('webgl');
    webglCanvas.width = CANVAS_WIDTH;
    webglCanvas.height = CANVAS_HEIGHT;

    var gl = webglCanvas.getContext('webgl');
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(prog.positionLocation);

    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");

    gl.useProgram(prog);

    setupModel(gl);

    // init 2d canvas
    var shutterCanvas = document.getElementById('shutter');
    shutterCanvas.width = CANVAS_WIDTH;
    shutterCanvas.height = CANVAS_HEIGHT;
    var shutterCtx = shutterCanvas.getContext('2d');

    // controls
    var rotationalSpeedElem = document.getElementById('rotationalSpeed');
    var propAngleElem = document.getElementById('propAngle');

    function webglMainloop () {
        updateWebGL(gl, prog, rotationalSpeedElem.value, propAngleElem.value);
        window.requestAnimationFrame(webglMainloop);
    }

    function shutterMainloop () {
        updateShutter(gl, shutterCtx);
        window.requestAnimationFrame(shutterMainloop);
    }

    webglMainloop();
    shutterMainloop();
}
