import StateMachineStatic = require("state-machine"); 
import logger = require('../Logger');
import KurentoStatus = require('./KurentoStatus/KurentoStatus');
import MonitStatus = require('./MonitApi/MonitStatus');
import MonitState = require('./MonitApi/MonitState');
import KurentoEventState = require('./KurentoStatus/KurentoEventState');

class KurentoStatusAnaliser {
		
	constructor(){

		this.defaultStateMachine = this.generateDefaultStateMachine();		
	}

	private defaultStateMachine;

	public analise(dbStatus: KurentoStatus,mStatus: KurentoStatus): Promise<KurentoStatus>{
		var event = this.getEvent(dbStatus,mStatus);
		var stMachine = this.createStateMachine(dbStatus,mStatus);
		stMachine[event]();
		return Promise.resolve(MonitState[stMachine.current]);
	}
	
	private getEvent(dbStatus: KurentoStatus,mStatus: KurentoStatus){	
		 var suf = '';
		 if(mStatus.state == MonitState.Running && dbStatus.state == MonitState.Running &&  mStatus.uptime < dbStatus.uptime){
			suf = '-BadTime';
		 }
		return `${dbStatus.state.toString()}-${mStatus.state.toString()}${suf}`;
	}
	
	private createStateMachine(dbStatus: KurentoStatus,mStatus: KurentoStatus):StateMachine{
		return StateMachine.create({ 
			initial: dbStatus.eventState.toString(),
			target:this.defaultStateMachine,
		});
	}
	
	private generateDefaultStateMachine():StateMachine {
		return StateMachine.create({
			initial: 'Unknown',
			events: [
				{ name: 'Unknown-Unknown',  			from: 'Unknown',  to: 'Nothing' },
				{ name: 'Initializing-Unknown',  		from: 'Unknown',  to: 'Nothing' },
				{ name: 'Running-Unknown',  			from: 'Unknown',  to: 'Nothing' },
				{ name: 'NotMonitoring-Unknown',  		from: 'Unknown',  to: 'Nothing' },

				{ name: 'Unknown-Initializing',  		from: 'Unknown',  to: 'Nothing' },
				{ name: 'Initializing-Initializing',  	from: 'Unknown',  to: 'Nothing' },
				{ name: 'Running-Initializing',  		from: 'Unknown',  to: 'Nothing' },
				{ name: 'NotMonitoring-Initializing',   from: 'Unknown',  to: 'Nothing' },
				
				{ name: 'Unknown-NotMonitoring',  		from: 'Unknown',  to: 'OnOffline' },
				{ name: 'Initializing-NotMonitoring',  	from: 'Unknown',  to: 'OnOffline' },
				{ name: 'Running-NotMonitoring',  		from: 'Unknown',  to: 'OnOffline' },
				{ name: 'NotMonitoring-NotMonitoring',  from: 'Unknown',  to: 'OnOffline' },
				
				{ name: 'Unknown-Running',  			from: 'Unknown',  to: 'OnOnline' },
				{ name: 'Initializing-Running',  		from: 'Unknown',  to: 'OnOnline' },
				{ name: 'Running-Running',  			from: 'Unknown',  to: 'OnOnline' },
				{ name: 'NotMonitoring-Running', 		from: 'Unknown',  to: 'OnOnline' },
				{ name: 'Running-Running-BadTime', 		from: 'Unknown',  to: 'OnRestart' },	
				
				
				{ name: 'Unknown-Unknown',  			from: 'OnOffline',  to: 'Nothing' },
				{ name: 'Initializing-Unknown',  		from: 'OnOffline',  to: 'Nothing' },
				{ name: 'Running-Unknown',  			from: 'OnOffline',  to: 'Nothing' },
				{ name: 'NotMonitoring-Unknown',  		from: 'OnOffline',  to: 'Nothing' },

				{ name: 'Unknown-Initializing',  		from: 'OnOffline',  to: 'Nothing' },
				{ name: 'Initializing-Initializing',  	from: 'OnOffline',  to: 'Nothing' },
				{ name: 'Running-Initializing',  		from: 'OnOffline',  to: 'Nothing' },
				{ name: 'NotMonitoring-Initializing',   from: 'OnOffline',  to: 'Nothing' },
				
				{ name: 'Unknown-NotMonitoring',  		from: 'OnOffline',  to: 'Nothing' },
				{ name: 'Initializing-NotMonitoring',  	from: 'OnOffline',  to: 'Nothing' },
				{ name: 'Running-NotMonitoring',  		from: 'OnOffline',  to: 'Nothing' },
				{ name: 'NotMonitoring-NotMonitoring',  from: 'OnOffline',  to: 'Nothing' },
				
				{ name: 'Unknown-Running',  			from: 'OnOffline',  to: 'OnOnline' },
				{ name: 'Initializing-Running',  		from: 'OnOffline',  to: 'OnOnline' },
				{ name: 'Running-Running',  			from: 'OnOffline',  to: 'OnOnline' },
				{ name: 'NotMonitoring-Running', 		from: 'OnOffline',  to: 'OnOnline' },	
				{ name: 'Running-Running-BadTime', 		from: 'OnOffline',  to: 'OnRestart' },	
				
				
				{ name: 'Unknown-Unknown',  			from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'Initializing-Unknown',  		from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'Running-Unknown',  			from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'NotMonitoring-Unknown',  		from: 'OnOnline',  to: 'OnOffline' },

				{ name: 'Unknown-Initializing',  		from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'Initializing-Initializing',  	from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'Running-Initializing',  		from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'NotMonitoring-Initializing',   from: 'OnOnline',  to: 'OnOffline' },
				
				{ name: 'Unknown-NotMonitoring',  		from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'Initializing-NotMonitoring',  	from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'Running-NotMonitoring',  		from: 'OnOnline',  to: 'OnOffline' },
				{ name: 'NotMonitoring-NotMonitoring',  from: 'OnOnline',  to: 'OnOffline' },
				
				{ name: 'Unknown-Running',  			from: 'OnOnline',  to: 'Nothing' },
				{ name: 'Initializing-Running',  		from: 'OnOnline',  to: 'Nothing' },
				{ name: 'Running-Running',  			from: 'OnOnline',  to: 'Nothing' },
				{ name: 'NotMonitoring-Running', 		from: 'OnOnline',  to: 'Nothing' },
				{ name: 'Running-Running-BadTime', 		from: 'OnOnline',  to: 'OnRestart' },	
				
				
				{ name: 'Unknown-Unknown',  			from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'Initializing-Unknown',  		from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'Running-Unknown',  			from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'NotMonitoring-Unknown',  		from: 'OnRestart',  to: 'OnOffline' },

				{ name: 'Unknown-Initializing',  		from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'Initializing-Initializing',  	from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'Running-Initializing',  		from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'NotMonitoring-Initializing',   from: 'OnRestart',  to: 'OnOffline' },
				
				{ name: 'Unknown-NotMonitoring',  		from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'Initializing-NotMonitoring',  	from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'Running-NotMonitoring',  		from: 'OnRestart',  to: 'OnOffline' },
				{ name: 'NotMonitoring-NotMonitoring',  from: 'OnRestart',  to: 'OnOffline' },
				
				{ name: 'Unknown-Running',  			from: 'OnRestart',  to: 'Nothing' },
				{ name: 'Initializing-Running',  		from: 'OnRestart',  to: 'Nothing' },
				{ name: 'Running-Running',  			from: 'OnRestart',  to: 'Nothing' },
				{ name: 'NotMonitoring-Running', 		from: 'OnRestart',  to: 'Nothing' },
				{ name: 'Running-Running-BadTime', 		from: 'OnRestart',  to: 'Nothing' },
				
				
				{ name: 'Unknown-Unknown',  			from: 'Nothing',  to: 'Nothing' },
				{ name: 'Initializing-Unknown',  		from: 'Nothing',  to: 'Nothing' },
				{ name: 'Running-Unknown',  			from: 'Nothing',  to: 'OnOffline' },
				{ name: 'NotMonitoring-Unknown',  		from: 'Nothing',  to: 'Nothing' },

				{ name: 'Unknown-Initializing',  		from: 'Nothing',  to: 'Nothing' },
				{ name: 'Initializing-Initializing',  	from: 'Nothing',  to: 'Nothing' },
				{ name: 'Running-Initializing',  		from: 'Nothing',  to: 'OnOffline' },
				{ name: 'NotMonitoring-Initializing',   from: 'Nothing',  to: 'Nothing' },
				
				{ name: 'Unknown-NotMonitoring',  		from: 'Nothing',  to: 'Nothing' },
				{ name: 'Initializing-NotMonitoring',  	from: 'Nothing',  to: 'Nothing' },
				{ name: 'Running-NotMonitoring',  		from: 'Nothing',  to: 'OnOffline' },
				{ name: 'NotMonitoring-NotMonitoring',  from: 'Nothing',  to: 'Nothing' },
				
				{ name: 'Unknown-Running',  			from: 'Nothing',  to: 'OnOnline' },
				{ name: 'Initializing-Running',  		from: 'Nothing',  to: 'OnOnline' },
				{ name: 'Running-Running',  			from: 'Nothing',  to: 'Nothing' },
				{ name: 'NotMonitoring-Running', 		from: 'Nothing',  to: 'OnOnline' },
				{ name: 'Running-Running-BadTime', 		from: 'Nothing',  to: 'OnRestart' },			

			]});	
	}
	
}

export = KurentoStatusAnaliser;