var CANVAS_HEIGHT = 512;
var CANVAS_WIDTH = 512;
var NUM_BOIDS = 16;
var time = 0;

function update (gl, render, computeP, computeV) {
    time += 1;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearColor(0.5, 0.5, 0, 1);

    var step = Float32Array.BYTES_PER_ELEMENT;
    var total = 5;
    var stride = step * total;

    var currP, prevP, currV, prevV;
    if (time % 1) {
        currP = p1;
        prevP = p2;
        currV = v1;
        prevV = v2;
    } else {
        currP = p2;
        prevP = p1;
        currV = v2;
        prevV = v1;
    }

    // calculate new velocity
    gl.useProgram(computeV);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.vertexAttribPointer(computeV.positionLocation, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(computeV.uvLocation, 2, gl.FLOAT, false, stride, 3 * step);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, prevP);
    gl.uniform1i(computeV.prevPLocation, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, prevV);
    gl.uniform1i(computeV.prevVLocation, 2);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currV);
    gl.drawArrays(gl.POINTS, 0, NUM_BOIDS);

    // calculate new position
    gl.useProgram(computeP);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.vertexAttribPointer(computeP.positionLocation, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(computeP.uvLocation, 2, gl.FLOAT, false, stride, 3 * step);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, currV);
    gl.uniform1i(computeP.currVLocation, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, prevP);
    gl.uniform1i(computeP.prevPLocation, 2);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currP);
    gl.drawArrays(gl.POINTS, 0, NUM_BOIDS);

    // actually draw to screen
    gl.useProgram(render);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.vertexAttribPointer(render.uvLocation, 2, gl.FLOAT, false, stride, 3 * step);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, currP);
    gl.uniform1i(render.currPLocation, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.drawArrays(gl.POINTS, 0, NUM_BOIDS);
}

// make a grid of boids
function getBoidVerts () {
    var dim = Math.sqrt(NUM_BOIDS);
    // normalizes a value to [-1, 1]
    function norm (v) { return ((v/dim) * 2) - 1; }
    var arr = [];
    for (var x=0; x<dim; x++) {
        for (var y=0; y<dim; y++) {
            arr.push(norm(x));
            arr.push(norm(y));
            arr.push(0);
            arr.push(norm(x));
            arr.push(norm(y));
        }
    }
    return arr;
}

var particleBuffer;
function setupModel (gl) {
    particleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    var verts = Float32Array.from(getBoidVerts());
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
}

function createTex (gl, size) {
    var texId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, texId);

    var emptyData = new Float32Array(size * 4);
    var sqrtSize = Math.sqrt(size);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sqrtSize, sqrtSize, 0, gl.RGBA, gl.FLOAT, emptyData);

    return texId;
}

function createComputeProgram (fragpath) {
    var computeProg = createProgram(gl, 'computeVertex.glsl', fragpath);
    if (!computeProg)
        return;
    computeProg.positionLocation = gl.getAttribLocation(computeProg, 'a_position');
    computeProg.uvLocation = gl.getAttribLocation(computeProg, 'a_uv');
    gl.enableVertexAttribArray(computeProg.positionLocation);
    gl.enableVertexAttribArray(computeProg.uvLocation);

    computeProg.timeLocation = gl.getUniformLocation(computeProg, 'u_time');
    computeProg.currPLocation = gl.getUniformLocation(computeProg, 'u_currP');
    computeProg.prevPLocation = gl.getUniformLocation(computeProg, 'u_prevP');
    computeProg.currVLocation = gl.getUniformLocation(computeProg, 'u_currV');
    computeProg.prevVLocation = gl.getUniformLocation(computeProg, 'u_prevV');
    return computeProg;
}

var p1, p2, v1, v2;
window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    window.gl = gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // we need float values in our textures for position/velocity
    var f = gl.getExtension("OES_texture_float");
    if (!f) {
        alert("no OES_texture_float");
        return;
    }

    // setup the render pass
    var render = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!render)
        return;
    render.uvLocation = gl.getAttribLocation(render, "a_uv");

    // setup the compute pass
    var computeV = createComputeProgram('computeVFragment.glsl');
    var computeP = createComputeProgram('computePFragment.glsl');

    setupModel(gl);

    p1 = createTex(gl, NUM_BOIDS);
    p2 = createTex(gl, NUM_BOIDS);
    v1 = createTex(gl, NUM_BOIDS);
    v2 = createTex(gl, NUM_BOIDS);

    window.mainloop = function () {
        update(gl, render, computeP, computeV);
        window.requestAnimationFrame(mainloop);
    };

    mainloop();
};
