
import cfg = require('../../server/AppConfig');

console.log('Spec helper: setting AppConfig.mode = Test');
cfg.config.setEnvMode(cfg.EnvMode.Test);