var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var PANEL_SIZE = 0.25;
var MARGIN = 0.05;

var GRID_HEIGHT = 32;
var GRID_WIDTH = 32;

var FRAMERATE = 60;

// x, y, z, u, v
var PANEL = [
   -1,  1,  1, 0, 0, //A0
   -1,  1,  1, 0, 0, //A1
   -1,  1,  1, 0, 0, //A2
    1,  1,  1, 0, 1, //B3
    1,  1,  1, 1, 0, //B4
    1,  1,  1, 1, 0, //B5
   -1, -1,  1, 1, 0, //C6
   -1, -1,  1, 1, 0, //C7
   -1, -1,  1, 0, 0, //C8
    1, -1,  1, 1, 1, //D9
    1, -1,  1, 1, 1, //D10
    1, -1,  1, 0, 1, //D11
   -1,  1, -1, 0, 0, //E12
   -1,  1, -1, 0, 0, //E13
   -1,  1, -1, 0, 1, //E14
    1,  1, -1, 0, 1, //F15
    1,  1, -1, 1, 1, //F16
    1,  1, -1, 0, 0, //F17
   -1, -1, -1, 1, 0, //G18
   -1, -1, -1, 0, 0, //G19
   -1, -1, -1, 1, 0, //G20
    1, -1, -1, 1, 1, //H21
    1, -1, -1, 0, 0, //H22
    1, -1, -1, 1, 1, //H23
];

var PANEL_NORMALS = [
    0,  0,  1, //A0
   -1,  0,  0, //A1
    0,  1,  0, //A2
    0,  0,  1, //B3
    1,  0,  0, //B4
    0,  1,  0, //B5
    0,  0,  1, //C6
   -1,  0,  0, //C7
    0, -1,  0, //C8
    0,  0,  1, //D9
    1,  0,  0, //D10
    0, -1,  0, //D11
    0,  0, -1, //E12
   -1,  0,  0, //E13
    0,  1,  0, //E14
    0,  0, -1, //F15
    0,  1,  0, //F16
    1,  0,  0, //F17
    0,  0, -1, //G18
   -1,  0,  0, //G19
    0, -1,  0, //G20
    0,  0, -1, //H21
    1,  0,  0, //H22
    0, -1,  0, //H23
];

var ENV_NORMALS = [
    0,  0,  1, //A0
   -1,  0,  0, //A1
    0,  1,  0, //A2
    0,  0,  1, //B3
    1,  0,  0, //B4
    0,  1,  0, //B5
    0,  0,  1, //C6
   -1,  0,  0, //C7
    0,  1,  0, //C8
    0,  0,  1, //D9
    1,  0,  0, //D10
    0,  1,  0, //D11
    0,  0,  1, //E12
   -1,  0,  0, //E13
    0,  1,  0, //E14
    0,  0,  1, //F15
    0,  1,  0, //F16
    1,  0,  0, //F17
    0,  0,  1, //G18
   -1,  0,  0, //G19
    0,  1,  0, //G20
    0,  0,  1, //H21
    1,  0,  0, //H22
    0,  1,  0, //H23
];

var PANEL_FACES = [
    0, 3, 6, 9, //ABCD FRONT
    12, 15, 18, 21, //EFGH BACK
    13, 1, 19, 7, //EAGC LEFT
    17, 4, 22, 10, //FBHD RIGHT
    2, 5, 14, 16, //ABEF TOP
    8, 11, 20, 23, //CDGH BOT
];

var oldDeflection = {};
function getPanels (imageIntensity) {
    var panels = [];
    for (var x=0; x<GRID_HEIGHT; x++) {
        for (var y=0; y<GRID_WIDTH; y++) {
            var model = mat4.create();

            var worldX = (x - GRID_WIDTH/2) * 2 * (PANEL_SIZE + MARGIN);
            var worldY = (y - GRID_HEIGHT/2) * 2 * (PANEL_SIZE + MARGIN) + 1;
            var worldZ = -34;
            var position = vec3.fromValues(worldX, worldY, worldZ);
            mat4.translate(model, model, position);

            // flip x and y axis
            var revX = GRID_WIDTH - x - 1;
            var revY = GRID_HEIGHT - y - 1;
            var intensityPct = (255 - imageIntensity[revX][revY]) / 255;
            var deflection = (intensityPct * 70 - 35) * (Math.PI / 180);

            // poor man's lerp to limit the rotation rate of the panels
            var k = x + ',' + y;
            if (oldDeflection[k] !== undefined && !isNaN(oldDeflection[k])) {
                var lerp = oldDeflection[k] + 0.2 * (deflection - oldDeflection[k]);
                oldDeflection[k] = lerp;
                mat4.rotateX(model, model, lerp);
            } else {
                oldDeflection[k] = deflection;
                mat4.rotateX(model, model, deflection);
            }

            var scale = vec3.fromValues(PANEL_SIZE, PANEL_SIZE, 0.1);
            mat4.scale(model, model, scale);

            panels.push(model);
        }
    }
    return panels;
}

var time = 0;
function update (gl, prog, camera) {
    time++;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(239/255, 245/255, 235/255, 1);

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 60 * Math.PI/180, 1, 0.1, 300); // random defaults

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.BYTE, false, 5, 0);
    gl.vertexAttribPointer(prog.uvLocation, 2, gl.BYTE, false, 5, 3);

    gl.bindBuffer(gl.ARRAY_BUFFER, panelNormBuffer);
    gl.vertexAttribPointer(prog.normLocation, 3, gl.BYTE, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, panelTex);

    var revLightDir = vec3.fromValues(0, 1, 1);

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform1i(prog.timeLocation, time);
    gl.uniform3fv(prog.reverseLightDirLocation, revLightDir);

    getPanels(IMAGE).forEach(function (panel) {
        gl.uniformMatrix4fv(prog.modelLocation, false, panel);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 8);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 12);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 16);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 20);
    });

    var carpetModel = mat4.create();
    var carpetPos = vec3.fromValues(0, 0, -20);
    var carpetScale = vec3.fromValues(15, 15, 15);
    mat4.translate(carpetModel, carpetModel, carpetPos);
    mat4.scale(carpetModel, carpetModel, carpetScale);

    gl.bindBuffer(gl.ARRAY_BUFFER, envNormBuffer);
    gl.vertexAttribPointer(prog.normLocation, 3, gl.BYTE, false, 0, 0);
    gl.uniformMatrix4fv(prog.modelLocation, false, carpetModel);
    gl.bindTexture(gl.TEXTURE_2D, wallTex);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
    gl.bindTexture(gl.TEXTURE_2D, floorTex);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 20);
}

var vertBuffer, panelNormBuffer, envNormBuffer, elementsBuffer;
function setupModel (gl) {
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var verts = Int8Array.from(PANEL);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    panelNormBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, panelNormBuffer);
    var panelNorms = Int8Array.from(PANEL_NORMALS);
    gl.bufferData(gl.ARRAY_BUFFER, panelNorms, gl.STATIC_DRAW);

    envNormBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, envNormBuffer);
    var envNorms = Int8Array.from(ENV_NORMALS);
    gl.bufferData(gl.ARRAY_BUFFER, envNorms, gl.STATIC_DRAW);

    elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    var indxs = Uint8Array.from(PANEL_FACES);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

function getImageIntensity () {
    if (window.captureImage)
        return window.captureImage(GRID_HEIGHT, GRID_WIDTH);

    // fallback to pretty waves if no webcam available
    var img = [];
    for (var x=0; x<GRID_WIDTH; x++) {
        img.push([])
        for (var y=0; y<GRID_HEIGHT; y++) {
            // neato ripple effect
            var rX = x - GRID_WIDTH/2;
            var rY = y - GRID_HEIGHT/2;
            var v = Math.sin(Math.sqrt((rX*rX + rY*rY) * 2) - time/20);
            img[x].push(255 * (v + 1)/2);
        }
    }
    return img;
}

var panelTex, floorTex, wallTex;
window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    // http://opengameart.org/node/10411
    panelTex = loadImage(gl, 'wood.jpg');
    // http://opengameart.org/node/8684
    floorTex = loadImage(gl, 'woodfloor.jpg');
    // http://opengameart.org/node/10021
    wallTex = loadImage(gl, 'stuccowall.png');

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(prog.positionLocation);

    prog.uvLocation = gl.getAttribLocation(prog, "a_uv");
    gl.enableVertexAttribArray(prog.uvLocation);

    prog.normLocation = gl.getAttribLocation(prog, "a_normal");
    gl.enableVertexAttribArray(prog.normLocation);

    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");
    prog.reverseLightDirLocation = gl.getUniformLocation(prog, "u_reverseLightDir");

    gl.useProgram(prog);

    setupModel(gl);
    setupWebcamSampler(GRID_WIDTH);
    var camera = setupCamera(-90);

    IMAGE = getImageIntensity();

    setInterval(function () {
        IMAGE = getImageIntensity();
    }, (1/FRAMERATE) * 1000);
    function mainloop() {
        update(gl, prog, camera);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
