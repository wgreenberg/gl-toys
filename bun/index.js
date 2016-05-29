var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var GRID_HEIGHT = 32;
var GRID_WIDTH = 32;

var time = 0;
function update (gl, prog, camera) {
    time += 1;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(1, 1, 1, 1);

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 60 * Math.PI/180, 1, 0.1, 300); // random defaults

    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, bunny.verts.buffer);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, stride, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bunny.norms.buffer);
    gl.vertexAttribPointer(prog.normLocation, 3, gl.FLOAT, false, stride, 0);

    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.uniform1i(prog.timeLocation, time);

    var lightPos = vec3.fromValues(Math.cos(time/30) * 2, 0, Math.sin(time/30) * 2);
    gl.uniform3fv(prog.lightPosLocation, lightPos);

    gl.uniform3fv(prog.cameraPosLocation, camera.pos);

    var model = mat4.create();
    gl.uniformMatrix4fv(prog.modelLocation, false, model);
    gl.drawElements(gl.TRIANGLES, bunny.indxs.length, gl.UNSIGNED_SHORT, 0);

    // draw a tiny illumibunny to show where the light is
    var illumibunny = mat4.create();
    mat4.translate(illumibunny, illumibunny, lightPos);
    mat4.scale(illumibunny, illumibunny, vec3.fromValues(0.1, 0.1, 0.1));
    gl.uniformMatrix4fv(prog.modelLocation, false, illumibunny);
    gl.drawElements(gl.TRIANGLES, bunny.indxs.length, gl.UNSIGNED_SHORT, 0);
}

var bunny;
window.onload = function () {
    var canvas = document.getElementById('webgl');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var gl = canvas.getContext('webgl');
    window.gl = gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    bunny = loadObjFile(gl, 'bunny.obj');

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(prog.positionLocation);
    prog.normLocation = gl.getAttribLocation(prog, "a_normal");
    gl.enableVertexAttribArray(prog.normLocation);

    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");
    prog.cameraPosLocation = gl.getUniformLocation(prog, "u_cameraPos");
    prog.lightPosLocation = gl.getUniformLocation(prog, "u_lightPos");

    gl.useProgram(prog);

    var camera = setupCamera({
        initialAngle: -90,
        speed: 1,
        turnRate: 5,
        initialPos: vec3.fromValues(0, 0, 4.0),
    });

    window.mainloop = function () {
        update(gl, prog, camera);
        window.requestAnimationFrame(mainloop);
    };

    mainloop();
};
