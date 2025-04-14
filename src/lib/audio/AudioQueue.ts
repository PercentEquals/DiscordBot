// based on https://github.com/baryon/named-promise-task/

import AudioTask from "./AudioTask";

export default class AudioQueue {
    private _size: number = 0;
    private _currentTask: AudioTask | null = null;

    get size() {
        return this._size;
    }

    get isRunning() {
        return this._size !== 0;
    }

    addTask = (() => {
        let pending = Promise.resolve()
    
        const run = async (task: AudioTask) => {
            try {
                await pending;
            } finally {
                this._currentTask = task;
                return Promise.resolve(task.PlayTask()).finally(() => {
                    this._size--;
                })
            }
        }

        return async (task: AudioTask) => {
            this._size++;
            await task.PrepareTask();
            return (pending = run(task));
        }
    })()
}