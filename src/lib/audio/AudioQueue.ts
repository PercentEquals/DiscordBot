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

    getCurrentTask() {
        return this._currentTask;
    }

    async loopCurrentTask(loop: boolean) {
        if (!this._currentTask || !loop) {
            return;
        }

        await this._currentTask.PlayTask();
        await this.loopCurrentTask(loop);
    }

    addTask = (() => {
        let pending = Promise.resolve()
    
        const run = async (task: AudioTask, loop: boolean, force: boolean) => {
            try {
                if (!force) {
                    await pending;
                }
            } finally {
                this._currentTask = task;

                await this.loopCurrentTask(loop);

                return Promise.resolve(task.PlayTask()).finally(() => {
                    this._size--;
                    this._currentTask = null;
                })
            }
        }

        return async (task: AudioTask, loop: boolean, force: boolean) => {
            this._size++;
            await task.PrepareTask();

            // TODO: Make force work
            // if (force && this._currentTask) {
            //     await this._currentTask.Stop();
            //     return await run(task, loop, force);
            // }

            return (pending = run(task, loop, force))
        }
    })()
}