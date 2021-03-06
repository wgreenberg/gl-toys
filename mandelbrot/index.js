var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var zoom = 1;
var max_zoom = 100000;
var zooming_in = true;
var dz = 1.015;
var time = 0;
function setSceneData (gl, prog) {
    time += 1;
    gl.uniform1i(prog.timeLocation, time);
    gl.uniform2f(prog.locationLocation, 0.3889949, 0.2645072); // magic numbers I found
    gl.uniform1f(prog.zoomLocation, zoom);

    if (zooming_in)
        zoom *= dz;
    else
        zoom /= dz;

    if (max_zoom - zoom < 1)
        zooming_in = false;
    else if (zoom < 1)
        zooming_in = true;
}

function update (gl, prog) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(1, 0, 0, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var step = Float32Array.BYTES_PER_ELEMENT;
    var total = 3;
    var stride = step * total;
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, stride, 0);

    setSceneData(gl, prog);

    gl.drawElements(gl.TRIANGLE_STRIP, 6, gl.UNSIGNED_SHORT, 0);
}

var vertBuffer;
function setupModel (gl) {
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var verts = Float32Array.from([
       -1,  1, 0,
        1,  1, 0,
       -1, -1, 0,
        1, -1, 0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    var indxs = Uint16Array.from([
        0, 1, 2,
        2, 1, 3,
    ]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    window.gl = gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(prog.positionLocation);

    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.locationLocation = gl.getUniformLocation(prog, "u_location");
    prog.zoomLocation = gl.getUniformLocation(prog, "u_zoom");

    gl.useProgram(prog);

    setupModel(gl);

    window.mainloop = function () {
        update(gl, prog);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
