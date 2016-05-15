var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 1200;
var NUM_BOIDS = 64 * 64;
var SQRT_BOIDS = Math.floor(Math.sqrt(NUM_BOIDS));
var time = 0;

var params = {
    useCompute: true,
    useDebug: false,
    boxSize: 100,
    comfortZone: 2.0,
    alignmentC: 8.0,
    cohesionC: 0.1,
    randomC: 0.5,
    separationC: 1.0,
    cameraZ: 50.0,
    maxV: 0.3,
};

function update (gl, render, compute, debug) {
    time += 1;

    var curr, prev;
    if (params.useCompute && time % 2 === 0) {
        curr = fbo1;
        prev = fbo2;
    } else {
        curr = fbo2;
        prev = fbo1;
    }

    var step = Float32Array.BYTES_PER_ELEMENT;

    if (params.useCompute) {
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

        gl.uniform1i(compute.timeLocation, time % 1e9);
        gl.uniform1f(compute.boxSizeLocation, params.boxSize);
        gl.uniform1f(compute.maxVLocation, params.maxV);
        gl.uniform1f(compute.comfortZoneLocation, params.comfortZone);
        gl.uniform1f(compute.alignmentCLocation, params.alignmentC);
        gl.uniform1f(compute.cohesionCLocation, params.cohesionC);
        gl.uniform1f(compute.separationCLocation, params.separationC);
        gl.uniform1f(compute.randomCLocation, params.randomC);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad.buffer);
        gl.vertexAttribPointer(compute.positionLocation, 3, gl.FLOAT, false, step * quad.size, 0);
        gl.drawArrays(gl.TRIANGLES, 0, quad.count);
    }

    // actually draw to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearColor(0, 1, 1, 1);

    if (params.useDebug) {
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

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, curr.velocityTex);
        gl.uniform1i(render.currVLocation, 1);

        var projection = mat4.create();
        var maxDist = params.cameraZ + params.boxSize/2;
        mat4.perspective(projection, 60 * Math.PI/180, CANVAS_WIDTH/CANVAS_HEIGHT, 0.1, maxDist);
        gl.uniformMatrix4fv(render.projLocation, false, projection);

        gl.uniform1f(render.boxSizeLocation, params.boxSize);
        gl.uniform3f(render.cameraPosLocation, 0, 0, params.cameraZ);

        gl.bindBuffer(gl.ARRAY_BUFFER, particleUVs.buffer);
        gl.vertexAttribPointer(render.uvLocation, 2, gl.FLOAT, false, step * particleUVs.size, 0);
        gl.drawArrays(gl.POINTS, 0, NUM_BOIDS);
    }
}

// make a grid of evenly spaced UV coordinates
function getUVGrid () {
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
    verts = Float32Array.from(getUVGrid());
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

    var positionTex = createTex(gl, width, height, params.boxSize);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, positionTex, 0);

    var velocityTex = createTex(gl, width, height, params.maxV);
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
    computeProg.boxSizeLocation = gl.getUniformLocation(computeProg, 'u_boxSize');
    computeProg.comfortZoneLocation = gl.getUniformLocation(computeProg, 'u_comfortZone');
    computeProg.alignmentCLocation = gl.getUniformLocation(computeProg, 'u_alignmentC');
    computeProg.cohesionCLocation = gl.getUniformLocation(computeProg, 'u_cohesionC');
    computeProg.separationCLocation = gl.getUniformLocation(computeProg, 'u_separationC');
    computeProg.randomCLocation = gl.getUniformLocation(computeProg, 'u_randomC');
    computeProg.maxVLocation = gl.getUniformLocation(computeProg, 'u_maxV');

    return computeProg;
}

function hookupInput (param) {
    var e = param == 'useCompute' || param == 'useDebug' ? 'click' : 'input';
    document.getElementById(param).addEventListener(e, function () {
        if (param == 'useCompute' || param == 'useDebug')
            params[param] = this.checked;
        else
            params[param] = parseFloat(this.value);
    });
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
    render.currVLocation = gl.getUniformLocation(render, 'u_currV');
    render.projLocation = gl.getUniformLocation(render, "u_proj");
    render.boxSizeLocation = gl.getUniformLocation(render, 'u_boxSize');
    render.cameraPosLocation = gl.getUniformLocation(render, 'u_cameraPos');

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

    for (var param in params) {
        hookupInput(param);
    }

    window.mainloop = function () {
        update(gl, render, compute, debug);
        window.requestAnimationFrame(mainloop);
    };

    mainloop();
};
