// mostly cribbed from the unimpeachable https://github.com/magcius

function fetchFile(path) {
    var request = new XMLHttpRequest();
    request.open('GET', path, false);
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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        return null;
    }

    return prog;
}
