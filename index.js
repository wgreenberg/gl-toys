var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var GRID_HEIGHT = 32;
var GRID_WIDTH = 32;

var FRAMERATE = 60;

function createModel () {
    var model = mat4.create();
    var position = vec3.fromValues(0, 0, -22);
    var size = vec3.fromValues(8, 8, 8);
    mat4.translate(model, model, position);
    mat4.scale(model, model, size);
    mat4.rotateY(model, model, time * Math.PI/180);
    mat4.rotateX(model, model, time * Math.PI/180 / 2);
    return model;
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

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform1i(prog.timeLocation, time);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lastTex);

    gl.uniformMatrix4fv(prog.modelLocation, false, createModel());
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 8);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 12);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 16);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 20);

    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, CANVAS_HEIGHT, CANVAS_HEIGHT);
}

var vertBuffer, elementsBuffer;
function setupModel (gl) {
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var verts = Int8Array.from(CUBE.verts);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    var indxs = Uint8Array.from(CUBE.faces);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

function createTex () {
    var texId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texId);

    var emptyData = new Uint8Array(CANVAS_HEIGHT * CANVAS_WIDTH * 4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_HEIGHT, CANVAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, emptyData);

    return texId;
}

var lastTex;
window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    window.gl = gl;
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

    setupModel(gl);
    var camera = setupCamera(-90);
    lastTex = createTex();

    window.mainloop = function () {
        update(gl, prog, camera);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
