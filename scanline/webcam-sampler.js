navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

// random grayscale conversion from https://software.intel.com/en-us/html5/hub/blogs/using-the-getusermedia-api-with-the-html5-video-and-canvas-elements
function getIntensity (r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function setupWebcamSampler () {
    var IMG_WIDTH = 50;
    var IMG_HEIGHT = 50;
    var video = document.getElementById('video');
    var blit = document.createElement('canvas');
    blit.height = IMG_HEIGHT;
    blit.width = IMG_WIDTH;
    var blitCtx = blit.getContext('2d');

    navigator.getUserMedia({video: true, audio: false}, function (stream) {
        video.src = window.URL.createObjectURL(stream);
        video.play();

        window.scanCols = function (pct, n_cols) {
            var col = Math.floor(pct * IMG_WIDTH);
            n_cols = Math.min(n_cols, IMG_WIDTH - col);
            blitCtx.drawImage(video, 0, 0, IMG_WIDTH, IMG_HEIGHT);
            var vImg = blitCtx.getImageData(col, 0, n_cols, IMG_HEIGHT);
            return Uint8Array.from(vImg.data);
        };

        video.addEventListener('ended', function () {
            window.scanRows = null;
            window.scanCols = null;
        });
    }, function (e) { console.log('your webcam dont work:', e); });
}
