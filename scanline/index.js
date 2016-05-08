var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;
var SCREEN_HEIGHT = 16;
var SCREEN_WIDTH = 0.5;

function createModel () {
    var model = mat4.create();
    var position = vec3.fromValues(16 * (pct - 1/2), -5, -30);
    var size = vec3.fromValues(SCREEN_WIDTH, SCREEN_HEIGHT, 0);
    mat4.translate(model, model, position);
    mat4.scale(model, model, size);
    return model;
}

var pct = 0;
var time = 0;
function update (gl, prog, camera) {
    time++;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 60 * Math.PI/180, 1, 0.1, 300); // random defaults

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var step = Float32Array.BYTES_PER_ELEMENT;
    var total = 3 + 2;
    var stride = step * total;
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(prog.uvLocation, 2, gl.FLOAT, false, stride, 3 * step);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, screenTex);

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform1i(prog.timeLocation, time);

    pct = (Math.cos(time/8) + 1)/2;
    gl.uniformMatrix4fv(prog.modelLocation, false, createModel());
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 8);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 12);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 16);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 20);
}

function createTex (gl) {
    var texId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texId);

    var emptyData = new Uint8Array(4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, emptyData);

    return texId;
}

var vertBuffer, elementsBuffer;
function setupModel (gl) {
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var verts = Float32Array.from(CUBE.verts);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    var indxs = Uint8Array.from(CUBE.faces);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

var screenTex;
window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(prog.positionLocation);

    prog.uvLocation = gl.getAttribLocation(prog, "a_uv");
    gl.enableVertexAttribArray(prog.uvLocation);

    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");

    gl.useProgram(prog);

    screenTex = createTex(gl);
    setupModel(gl);
    setupWebcamSampler();
    var camera = setupCamera({
        initialAngle: -90,
        speed: 3,
        turnRate: 10,
    });

    function mainloop() {
        var scanwidth = 5;
        if (window.scanCols) {
            var data = window.scanCols(1 - pct, scanwidth);
            var d_w = scanwidth;
            var d_h = (data.length / (4 * d_w));

            gl.bindTexture(gl.TEXTURE_2D, screenTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, d_w, d_h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
        update(gl, prog, camera);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
