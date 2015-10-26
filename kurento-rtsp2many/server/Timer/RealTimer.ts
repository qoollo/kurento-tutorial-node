import ITimer = require("./ITimer");
/**
 * RealTimer - implementation of ITimer by NodeJS.Timer
 *  
 */
class RealTimer implements ITimer{
	constructor(){
		this.timeoutId = null;
		this.intervalId = null;
	}
	private timeoutId: NodeJS.Timer;
	private intervalId: NodeJS.Timer;
	
	public setTimeout(callback: ()=>any, timeout: number,...args:any[]):void{
		this.clearTimeout();
		this.timeoutId = setTimeout(callback, timeout,...args);	
	}
	
	public setInterval(callback: ()=>any, timeout: number,...args:any[]):void{
		this.clearInterval();
		this.intervalId = setInterval(callback, timeout,...args);	
	}
	
	public clearTimeout(){
		if(this.timeoutId){
			clearTimeout(this.timeoutId);	
			this.timeoutId = null;	
		}
	}
	
	public clearInterval(){
		if(this.intervalId){
			clearInterval(this.intervalId);	
			this.intervalId = null;	
		}
	}
}
