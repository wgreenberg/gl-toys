var CANVAS_HEIGHT = 500;
var CANVAS_WIDTH = 500;

var PANEL_HEIGHT = 0.5;
var PANEL_WIDTH = 0.5;
var PANEL_DEPTH = 0.5;

var GRID_HEIGHT = 16;
var GRID_WIDTH = 16;
var PANEL = [
    -1,  1,  1, //A
     1,  1,  1, //B
    -1, -1,  1, //C
     1, -1,  1, //D
     0,  0,  0, //E
];

var PANEL_FACES = [
    0, 1, 2,
    1, 2, 3,
    0, 3, 4,
    0, 1, 4,
    1, 3, 4,
    2, 3, 4,
];


function getPanels (imageIntensity) {
    var panels = [];
    for (var x=0; x<GRID_HEIGHT; x++) {
        for (var y=0; y<GRID_WIDTH; y++) {
            var model = mat4.create();

            var worldX = (x - GRID_WIDTH/2) * PANEL_WIDTH * 2;
            var worldY = (y - GRID_HEIGHT/2) * PANEL_HEIGHT * 2;
            var worldZ = -10;
            var position = vec3.fromValues(worldX, worldY, worldZ);
            mat4.translate(model, model, position);

            var intensityPct = (255 - imageIntensity[x][y]) / 255;
            var intensityPct = (255 * Math.sin(Math.sqrt(x*x/10 + y*y/10) - time/10)) / 255;
            var deflection = (intensityPct * 90) * (Math.PI / 180)
            mat4.rotateY(model, model, deflection);

            var scale = vec3.fromValues(PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH);
            mat4.scale(model, model, scale);

            panels.push(model);
        }
    }
    return panels;
}

/*
var mX=0, mY=0;
document.onmousemove = function (event) {
    mX = event.pageX;
    mY = event.pageY;
}
*/

var time = 0;
function update (gl, prog, imageIntensity) {
    time++;
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // noop
    var view = mat4.create();

    var projection = mat4.create();
    mat4.perspective(projection, 90 * Math.PI/180, 4/3, 0.1, 100); // random defaults

    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(prog.positionLocation);

    /*
    var cX = (mX - CANVAS_WIDTH/2) / 100;
    var cY = (mY - CANVAS_HEIGHT/2) / 100;
    var revLightDir = vec3.fromValues(cX, cY, 1);
    */
    var revLightDir = vec3.fromValues(0, 0, 1);

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform3fv(prog.reverseLightDirLocation, revLightDir);

    getPanels(imageIntensity).forEach(function (panel) {
        gl.uniformMatrix4fv(prog.modelLocation, false, panel);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 0);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 3);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 6);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 9);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 12);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 15);
    });
}

function setupModel (gl) {
    var verts = Float32Array.from(PANEL);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var indxs = Uint8Array.from(PANEL_FACES);
    var elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

function getImageIntensity () {
    var img = [];
    for (var x=0; x<GRID_WIDTH; x++) {
        img.push([])
        for (var y=0; y<GRID_HEIGHT; y++) {
            img[x].push(255 * Math.sin(x/5 + y/5));
        }
    }
    return img;
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

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");
    prog.reverseLightDirLocation = gl.getUniformLocation(prog, "u_reverseLightDir");

    gl.useProgram(prog);

    setupModel(gl);

    var imageIntensity = getImageIntensity();
    function mainloop() {
        update(gl, prog, imageIntensity);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
