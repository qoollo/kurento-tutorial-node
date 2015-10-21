import MonitUrl = require('../server/KurentoMonitor/MonitUrl');
import MonitApiClient = require('../server/KurentoMonitor/MonitApiClient');

try {
	var res = new MonitApiClient().getMonitStatus(new MonitUrl('http://10.5.6.119:2812/_status?format=xml'));
	res.then(value => {
		console.log(value.systemStatus);
		for (var i in value.processStatuses)
			console.log(value.processStatuses[i]);
	});
} catch (error) {
	console.log(error);
}