/// <reference path="./js/aquamed-kurento-rtsp2webrtc.ts" />
/// <reference path="./typings/kurento-client.d.ts" />
/// <reference path="./typings/kurento-utils.d.ts" />

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

function appendLog(logContainer, text, cssClass = '') {
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
class VideoWithUrlInput {

    constructor(private _videoElement: HTMLVideoElement, private getUrlFunc: () => string) {
    }

    getVideoElement() {
        return this._videoElement;
    }
    startStreaming(kurentoUri: string) {
        return this.streamingManager.startStreaming(new StreamingSettings(kurentoUri, this.getUrlFunc()), this._videoElement);
    }

    private streamingManager = new RtspStreamingManager();
}


/**
 * @class
 * 
 * @param {HTMLElement} sampleContainer
 */
class Sample {

    private videosWithUrls: VideoWithUrlInput[] = [];
    private startResponses: StartStreamingResponse[] = [];
    protected startButton: HTMLButtonElement;
    protected stopButton: HTMLButtonElement;

    /**
     * @param {VideoWithUrlInput} videoWithUrlInput
     */
    addVideoElement(videoWithUrlInput: VideoWithUrlInput) {
        this.videosWithUrls.push(videoWithUrlInput);
    }
    setStartButton(value: HTMLButtonElement) {
        this.startButton = value;
        this.startButton.addEventListener('click', () => this.startPlayback());
    }
    setStopButton(value: HTMLButtonElement) {
        this.stopButton = value;
        this.stopButton.addEventListener('click', () => this.stopPlayback());
    }
    showPoster() {
        this.videosWithUrls.forEach(v => v.getVideoElement().poster = poster);
    }
    showSpinner() {
        this.videosWithUrls.forEach(v => v.getVideoElement().poster = './content/poster.gif');
    }
    getKurentoUri(): string {
        return 'ws://' + document.getElementById('kurento').getAttribute('value') + ':8888/kurento';
    }

    startPlayback(): void {
        this.startButton.disabled = true;

        this.showSpinner();

        var kurentoUri = this.getKurentoUri(),
            promises = this.videosWithUrls.map(v => v.startStreaming(kurentoUri));

        Promise.all(promises)
            .then(
                responses => {
                    responses.forEach(r => this.startResponses.push(r));
                    this.stopButton.disabled = false;
                },
                error => {
                    console.error(error);
                    this.showPoster();
                    this.startButton.disabled = false;
                });
    }

    stopPlayback(): void {
        if (this.startResponses.length < this.videosWithUrls.length)
            return;

        this.startResponses.forEach(r => r.stop());
        this.startResponses.length = 0;
        this.videosWithUrls.forEach(v => v.getVideoElement().src = '');
        this.showPoster();
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
    }
}

class Sample1 extends Sample {

    constructor() {
        super();
    }

    private videoElement: HTMLVideoElement;
    private infoElement;
    private startResponse = null;
    private streamingManager = new RtspStreamingManager();

    init(): void {
        this.startButton = <HTMLButtonElement>document.getElementById('start');
        this.startButton.addEventListener('click', () => this.onStart());

        this.stopButton = <HTMLButtonElement>document.getElementById('stop');
        this.stopButton.addEventListener('click', () => this.onStop());

        this.videoElement = <HTMLVideoElement>document.getElementById('video');
        this.addVideoElement(new VideoWithUrlInput(this.videoElement, null));

        this.infoElement = document.getElementById('info');
    }

    private onStart(): void {
        this.startButton.disabled = true;

        this.showSpinner();

        var rtsp = document.getElementById('rtsp').getAttribute('value');
        var kurentoUri = 'ws://' + document.getElementById('kurento').getAttribute('value') + ':8888/kurento';

        this.infoElement.value = 'Запуск. Ждите...';

        var start = this.streamingManager.startStreaming(new StreamingSettings(kurentoUri, rtsp), this.videoElement);
        start.then(function (response) {
            this.startResponse = response;
            this.stopButton.disabled = false;
            this.infoElement.value = 'Готово!';
        }, function (error) {
            console.error(error);
            this.infoElement.value = 'Ошибка! Смотрите консоль.';
            this.showPoster();
            this.startButton.disabled = false;
        })
    }

    onStop(): void {
        if (!this.startResponse) return;

        this.startResponse.stop();
        this.videoElement.src = '';
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
        this.infoElement.value = 'Остановлено.';
        this.showPoster();
    }
}

class Sample2 extends Sample {

    constructor() {
        super();
    }

    init(): void {
        this.setStartButton(<HTMLButtonElement>document.getElementById('start-2'));
        this.setStopButton(<HTMLButtonElement>document.getElementById('stop-2'));

        this.addVideoElement(
            new VideoWithUrlInput(
                <HTMLVideoElement>document.getElementById('video-1'),
                () => document.getElementById('rtsp-1').getAttribute('value')));
        this.addVideoElement(
            new VideoWithUrlInput(
                <HTMLVideoElement>document.getElementById('video-2'),
                () => document.getElementById('rtsp-2').getAttribute('value')));
        this.addVideoElement(
            new VideoWithUrlInput(
                <HTMLVideoElement>document.getElementById('video-3'),
                () => document.getElementById('rtsp-3').getAttribute('value')));
        this.addVideoElement(
            new VideoWithUrlInput(
                <HTMLVideoElement>document.getElementById('video-4'),
                () => document.getElementById('rtsp-4').getAttribute('value')));
    }
}