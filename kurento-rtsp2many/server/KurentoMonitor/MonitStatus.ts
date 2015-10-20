import MonitSystemStatus = require('./MonitSystemStatus');
import MonitProcessStatus = require('./MonitProcessStatus');

class MonitStatus {
	public systemStatus: MonitSystemStatus;
	public processStatuses: MonitProcessStatus[];
	
	public constructor(monitSrc: any) {
		this.systemStatus = new MonitSystemStatus(monitSrc);
		this.processStatuses = monitSrc.service.filter((value, index, array) => value.name[0] == 'kurento')
								.map((value, index, array) => new MonitProcessStatus(value));
	}
}

export = MonitStatus;