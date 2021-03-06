var CANVAS_HEIGHT = 800;
var CANVAS_WIDTH = 800;

var COLUMN = [
    -1,  1,  1, // A
     1,  1,  1, // B
    -1, -1,  1, // C
     1, -1,  1, // D
    -1,  1, -1, // E
     1,  1, -1, // F
    -1, -1, -1, // G
     1, -1, -1, // H
];

var COLUMN_FACES = [
    0, 1, 2, 3,
    4, 5, 6, 7,
    4, 0, 6, 2,
    5, 1, 7, 3,
];

var WALL_HEIGHT = 5;
var WALL_WIDTH = 2;

function createWall (mazeX, mazeY) {
    model = mat4.create();

    var worldX = mazeX * WALL_WIDTH * 2;
    var worldY = 0;
    var worldZ = mazeY * WALL_WIDTH * 2;
    var position = vec3.fromValues(worldX, worldY, worldZ);
    mat4.translate(model, model, position);

    var scale = vec3.fromValues(WALL_WIDTH, WALL_HEIGHT, WALL_WIDTH);
    mat4.scale(model, model, scale);

    return {
        model: model,
        pos: position,
    };
}
function setupModel (gl) {
    var verts = Float32Array.from(COLUMN);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var indxs = Uint8Array.from(COLUMN_FACES);
    var elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indxs, gl.STATIC_DRAW);
}

function createWalls (userStart, mazeData) {
    var walls = [];
    for (var y in mazeData) {
        for (var x in mazeData[y]) {
            var letter = mazeData[y][x];
            var normalizedX = x - userStart.x;
            var normalizedY = y - userStart.y;
            if (letter == '1')
                walls.push(createWall(normalizedX, normalizedY));
        }
    }
    return walls;
}

var time = 0;
function update (gl, prog, walls, camera) {
    time++;

    var view = mat4.create();
    mat4.lookAt(view, camera.pos, camera.look, [0, 1, 0]); // y axis is up

    var projection = mat4.create();
    mat4.perspective(projection, 90 * Math.PI/180, 4/3, 0.1, 100); // random defaults

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1i(prog.timeLocation, time);
    gl.vertexAttribPointer(prog.positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(prog.positionLocation);

    walls.forEach(function (w) {
        renderWall(gl, prog, w.model, view, projection);
    });
}

function renderWall (gl, prog, model, view, projection) {
    gl.uniformMatrix4fv(prog.modelLocation, false, model);
    gl.uniformMatrix4fv(prog.viewLocation, false, view);
    gl.uniformMatrix4fv(prog.projLocation, false, projection);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 0);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 4);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 8);
    gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_BYTE, 12);
}

window.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.style = 'float: left;'
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    document.body.appendChild(canvas);

    var gl = canvas.getContext('webgl');
    window.gl = gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    var prog = createProgram(gl, 'vertex.glsl', 'fragment.glsl');
    if (!prog)
        return;
    prog.positionLocation = gl.getAttribLocation(prog, "a_position");
    prog.timeLocation = gl.getUniformLocation(prog, "u_time");
    prog.modelLocation = gl.getUniformLocation(prog, "u_model");
    prog.viewLocation = gl.getUniformLocation(prog, "u_view");
    prog.projLocation = gl.getUniformLocation(prog, "u_proj");

    gl.useProgram(prog);

    setupModel(gl);
    var camera = setupCamera({
        initialAngle: 45,
        speed: 1,
        turnRate: 10,
    });
    var initialPosition = {
        x: -2,
        y: -2,
    };

    maze = createMaze(8, 8)
    var walls = createWalls(initialPosition, maze);

    function mainloop() {
        update(gl, prog, walls, camera);
        window.requestAnimationFrame(mainloop);
    }

    mazeString = maze.join('\n');
    var pre = document.createElement('pre');
    pre.innerHTML = 'WASD controls, Q/E strafe, starts at the top left of maze looking SOUTH\n\n';
    pre.innerHTML += mazeString;
    pre.style = 'float: left;'
    document.body.appendChild(pre);

    mainloop();
};
