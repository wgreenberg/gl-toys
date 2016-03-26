var HEIGHT = 400;
var WIDTH = 400;

var SQUARE = [
    -1, -1, 1,
    -1,  1, 1,
     1,  1, 1,
     1, -1, 1,
];

var SQUARE_FACE = [
    0, 1, 3, 2,
];

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

    return prog;
}

function setupModel (gl) {
    var verts = Uint8Array.from(SQUARE);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var indxs = Uint8Array.from(SQUARE_FACE);
    var elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

var time = 0;
function update (gl, prog) {
    time++;
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);

    gl.uniform1i(prog.timeLocation, time);

    gl.vertexAttribPointer(prog.positionLocation, 3, gl.BYTE, false, 0, 0);
    gl.enableVertexAttribArray(prog.positionLocation);

    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
}

window.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    document.body.appendChild(canvas);

    var gl = canvas.getContext('webgl');
    gl.viewport(0, 0, WIDTH, HEIGHT);

    setupModel(gl);
    prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');

    function mainloop() {
        update(gl, prog);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
};
