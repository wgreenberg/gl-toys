var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var GRID_HEIGHT = 32;
var GRID_WIDTH = 32;

var time = 0;
function update (gl, prog, camera) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);

    time += 1;
    gl.uniform1i(prog.timeLocation, time);

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 60 * Math.PI/180, 1, 0.1, 300); // random defaults

    var viewproj = mat4.create();
    mat4.mul(viewproj, projection, view);
    gl.uniformMatrix4fv(prog.viewprojLocation, false, viewproj);

    // make the light spin
    var spinRadius = 2.5;
    var lightPos = vec3.fromValues(Math.cos(time/40) * spinRadius, Math.cos(time/100) * spinRadius, Math.sin(time/40) * spinRadius);
    gl.uniform3fv(prog.lightPosLocation, lightPos);

    // draw that rabbit
    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
    gl.bindBuffer(gl.ARRAY_BUFFER, bunny.verts.buffer);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, stride, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bunny.norms.buffer);
    gl.vertexAttribPointer(prog.normLocation, 3, gl.FLOAT, false, stride, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bunny.indxs.buffer);

    gl.uniform1f(prog.ambientLocation, 0.01);
    gl.uniform1f(prog.shininessLocation, 64.1);
    gl.uniform1f(prog.attenuationLocation, 0.0);
    gl.uniform3fv(prog.cameraPosLocation, camera.pos);
    gl.uniform3fv(prog.colorLocation, vec3.fromValues(0.2, 0.3, 0.9));
    gl.uniform3fv(prog.specularColorLocation, vec3.fromValues(0.5, 0.5, 0.5));

    var model = mat4.create();
    mat4.rotateY(model, model, time/90);
    gl.uniformMatrix4fv(prog.modelLocation, false, model);

    gl.drawElements(gl.TRIANGLES, bunny.indxs.length, gl.UNSIGNED_SHORT, 0);

    // draw a tiny illumibunny to show where the light is
    var illumibunny = mat4.create();
    mat4.translate(illumibunny, illumibunny, lightPos);
    mat4.scale(illumibunny, illumibunny, vec3.fromValues(0.1, 0.1, 0.1));
    mat4.rotateY(illumibunny, illumibunny, -time/40);
    gl.uniform3fv(prog.colorLocation, vec3.fromValues(0.5, 0.5, 0.5));
    gl.uniformMatrix4fv(prog.modelLocation, false, illumibunny);

    gl.uniform1f(prog.ambientLocation, 9.0);
    gl.uniform1f(prog.shininessLocation, 1.0);
    gl.uniform1f(prog.attenuationLocation, 0.0);

    gl.drawElements(gl.TRIANGLES, bunny.indxs.length, gl.UNSIGNED_SHORT, 0);

    // draw the bunny a room to live in
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.verts.buffer);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, stride, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.norms.buffer);
    gl.vertexAttribPointer(prog.normLocation, 3, gl.FLOAT, false, stride, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indxs.buffer);

    gl.uniform1f(prog.ambientLocation, 0.001);
    gl.uniform1f(prog.shininessLocation, 512.0);
    gl.uniform1f(prog.attenuationLocation, 1.5);
    gl.uniform3fv(prog.colorLocation, vec3.fromValues(0.9, 0.9, 0.9));
    gl.uniform3fv(prog.specularColorLocation, vec3.fromValues(0.9, 0.9, 0.9));

    var room = mat4.create();
    mat4.scale(room, room, vec4.fromValues(4, 4, 4));
    gl.uniformMatrix4fv(prog.modelLocation, false, room);

    gl.drawElements(gl.TRIANGLES, cube.indxs.length, gl.UNSIGNED_SHORT, 0);
}

var bunny, cube;
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
    cube = loadObjFile(gl, 'cube.obj');

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(prog.positionLocation);
    prog.normLocation = gl.getAttribLocation(prog, "a_normal");
    gl.enableVertexAttribArray(prog.normLocation);

    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.ambientLocation = gl.getUniformLocation(prog, "u_ambient");
    prog.attenuationLocation = gl.getUniformLocation(prog, "u_attenuation");
    prog.shininessLocation = gl.getUniformLocation(prog, "u_shininess");
    prog.viewprojLocation = gl.getUniformLocation(prog, "u_viewproj");
    prog.cameraPosLocation = gl.getUniformLocation(prog, "u_cameraPos");
    prog.lightPosLocation = gl.getUniformLocation(prog, "u_lightPos");
    prog.colorLocation = gl.getUniformLocation(prog, "u_color");
    prog.specularColorLocation = gl.getUniformLocation(prog, "u_specularColor");

    gl.useProgram(prog);

    var camera = setupCamera({
        initialAngle: -90,
        speed: 1,
        turnRate: 5,
        initialPos: vec3.fromValues(0, 0, 10.0),
    });

    window.mainloop = function () {
        update(gl, prog, camera);
        window.requestAnimationFrame(mainloop);
    };

    mainloop();
};
