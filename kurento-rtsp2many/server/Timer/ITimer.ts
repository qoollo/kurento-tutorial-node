interface ITimer{
	setTimeout(callback: ()=>any, timeout: number): number;
}