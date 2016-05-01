var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 500;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

// random grayscale conversion from https://software.intel.com/en-us/html5/hub/blogs/using-the-getusermedia-api-with-the-html5-video-and-canvas-elements
function getIntensity (r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function setupWebcamSampler () {
    var video = document.getElementById('video');
    var blit = document.createElement('canvas');
    var buffer = document.createElement('canvas');
    var canvas = document.getElementById('fuck');
    canvas.height = CANVAS_HEIGHT;
    canvas.width = CANVAS_WIDTH;
    buffer.height = CANVAS_HEIGHT;
    buffer.width = CANVAS_WIDTH;
    blit.height = CANVAS_HEIGHT;
    blit.width = CANVAS_WIDTH;
    var blitCtx = blit.getContext('2d');
    var canvasCtx = canvas.getContext('2d');
    var bufferCtx = buffer.getContext('2d');

    window.draw = function () {
        canvasCtx.drawImage(buffer, 0, 0);
    };
    navigator.getUserMedia({video: true, audio: false}, function (stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();

        window.scanRows = function (row, n_rows) {
            n_rows = Math.min(n_rows, CANVAS_HEIGHT - row);
            blitCtx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            var vImg = blitCtx.getImageData(0, row, CANVAS_WIDTH, n_rows);
            var bImg = bufferCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            var stride = 4;
            var start = row * (CANVAS_WIDTH * stride);
            for (var i=0; i<(CANVAS_WIDTH * n_rows) * stride; i++) {
                bImg.data[start + i] = vImg.data[i];
            }
            bufferCtx.putImageData(bImg, 0, 0);
            return [];
        };

        window.scanCols = function (col, n_cols) {
            n_cols = Math.min(n_cols, CANVAS_WIDTH - col);
            blitCtx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            var vImg = blitCtx.getImageData(col, 0, n_cols, CANVAS_HEIGHT);
            var bImg = bufferCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            var stride = 4;
            var start = col * stride;
            for (var i=0; i < CANVAS_HEIGHT; i++) {
                for (var j=0; j < n_cols * stride; j++) {
                    bImg.data[(CANVAS_WIDTH * stride * i) + start + j] = vImg.data[j + (i * n_cols * stride)];
                }
            }
            bufferCtx.putImageData(bImg, 0, 0);
            return [];
        };

        video.addEventListener('ended', function () {
            window.scanRow = null;
        });
    }, function (e) { console.log('your webcam dont work:', e); });
}

window.onload = function () {
    setupWebcamSampler();
    function mainloop () {
        window.draw();
        window.requestAnimationFrame(mainloop);
    }
    var i=0;
    var scanheight = 5;
    setInterval(function () {
        if (window.scanRows) {
            i += scanheight;
            window.scanCols(i % CANVAS_WIDTH, scanheight);
        }
    }, 0);
    mainloop();
};
