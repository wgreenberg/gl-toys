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

function loadObjFile(gl, path) {
    var objData = fetchFile(path);
    var lines = objData.split('\n');

    var verts = [0.0, 0.0, 0.0]; // OBJ files are 1 indexed for some reason..?
    var indxs = [];

    lines.forEach(function (line, i) {
        if (line.length === 0) return;
        var tokens = line.split(' ');
        switch (tokens[0]) {
        case '#': // ignore comments
            break;
        case 'v':
            verts.push(parseFloat(tokens[1]));
            verts.push(parseFloat(tokens[2]));
            verts.push(parseFloat(tokens[3]));
            break;
        case 'f':
            indxs.push(parseInt(tokens[1]));
            indxs.push(parseInt(tokens[2]));
            indxs.push(parseInt(tokens[3]));
            break;
        default:
            throw new Error('wtf is ' + tokens[0]);
        }
    });

    var model = {
        verts: {
            buffer: gl.createBuffer(),
            length: verts.length,
            size: verts.length * Float32Array.BYTES_PER_ELEMENT,
        },
        indxs: {
            buffer: gl.createBuffer(),
            length: indxs.length,
            size: indxs.length * Uint16Array.BYTES_PER_ELEMENT,
        },
        norms: {
            buffer: gl.createBuffer(),
            length: verts.length,
            size: verts.length * Float32Array.BYTES_PER_ELEMENT,
        }
    };

    var norms = calcNorms(verts, indxs);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.norms.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(norms), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.verts.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(verts), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indxs.buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(indxs), gl.STATIC_DRAW);

    return model;
}

function calcNorms(verts, indxs) {
    var vec3norms = [], vec3verts = [];
    verts.forEach(function (vert, i) {
        vec3norms[i] = vec3.create();
        var v1 = verts[i*3+0];
        var v2 = verts[i*3+1];
        var v3 = verts[i*3+2];
        vec3verts[i] = vec3.fromValues(v1, v2, v3);
    });

    for (var i=0; i<indxs.length; i+=3) {
        var a_i = indxs[i+0];
        var b_i = indxs[i+1];
        var c_i = indxs[i+2];
        var a = vec3verts[a_i];
        var b = vec3verts[b_i];
        var c = vec3verts[c_i];
        var e1 = vec3.create();
        var e2 = vec3.create();
        var norm = vec3.create();
        vec3.sub(e1, b, a);
        vec3.sub(e2, c, a);
        vec3.cross(norm, e1, e2);
        vec3.add(vec3norms[a_i], vec3norms[a_i], norm);
        vec3.add(vec3norms[b_i], vec3norms[b_i], norm);
        vec3.add(vec3norms[c_i], vec3norms[c_i], norm);
    }

    var norms = [];
    vec3norms.forEach(function (vec3norm) {
        var normalized = vec3.normalize(vec3norm, vec3norm);
        norms.push(normalized[0]);
        norms.push(normalized[1]);
        norms.push(normalized[2]);
    });

    return norms;
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
        var data = Uint8Array.from(imgData.data);

        gl.bindTexture(gl.TEXTURE_2D, texId);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imgData.width, imgData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    };

    return texId;
}

