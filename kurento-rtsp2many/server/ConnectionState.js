var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["NotCreated"] = 0] = "NotCreated";
    ConnectionState[ConnectionState["Connecting"] = 1] = "Connecting";
    ConnectionState[ConnectionState["Connected"] = 2] = "Connected";
    ConnectionState[ConnectionState["Disconnected"] = 3] = "Disconnected";
})(ConnectionState || (ConnectionState = {}));
module.exports = ConnectionState;
//# sourceMappingURL=ConnectionState.js.map