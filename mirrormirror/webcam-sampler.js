navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

// find the x,y coordinate in a downsampled array
function getDownsampledCoords (i, dsWidth, blitWidth) {
    // find coords in blit img
    var blitX = i % blitWidth;
    var blitY = Math.floor(i / blitWidth);

    var pxPerDownsampledPx = blitWidth/dsWidth;
    // convert blit coords to downsampled coords
    var dsX = Math.floor(blitX / pxPerDownsampledPx);
    var dsY = Math.floor(blitY / pxPerDownsampledPx);

    return {
        x: dsX,
        y: dsY,
    };
}

// fit the values to an quadratic curve to help differentiate high brightness
// pixels
function scale (x) {
    return (x * x)/255;
}

// random grayscale conversion from https://software.intel.com/en-us/html5/hub/blogs/using-the-getusermedia-api-with-the-html5-video-and-canvas-elements
function getIntensity (r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function setupWebcamSampler (blitWidth) {
    var video = document.getElementById('video');
    var blit = document.createElement('canvas');
    blit.width = blitWidth;
    blit.height = blitWidth;
    var blitCtx = blit.getContext('2d');
    navigator.getUserMedia({video: true, audio: false}, function (stream) {
        video.srcObject = stream;
        video.play();

        // capture an image from the webcam, blit to canvas, then downsample
        // and convert to grayscale intensity
        window.captureImage = function (dsHeight, dsWidth) {
            blitCtx.drawImage(video, 0, 0, blitWidth, blitWidth);
            var data = blitCtx.getImageData(0, 0, blitWidth, blitWidth).data;

            // init downsampled 2d array
            var dsArr = [];
            var dsCnt = [];
            for (var i=0; i<dsWidth; i++) {
                dsArr[i] = [];
                dsCnt[i] = [];
                for (var j=0; j<dsHeight; j++) {
                    dsArr[i][j] = 0;
                    dsCnt[i][j] = 0;
                }
            }

            // convert blitted image to grayscale, sum downsampled blocks
            var l = data.length / 4;
            for (var i=0; i<l; i++) {
                var intensity = getIntensity(data[i*4], data[i*4+1], data[i*4+2]);
                var coords = getDownsampledCoords(i, dsWidth, blitWidth);
                dsArr[coords.x][coords.y] += intensity;
                dsCnt[coords.x][coords.y]++;
            }

            // computer avg intensity, normalize to [0, 255], scale to curve
            var maxIntensity = getIntensity(255, 255, 255);
            for (var i=0; i<dsWidth; i++) {
                for (var j=0; j<dsHeight; j++) {
                    dsArr[i][j] /= dsCnt[i][j];
                    dsArr[i][j] = (dsArr[i][j] / maxIntensity) * 255;
                    dsArr[i][j] = scale(dsArr[i][j]);
                }
            }

            return dsArr;
        }

        video.addEventListener('ended', function () {
            window.captureImage = null;
        });
    }, function (e) { console.log('your webcam dont work:', e) });
}
