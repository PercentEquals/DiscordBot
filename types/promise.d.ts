declare type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
declare type PromiseReject = (reason?: any) => void;
declare type PromiseExecutor<T> = (resolve: PromiseResolve<T>, reject: PromiseReject) => void;