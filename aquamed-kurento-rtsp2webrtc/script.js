
var poster = './content/poster.png';

var sample1 = new Sample1(),
    sample2 = new Sample2();

window.addEventListener('load', function () {

    sample1.init();

    sample2.init();

    initVideos();

    //initalizeLogContainer(document.getElementById('log-cont'));
});

function initVideos() {
    var videos = document.getElementsByTagName('video');
    for (var i = 0; i < videos.length; i++) {
        videos[i].poster = poster;
        videos[i].setAttribute('autoplay', 'autoplay');
    }
}

function initalizeLogContainer(logContainer) {
    var log = console.log,
        error = console.error;
    console.log = function () {
        appendLog(logContainer, Array.prototype.slice.call(arguments).join(' '))
        log.apply(this, Array.prototype.slice.call(arguments));
    };
    console.error = function () {
        appendLog(logContainer, Array.prototype.slice.call(arguments).map(function (e) { return e instanceof Error ? e.message : e.toString() }).join(' '), 'bg-danger')
        error.apply(this, Array.prototype.slice.call(arguments));
    };
    window.onerror = function (err) { console.error(err) };
}

function appendLog(logContainer, text, cssClass) {
    var li = document.createElement('li');
    li.innerText = text;
    li.className = cssClass || '';
    if (logContainer.children.length > 0)
        logContainer.insertBefore(li, logContainer.firstChild);
    else
        logContainer.appendChild(li);
}

/**
 * @class
 * 
 * @param {HTMLVideoElement} videoElement
 * @param {Function} getUrlFunc
 */
function VideoWithUrlInput(videoElement, getUrlFunc) {
    this.getVideoElement = function () {
        return videoElement;
    }
    this.startStreaming = function (kurentoUri) {
        return streamingManager.startStreaming(new StreamingSettings(kurentoUri, getUrlFunc()), videoElement);
    }

    var streamingManager = new RtspStreamingManager();
}

function Sample() {

    var videosWithUrls = [],
        startResponses = [],
        startButton,
        stopButton,
        self = this;

    /**
     * @param {VideoWithUrlInput} videoWithUrlInput
     */
    this.addVideoElement = function (videoWithUrlInput) {
        videosWithUrls.push(videoWithUrlInput);
    }
    this.setStartButton = function (value) {
        startButton = value;
        startButton.addEventListener('click', self.startPlayback);
    }
    this.setStopButton = function (value) {
        stopButton = value;
        stopButton.addEventListener('click', self.stopPlayback);
    }
    this.showPoster = function () {
        for (var i = 0; i < videosWithUrls.length; i++) {
            videosWithUrls[i].getVideoElement().poster = poster;
        }
    }
    this.showSpinner = function (videoElement) {
        for (var i = 0; i < videosWithUrls.length; i++) {
            videosWithUrls[i].getVideoElement().poster = './content/poster.gif';
        }
    }
    this.getKurentoUri = function () {
        return 'ws://' + document.getElementById('kurento').value + ':8888/kurento';
    }

    this.startPlayback = function () {
        startButton.disabled = true;

        self.showSpinner();

        var kurentoUri = self.getKurentoUri(),
            promises = [];
        for (var i = 0; i < videosWithUrls.length; i++) {
            promises.push(videosWithUrls[i].startStreaming(kurentoUri));
        }
        Promise.all(promises)
            .then(
                function (responses) {
                    for (var i = 0; i < responses.length; i++)
                        startResponses.push(responses[i]);
                    stopButton.disabled = false;
                },
                function (error) {
                    console.error(error);
                    self.showPoster();
                    startButton.disabled = false;
                });
    }

    this.stopPlayback = function () {
        if (startResponses.length < videosWithUrls.length)
            return;

        for (var i = 0; i < startResponses.length; i++) {
            startResponses[i].stop();
        }
        startResponses.length = 0;
        for (var i = 0; i < videosWithUrls.length; i++) {
            videosWithUrls[i].getVideoElement().src = '';
        }
        self.showPoster();
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

function Sample1() {

    Sample.apply(this);

    var startButton,
        stopButton,
        videoElement,
        infoElement,
        startResponse = null,
        streamingManager = new RtspStreamingManager(),
        self = this;

    this.init = function () {
        startButton = document.getElementById('start');
        startButton.addEventListener('click', onStart);

        stopButton = document.getElementById('stop');
        stopButton.addEventListener('click', onStop);

        videoElement = document.getElementById('video');
        self.addVideoElement(new VideoWithUrlInput(videoElement, null));

        infoElement = document.getElementById('info');
    }

    function onStart() {
        startButton.disabled = true;

        self.showSpinner();

        var rtsp = document.getElementById('rtsp').value;
        var kurentoUri = 'ws://' + document.getElementById('kurento').value + ':8888/kurento';

        infoElement.value = 'Запуск. Ждите...';

        var start = streamingManager.startStreaming(new StreamingSettings(kurentoUri, rtsp), videoElement);
        start.then(function (response) {
            startResponse = response;
            stopButton.disabled = false;
            infoElement.value = 'Готово!';
        }, function (error) {
            console.error(error);
            infoElement.value = 'Ошибка! Смотрите консоль.';
            self.showPoster();
            startButton.disabled = false;
        })
    }

    function onStop() {
        if (!startResponse) return;

        startResponse.stop();
        videoElement.src = '';
        startButton.disabled = false;
        stopButton.disabled = true;
        infoElement.value = 'Остановлено.';
        self.showPoster();
    }
}
Sample1.prototype = Object.create(Sample.prototype);
Sample1.prototype.constructor = Sample1;

function Sample2() {

    Sample.apply(this);

    var startButton,
        stopButton,
        startResponses = [],
        self = this;

    this.init = function () {
        self.setStartButton(document.getElementById('start-2'));
        self.setStopButton(document.getElementById('stop-2'));

        self.addVideoElement(
            new VideoWithUrlInput(
                document.getElementById('video-1'),
                function () { return document.getElementById('rtsp-1').value }));
        self.addVideoElement(
            new VideoWithUrlInput(
                document.getElementById('video-2'),
                function () { return document.getElementById('rtsp-2').value }));
        self.addVideoElement(
            new VideoWithUrlInput(
                document.getElementById('video-3'),
                function () { return document.getElementById('rtsp-3').value }));
        self.addVideoElement(
            new VideoWithUrlInput(
                document.getElementById('video-4'),
                function () { return document.getElementById('rtsp-4').value }));
    }
}
Sample2.prototype = Object.create(Sample.prototype);
Sample2.prototype.constructor = Sample2;