var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var GRID_HEIGHT = 64;
var GRID_WIDTH = 64;

// x, y, z, u, v
var PANEL = [
   -1,  1, 1, 0, 0, //A
    1,  1, 1, 0, 1, //B
   -1, -1, 1, 1, 0, //C
    1, -1, 1, 1, 1, //D
    0,  0, 0, 0, 0, //E
];

var PANEL_NORMALS = [
    0,  0,  1,
    0,  0,  1,
    0,  0,  1,
    0,  0,  1,
    0,  0, -1,
];

var PANEL_FACES = [
    0, 1, 2, //ABC
    1, 2, 3, //BCD
    1, 3, 4, //BDE
    2, 3, 4, //CDE
    0, 1, 4, //ABE
    0, 2, 4, //ACE
];

function getPanels (imageIntensity) {
    var panels = [];
    for (var x=0; x<GRID_HEIGHT; x++) {
        for (var y=0; y<GRID_WIDTH; y++) {
            var model = mat4.create();

            var worldX = (x - GRID_WIDTH/2) * 2.5;
            var worldY = (y - GRID_HEIGHT/2) * 2.5;
            var worldZ = -135;
            var position = vec3.fromValues(worldX, worldY, worldZ);
            mat4.translate(model, model, position);

            var intensityPct = (255 - imageIntensity[x][GRID_HEIGHT - y]) / 255;
            var deflection = (intensityPct * 90) * (Math.PI / 180)
            mat4.rotateY(model, model, deflection);

            panels.push(model);
        }
    }
    return panels;
}

var time = 0;
function update (gl, prog, camera) {
    time++;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.2, 0.2, 0.2, 1);

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 60 * Math.PI/180, 4/3, 0.1, 300); // random defaults

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.BYTE, false, 5, 0);
    gl.vertexAttribPointer(prog.uvLocation, 2, gl.BYTE, false, 5, 3);

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.vertexAttribPointer(prog.normLocation, 3, gl.BYTE, false, 0, 0);

    var revLightDir = vec3.fromValues(0, 0, 1);

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform3fv(prog.reverseLightDirLocation, revLightDir);

    getPanels(IMAGE).forEach(function (panel) {
        gl.uniformMatrix4fv(prog.modelLocation, false, panel);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 0);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 6);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 9);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 12);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 15);
    });
}

var vertBuffer, normBuffer, elementsBuffer;
function setupModel (gl) {
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var verts = Int8Array.from(PANEL);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    var norms = Int8Array.from(PANEL_NORMALS);
    gl.bufferData(gl.ARRAY_BUFFER, norms, gl.STATIC_DRAW);

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
            img[x].push(255 * Math.sin(x/5 + y/5 + time/20));
        }
    }
    return img;
}

function videoErr (err) {
    console.log(err);
}

var IMAGE;
window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    // wood texture from http://opengameart.org/node/10411, licensed under CC-BY-SA 3.0
    loadImage(gl, 'wood.jpg');

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
    }, 10);
    function mainloop() {
        update(gl, prog, camera);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
