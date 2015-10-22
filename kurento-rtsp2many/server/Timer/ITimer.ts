/**
 * Interface to timer with timeout and interval.
 */
interface ITimer{
	setTimeout(callback: ()=>any, timeout: number,...args:any[]): void;
	clearTimeout():void;
	
	setInterval(callback: ()=>any, timeout: number,...args:any[]): void;
	clearInterval():void;
}