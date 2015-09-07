var startResponse = null;
var streamingManager = new RtspStreamingManager();

var poster = './content/poster.png';
var spiner = './content/poster.gif';

var startButton,
    stopButton,
    videoElement,
    infoElement;

window.addEventListener('load', function () {
    startButton = document.getElementById('start');
    startButton.addEventListener('click', onStart);

    stopButton = document.getElementById('stop');
    stopButton.addEventListener('click', onStop);

    videoElement = document.getElementById('video');

    infoElement = document.getElementById('info');

    initalizeLogContainer(document.getElementById('log-cont'));
});

function onStart() {
    startButton.disabled = true;

    videoElement.poster = spiner;
    videoElement.setAttribute('autoplay', 'autoplay');

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
        videoElement.poster = poster;
        startButton.disabled = false;
    })
};

function onStop() {
    if (!startResponse) return;
    
    startResponse.stop();
    videoElement.src = '';
    startButton.disabled = false;
    stopButton.disabled = true;
    infoElement.value = 'Остановлено.';
    videoElement.poster = poster;
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