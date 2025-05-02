// based on https://github.com/baryon/named-promise-task/

import AudioTask from "./AudioTask";

export default class AudioQueue {
    private _size: number = 0;
    private _disposed: boolean = false;
    private _currentTask: AudioTask | null = null;

    get size() {
        return this._size;
    }

    get isRunning() {
        return this._size !== 0;
    }

    getCurrentTask() {
        return this._currentTask;
    }

    dispose() {
        this._disposed = true;
        this._size = 0;
        this._currentTask?.dispose();
        this._currentTask?.Finish();
        this._currentTask = null;
    }

    addTask = (() => {
        let pending = Promise.resolve()
    
        const run = async (task: AudioTask) => {
            try {
                await pending;

                if (this._disposed) {
                    task.dispose();
                }
            } finally {
                this._currentTask = task;
                return task.PlayTask().finally(() => {
                    this._size--;
                    this._currentTask = null;
                })
            }
        }

        return async (task: AudioTask) => {
            this._size++;
            await task.PrepareTask();

            if (task.force && this._currentTask) {
                return await this._currentTask.PlayNewAudio(task);
            }

            return (pending = run(task))
        }
    })()
}