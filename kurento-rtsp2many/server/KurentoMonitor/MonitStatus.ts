import MonitSystemStatus = require('./MonitSystemStatus');
import MonitProcessStatus = require('./MonitProcessStatus');

class MonitStatus {
	public systemStatus: MonitSystemStatus;
	public processStatuses: MonitProcessStatus[];
	
	public constructor(monitSrc: any) {
		try {
			this.systemStatus = new MonitSystemStatus(monitSrc);
			this.processStatuses = monitSrc.service.filter((value, index, array) => value.$.type == '3')
									.map((value, index, array) => new MonitProcessStatus(value));
			
		} catch (error) {
			console.log(error);
		}
	}
}

export = MonitStatus;