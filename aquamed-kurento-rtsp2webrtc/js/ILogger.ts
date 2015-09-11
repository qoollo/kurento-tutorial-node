
module CitySoft {

    export interface ILogger {
        log(message?: any, ...optionalParams: any[]): void;
        debug(message?: string, ...optionalParams: any[]): void;
        warn(message?: any, ...optionalParams: any[]): void;
        info(message?: any, ...optionalParams: any[]): void;
        error(message?: any, ...optionalParams: any[]): void;
        time(timerName?: string): void;
        timeEnd(timerName?: string): void;

        /*
        clear(): void;
        count(countTitle?: string): void;
        dir(value?: any, ...optionalParams: any[]): void;
        dirxml(value: any): void;
        group(groupTitle?: string): void;
        groupCollapsed(groupTitle?: string): void;
        groupEnd(): void;
        msIsIndependentlyComposed(element: Element): boolean;
        profile(reportName?: string): void;
        profileEnd(): void;
        select(element: Element): void;
        trace(): void;
        */
    }
}