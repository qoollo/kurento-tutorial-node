import KurentoStatus = require("../KurentoStatus/KurentoStatus");
interface IKurentoGuard{
	newStatus(status:KurentoStatus): any;
}

export = IKurentoGuard;