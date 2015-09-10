/// <reference path="./js/aquamed-kurento-rtsp2webrtc.ts" />
/// <reference path="./typings/kurento-client.d.ts" />
/// <reference path="./typings/kurento-utils.d.ts" />

module CitySoft {

    var poster = './content/poster.png',
        sample1,
        sample2;

    window.addEventListener('load', function () {

        sample1 = new Sample1();

        sample2 = new Sample2();

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

        static get containerSelector(): string {
            return 'video-with-url';
        }

        constructor(container: HTMLDivElement) {
            this._videoElement = container.getElementsByTagName('video')[0];
            this._urlInput = container.getElementsByTagName('input')[0];
        }

        private _videoElement: HTMLVideoElement;
        private _urlInput: HTMLInputElement;
        private streamingManager = new RtspStreamingManager();

        getVideoElement() {
            return this._videoElement;
        }
        startStreaming(kurentoUri: string) {
            return this.streamingManager.startStreaming(new StreamingSettings(kurentoUri, this._urlInput.value), this._videoElement);
        }

    }


    /**
     * @class
     * 
     * @param {HTMLElement} sampleContainer
     */
    class Sample {

        constructor(sampleContainer: HTMLElement) {

            this.startButton = <HTMLButtonElement>sampleContainer.getElementsByClassName('btn-start')[0];
            this.startButton.addEventListener('click', () => this.startPlayback());

            this.pauseButton = <HTMLButtonElement>sampleContainer.getElementsByClassName('btn-pause')[0];

            this.stopButton = <HTMLButtonElement>sampleContainer.getElementsByClassName('btn-stop')[0];
            this.stopButton.addEventListener('click', () => this.stopPlayback());

            var videoWithUrlContainers = sampleContainer.getElementsByClassName(VideoWithUrlInput.containerSelector);
            for (var i = 0; i < videoWithUrlContainers.length; i++)
                this.videosWithUrls.push(new VideoWithUrlInput(<HTMLDivElement>videoWithUrlContainers[i]));
        }

        protected videosWithUrls: VideoWithUrlInput[] = [];
        private rtspPlayers: RtspPlayer[] = [];
        protected startButton: HTMLButtonElement;
        protected pauseButton: HTMLButtonElement;
        protected stopButton: HTMLButtonElement;

        protected onStarting: () => void;
        protected onStartSuccess: (responses: RtspPlayer[]) => void;
        protected onStartFail: (err) => void;
        protected onStopClick: () => void;

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
            if (this.onStarting)
                this.onStarting();

            this.startButton.disabled = true;

            this.showSpinner();

            var kurentoUri = this.getKurentoUri(),
                promises = this.videosWithUrls.map(v => v.startStreaming(kurentoUri));

            Promise.all(promises)
                .then(
                    responses => {
                        responses.forEach(r => this.rtspPlayers.push(r));
                        this.stopButton.disabled = false;
                        if (this.onStartSuccess)
                            this.onStartSuccess(responses);
                    },
                    error => {
                        console.error(error);
                        this.showPoster();
                        this.startButton.disabled = false;
                        if (this.onStartFail)
                            this.onStartFail(error);
                    });
        }

        stopPlayback(): void {
            if (this.rtspPlayers.length < this.videosWithUrls.length)
                return;

            this.rtspPlayers.forEach(r => r.stop());
            this.rtspPlayers.length = 0;
            //this.videosWithUrls.forEach(v => v.getVideoElement().src = '');
            this.rtspPlayers.forEach(p => p.stop());
            this.showPoster();
            this.startButton.disabled = false;
            this.stopButton.disabled = true;

            if (this.onStopClick)
                this.onStopClick();
        }
    }

    class Sample1 extends Sample {

        constructor() {
            super(document.getElementById('sample-1'));

            this.infoElement = document.getElementById('info');

            this.onStarting = () => this.handleStarting();
            this.onStartSuccess = r => this.handleStartSuccess(r);
            this.onStartFail = e => this.handleStartFail(e);
            this.onStopClick = () => this.handleStopClick();
        }

        private infoElement;

        private handleStarting(): void {
            this.infoElement.value = 'Запуск. Ждите...';
        }

        private handleStartSuccess(responses: RtspPlayer[]): void {
            this.infoElement.value = 'Готово!';
        }

        private handleStartFail(err): void {
            this.infoElement.value = 'Ошибка! Смотрите консоль.';
        }

        private handleStopClick(): void {
            this.infoElement.value = 'Остановлено.';
        }
    }

    class Sample2 extends Sample {

        constructor() {
            super(document.getElementById('sample-2'));
        }
    }
}