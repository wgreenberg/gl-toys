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

function loadImage(gl, src) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var texId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var img = document.createElement('img');
    img.src = src;

    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = Uint8Array.from(imgData.data)

        gl.bindTexture(gl.TEXTURE_2D, texId);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imgData.width, imgData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    };

    return texId;
}

