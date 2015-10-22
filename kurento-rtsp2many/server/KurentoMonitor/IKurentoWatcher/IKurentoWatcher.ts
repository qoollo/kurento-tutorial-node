import KurentoStatus = require("../KurentoStatus/KurentoStatus");
interface IKurentoWatcher{
	newStatus(status:KurentoStatus): any;
}

export = IKurentoWatcher;