var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 1200;
var NUM_BOIDS = 64 * 64;
var SQRT_BOIDS = Math.floor(Math.sqrt(NUM_BOIDS));
var time = 0;
var USE_DEBUG = false;
var USE_COMPUTE = true;

function update (gl, camera, render, compute, debug) {
    time += 1;

    var curr, prev;
    if (time % 2 === 0) {
        curr = fbo1;
        prev = fbo2;
    } else {
        curr = fbo2;
        prev = fbo1;
    }

    var step = Float32Array.BYTES_PER_ELEMENT;

    if (USE_COMPUTE) {
        // run compute step, reading from prev FBO and writing to curr FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, curr.frameBuffer);
        gl.useProgram(compute);
        gl.viewport(0, 0, curr.width, curr.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearColor(0, 1, 1, 1);

        gl.uniform2f(compute.resolutionLocation, SQRT_BOIDS, SQRT_BOIDS);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, prev.positionTex);
        gl.uniform1i(compute.prevPLocation, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, prev.velocityTex);
        gl.uniform1i(compute.prevVLocation, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad.buffer);
        gl.vertexAttribPointer(compute.positionLocation, 3, gl.FLOAT, false, step * quad.size, 0);
        gl.drawArrays(gl.TRIANGLES, 0, quad.count);

        // actually draw to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearColor(1, 0, 0, 1);
    }

    if (USE_DEBUG) {
        gl.useProgram(debug);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, curr.positionTex);
        gl.uniform1i(debug.currPLocation, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad.buffer);
        gl.vertexAttribPointer(debug.positionLocation, 3, gl.FLOAT, false, step * quad.size, 0);
        gl.drawArrays(gl.TRIANGLES, 0, quad.count);
    } else {
        gl.useProgram(render);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, curr.positionTex);
        gl.uniform1i(render.currPLocation, 0);

        var projection = mat4.create();
        mat4.perspective(projection, 60 * Math.PI/180, CANVAS_WIDTH/CANVAS_HEIGHT, 0.1, 300); // random defaults
        gl.uniformMatrix4fv(render.projLocation, false, projection);

        var view = mat4.create();
        mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up
        gl.uniformMatrix4fv(render.viewLocation, false, view);

        gl.bindBuffer(gl.ARRAY_BUFFER, particleUVs.buffer);
        gl.vertexAttribPointer(render.uvLocation, 2, gl.FLOAT, false, step * particleUVs.size, 0);
        gl.drawArrays(gl.POINTS, 0, NUM_BOIDS);
    }
}

// make a grid of boids
function getBoidVerts () {
    var arr = [];
    for (var x=0; x<SQRT_BOIDS; x++) {
        for (var y=0; y<SQRT_BOIDS; y++) {
            arr.push(x/SQRT_BOIDS);
            arr.push(y/SQRT_BOIDS);
        }
    }
    return arr;
}

function getQuadVerts () {
    return Float32Array.from([
        -1.0, -1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0,
         1.0,  1.0,  0.0,
    ]);
}

var particleUVs = {}, quad = {};
function setupModel (gl) {
    var verts;

    particleUVs.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleUVs.buffer);
    verts = Float32Array.from(getBoidVerts());
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    particleUVs.size = 2;
    particleUVs.count = verts.length / particleUVs.size;

    quad.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad.buffer);
    verts = Float32Array.from(getQuadVerts());
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    quad.size = 3;
    quad.count = verts.length / quad.size;
}

function createTex (gl, width, height, maxVal) {
    var texId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texId);

    function norm (x) { return ((x) * 2 - 1) * maxVal; }
    var grid = new Float32Array(NUM_BOIDS * 4);
    for (var i=0; i<SQRT_BOIDS; i++) {
        for (var j=0; j<SQRT_BOIDS; j++) {
            // k'th boid
            var k = (i*SQRT_BOIDS + j) * 4;
            grid[k+0] = norm(Math.random());
            grid[k+1] = norm(Math.random());
            grid[k+2] = norm(Math.random());
            grid[k+3] = 0;
        }
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, grid);

    return texId;
}

function createComputeFBO (gl, ext) {
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    var width = SQRT_BOIDS;
    var height = SQRT_BOIDS;

    var positionTex = createTex(gl, width, height, 10);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, positionTex, 0);

    var velocityTex = createTex(gl, width, height, 0.005);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, velocityTex, 0);

    ext.drawBuffersWEBGL([
        ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
        ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
    ]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        width: width,
        height: height,
        frameBuffer: fbo,
        positionTex: positionTex,
        velocityTex: velocityTex,
    };
}

function createComputeProgram () {
    var computeProg = createProgram(gl, 'computeVertex.glsl', 'computeFragment.glsl');
    if (!computeProg)
        return;
    computeProg.positionLocation = gl.getAttribLocation(computeProg, "a_position");
    gl.enableVertexAttribArray(computeProg.positionLocation);

    computeProg.timeLocation = gl.getUniformLocation(computeProg, 'u_time');
    computeProg.prevPLocation = gl.getUniformLocation(computeProg, 'u_prevP');
    computeProg.prevVLocation = gl.getUniformLocation(computeProg, 'u_prevV');
    computeProg.resolutionLocation = gl.getUniformLocation(computeProg, 'u_resolution');
    return computeProg;
}

var fbo1, fbo2;
window.onload = function () {
    //setTimeout(function () { location.reload(); }, 1000);
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    window.gl = gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // we need float values in our textures for position/velocity
    var f = gl.getExtension('OES_texture_float');
    if (!f) {
        alert('no OES_texture_float');
        return;
    }
    var ext = gl.getExtension('WEBGL_draw_buffers');
    if (!ext) {
        alert('no WEBGL_draw_buffers');
        return;
    }

    // setup the render pass
    var render = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!render)
        return;
    render.uvLocation = gl.getAttribLocation(render, "a_uv");
    gl.enableVertexAttribArray(render.uvLocation);

    render.currPLocation = gl.getUniformLocation(render, 'u_currP');
    render.projLocation = gl.getUniformLocation(render, "u_proj");

    // setup the render pass
    var debug = createProgram(gl, 'debugVertex.glsl', 'debugFragment.glsl');
    if (!debug)
        return;
    debug.positionLocation = gl.getAttribLocation(debug, "a_position");
    gl.enableVertexAttribArray(debug.positionLocation);
    debug.currPLocation = gl.getUniformLocation(debug, 'u_currP');

    // setup the compute pass
    var compute = createComputeProgram();

    fbo1 = createComputeFBO(gl, ext);
    fbo2 = createComputeFBO(gl, ext);

    setupModel(gl);

    var camera = setupCamera({
        initialAngle: 90,
        speed: 1,
        turnRate: 5,
    });

    window.mainloop = function () {
        update(gl, camera, render, compute, debug);
        window.requestAnimationFrame(mainloop);
    };

    mainloop();
};
