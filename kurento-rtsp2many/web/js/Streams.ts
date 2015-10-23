
function onRequestError(err) {
    alert('Error! ' + err);
}

module KurentoHub {
    class StreamsViewModel {

        constructor() {
            this.apiUrl = ko.observable('http://' + window.location.hostname + ':8082/api/');
            this.killStream = s => this.killStreamInner(s);

            this.requestStreams();
        }

        apiUrl: KnockoutObservable<string>;
        streams: KnockoutObservableArray<Stream> = ko.observableArray([]);

        requestStreams(): JQueryPromise<void> {
            return $.get(this.apiUrl() + 'streams')
                .then((streams: Stream[]) => {
                    this.streams([]);
                    streams.map(s => new Stream(s)).forEach(s => this.streams.push(s));
                }, onRequestError);
        }

        killStream: (stream: Stream) => JQueryPromise<void>;

        private killStreamInner(stream: Stream): JQueryPromise<void> {
            stream.killInProgress(true);
            return $.ajax({
                url: this.apiUrl() + 'streams',
                data: stream,
                type: 'DELETE'
            }).then(
                (() => {
                    this.streams.remove(stream);
                }).bind(this),
                err => {
                    stream.killInProgress(false);
                    onRequestError(err);
                });
        }
    }

    class Stream {

        constructor(rawObject) {
            this.streamUrl = ko.observable(rawObject.streamUrl);
            this.kurentoServerUrl = ko.observable(rawObject.kurentoServerUrl);
            this.clients = ko.observableArray<Protocol.IClientId>(rawObject.clients);
        }

        streamUrl: KnockoutObservable<string>;
        kurentoServerUrl: KnockoutObservable<string>;
        clients: KnockoutObservableArray<Protocol.IClientId>;
        killInProgress: KnockoutObservable<boolean> = ko.observable(false);
    }

    ko.applyBindings(new StreamsViewModel());
}