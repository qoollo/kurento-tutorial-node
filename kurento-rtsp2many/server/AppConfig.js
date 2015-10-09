(function (EnvMode) {
    EnvMode[EnvMode["Development"] = 0] = "Development";
    EnvMode[EnvMode["Production"] = 1] = "Production";
})(exports.EnvMode || (exports.EnvMode = {}));
var EnvMode = exports.EnvMode;
exports.config = {
    mode: EnvMode.Development,
};
//# sourceMappingURL=AppConfig.js.map