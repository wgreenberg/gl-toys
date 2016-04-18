var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var GRID_HEIGHT = 32;
var GRID_WIDTH = 32;

var FRAMERATE = 60;

function createRibbon (numSegments) {
    var dy = 2/numSegments; // height per segment
    var verts = [
        -1, -1, 0,
         1, -1, 0,
    ];
    var idxs = [];
    var idx = 1;
    for (var i=1; i<=numSegments; i++) {
        verts.push(-1, -1 + i*dy, 0);
        idx++;
        idxs.push(idx-2, idx-1, idx); // odd

        verts.push( 1, -1 + i*dy, 0);
        idx++;
        idxs.push(idx-1, idx-2, idx); // even
    }
    return {
        verts: verts,
        idxs: idxs,
    };
}

var RIBBON = createRibbon(1024);

function createStrips (numStrips) {
    var models = [];
    for (var i=-numStrips/2; i<numStrips/2; i++) {
        var model = mat4.create();
        var position = vec3.fromValues(i*2.5, 0, -50);
        var size = vec3.fromValues(1, 25, 1);
        mat4.translate(model, model, position);
        mat4.scale(model, model, size);
        models.push(model);
    }
    return models;
}

var time = 0;
function update (gl, prog, camera, fTop, fBot) {
    time += 0.5;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 60 * Math.PI/180, 1, 0.1, 300); // random defaults

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var step = Float32Array.BYTES_PER_ELEMENT;
    var total = 3;
    var stride = step * total;
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, stride, 0);

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform1i(prog.timeLocation, time);

    var revLightDir = vec3.fromValues(0, 1, 1);
    gl.uniform3fv(prog.reverseLightDirLocation, revLightDir);

    createStrips(16).forEach(function (model, i) {
        var botRad = fBot(time, i) * Math.PI;
        var topRad = fTop(time, i) * Math.PI;

        gl.uniform1f(prog.botRadLocation, botRad);
        gl.uniform1f(prog.topRadLocation, topRad);
        gl.uniformMatrix4fv(prog.modelLocation, false, model);
        gl.drawElements(gl.TRIANGLE_STRIP, RIBBON.idxs.length, gl.UNSIGNED_SHORT, 0);
    });
}

var vertBuffer, elementsBuffer;
function setupModel (gl) {
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    var verts = Float32Array.from(RIBBON.verts);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    var indxs = Uint16Array.from(RIBBON.idxs);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

function toFn (str) {
    try {
    var f = new Function('t', 'i', 'return ' + str + ';');
    var testVal = f(0, 0);
    if ((typeof testVal === 'number') && !isNaN(testVal))
        return f;
    } catch (e) {
    }
}

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

    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");
    prog.topRadLocation = gl.getUniformLocation(prog, "u_top_rad");
    prog.botRadLocation = gl.getUniformLocation(prog, "u_bot_rad");
    prog.reverseLightDirLocation = gl.getUniformLocation(prog, "u_reverseLightDir");

    gl.useProgram(prog);

    setupModel(gl);
    var camera = setupCamera({
        initialAngle: -90,
        speed: 1,
        turnRate: 5,
        disableMovement: true,
    });

    var inputTop = document.getElementById('top');
    var inputBot = document.getElementById('bot');
    var lastTop;
    var lastBot;
    // random equations that look pretty
    inputTop.value = 'Math.cos((t/110) + Math.sin(t/100)*i/10) + Math.sin(t/100 + Math.cos(t/100))';
    inputBot.value = 'Math.cos((t/100) + Math.sin(t/80)*i/10) + Math.sin(t/70 + Math.sin(t/100))';
    window.mainloop = function () {
        if (inputTop.value !== lastTop && toFn(inputTop.value)) {
            fTop = toFn(inputTop.value);
        }
        if (inputBot.value !== lastBot && toFn(inputBot.value)) {
            fBot = toFn(inputBot.value);
        }
        update(gl, prog, camera, fTop, fBot);
        window.requestAnimationFrame(mainloop);
    }

    mainloop();
}
