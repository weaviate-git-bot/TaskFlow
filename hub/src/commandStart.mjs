/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
import { utils } from "./utils.mjs";
import { setActiveTask_async } from "./storage.mjs";
import taskSync_async from "./taskSync.mjs";
import taskStart_async from "./taskStart.mjs";
import { haveCoprocessor } from "../config.mjs";
import { taskRelease } from './shared/taskLock.mjs';

export async function commandStart_async(task) {
  const commandArgs = task.hub.commandArgs;
  let processorId = task.hub.sourceProcessorId;
  try {
    utils.logTask(task, "commandStart_async from processorId:" + processorId);
    let initTask;
    let authenticate = true;
    if (commandArgs.init) {
      initTask = commandArgs.init;
      processorId = task.processor.id;
      if (commandArgs.authenticate !== undefined) {
        authenticate = commandArgs.authenticate;
      }
    } else {
      initTask = {
        id: commandArgs.id,
        user: {id: task.user.id},
      };
    }
    utils.logTask(task, "commandStart_async coprocessingDone:", task.hub.coprocessingDone, "initTask", initTask);
    const prevInstanceId = commandArgs.prevInstanceId || task.instanceId;
    if (haveCoprocessor) {
      if (task.hub.coprocessingDone) {
        taskStart_async(initTask, authenticate, processorId, prevInstanceId)
          .then(async (startTask) => {
            await taskSync_async(startTask.instanceId, startTask);
            //utils.logTask(task, "commandStart_async startTask.processors", startTask.processors);
            //utils.logTask(task, "commandStart_async startTask.processor", startTask.processor);
            //utils.logTask(task, "commandStart_async startTask.hub", startTask.hub);
            utils.hubActiveTasksStoreSet_async(setActiveTask_async, startTask);
            taskRelease(task.instanceId, "commandStart_async");
          })
      } else {
        await taskSync_async(task.instanceId, task);
        // Start should not function as an update. Could get out of sync when using task to start another task.
      }
    } else {
      taskStart_async(initTask, authenticate, processorId, prevInstanceId)
        .then(async (startTask) => {
          await taskSync_async(startTask.instanceId, startTask);
          utils.hubActiveTasksStoreSet_async(setActiveTask_async, startTask);
          taskRelease(task.instanceId, "commandStart_async");
        })
    }
  } catch (error) {
    const msg = `Error commandStart_async task ${task.id}: ${error.message}`;
    console.error(msg);
    throw new Error(msg);
  }
  
}
