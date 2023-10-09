/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
import { utils } from "./utils.mjs";
import { getActiveTask_async, setActiveTask_async, deleteActiveTask_async } from "./storage.mjs";
import taskSync_async from "./taskSync.mjs";
import { commandStart_async } from "./commandStart.mjs";
import { taskRelease } from './shared/taskLock.mjs';

async function doneTask_async(task) {
  // Should be an assertion
  if (!task.hub.commandArgs?.done) {
    utils.logTask(task, "task", task);
    throw new Error("Called doneTask_async on a task that is not done");
  }
  let nextTaskId = task.hub.commandArgs?.nextTaskId;
  utils.logTask(task, "Task " + task.id + " done, next " + nextTaskId);
  await setActiveTask_async(task);
  // We should send a delete message to all the copies and also delete those (see Meteor protocol?)
  // !!!
  deleteActiveTask_async(task.instanceId);
  if (nextTaskId) {
    const initTask = {
      id: nextTaskId,
      user: {id: task.user.id},
      groupId: task?.groupId,
      familyId: task.familyId,
    }
    task.hub.commandArgs = {
      init: initTask,
      prevInstanceId: task.instanceId,
      authenticate: false, // Do we need this because request is not coming from internet but local node, would be better to detect this in the authentication?
    }
    await commandStart_async(task);
    //await taskStart_async(initTask, false, nodeId, task.instanceId);
    // In theory commandStart_async will update activeTasksStore and that will send the task to the correct node(s)
  }
}

async function doUpdate(commandArgs, task) {
  if (commandArgs?.done) {
    utils.logTask(task, "Update task done " + task.id + " in state " + task.state?.current + " sync " + commandArgs.sync);
    await doneTask_async(task);
  } else {
    task.meta.updateCount = task.meta.updateCount + 1;
    utils.logTask(task, "Update task " + task.id + " in state " + task.state?.current + " sync:" + commandArgs.sync + " instanceId:" + task.instanceId + " updateCount:" + task.meta.updateCount);
    await taskSync_async(task.instanceId, task)
    await utils.hubActiveTasksStoreSet_async(setActiveTask_async, task);
  }
}

export async function commandUpdate_async(task) {
  utils.debugTask(task);
  if (task.instanceId === undefined) {
    throw new Error("Missing task.instanceId");
  }
  let nodeId = task.hub.sourceProcessorId;
  const commandArgs = task.hub.commandArgs;
  let instanceId = task.instanceId;
  if (commandArgs?.syncTask?.instanceId) {
    instanceId = commandArgs.syncTask.instanceId;
  }
  //const localTaskRelease = await taskLock(task.instanceId, "commandUpdate_async");
  utils.logTask(task, "commandUpdate_async messageId:", task?.meta?.messageId);
  try {
    utils.logTask(task, "commandUpdate_async from nodeId:" + nodeId);
    let activeTask = await getActiveTask_async(instanceId)
    if (!activeTask) {
      throw new Error("No active task " + instanceId);
    }
    if (commandArgs?.sync) {
      if (commandArgs?.done) {
        throw new Error("Not expecting sync of done task");
      }
      activeTask.meta["messageId"] = task.meta.messageId;
      activeTask.meta["prevMessageId"] = task.meta.prevMessageId;
      task = utils.deepMergeHub(activeTask, commandArgs.syncTask, task.hub);
      task.hub.commandArgs["syncTask"] = null;
      if (commandArgs.syncUpdate) {
        task.hub.commandArgs["sync"] = null; // Map the sync to a "normal" update
      }
    } else {
      task = utils.deepMergeHub(activeTask, task, task.hub);
    }
    task.meta.updateCount = activeTask.meta.updateCount;
    utils.logTask(task, task.meta.broadcastCount + " commandUpdate_async " + task.id);
    await doUpdate(commandArgs, task);       
  } catch (error) {
    const msg = `Error commandUpdate_async task ${task.id}: ${error.message}`;
    console.error(msg);
    utils.logTask(task, "commandUpdate_async task", task);
    throw error;
  } finally {
    // Always release the lock
    utils.logTask(task, "commandUpdate_async lock released instanceId:", task.instanceId);
    //localTaskRelease();
    taskRelease(task.instanceId, "commandUpdate_async");
  }
}
