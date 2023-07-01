/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

/*
Task Process
  Under development, not usable. Code generated by GPT4

Task States
  
ToDo:
  setTasksTask needs an index, stepper has one active task.
  
*/

import React, { useState, useEffect } from "react";
import { Grid } from "@mui/material";
import DynamicComponent from "./../Generic/DynamicComponent";
import withTask from "../../hoc/withTask";
import { setArrayState } from "../../utils/utils";

function TaskGrid(props) {
  const {
    task,
    setTask,
    useTasksState,
    stackPtr,
    useTaskState,
    onDidMount,
  } = props;

  const [tasks, setTasks] = useTasksState([]);
  const [gridTask, setGridTask] = useTaskState(null, "gridTask");

  // onDidMount so any initial conditions can be established before updates arrive
  onDidMount();

  useEffect(() => {
    if (task) {
      setGridTask(task);
    }
  }, [task]);

  // The first task is the task that was passed in
  useEffect(() => {
    setTasks([task]);
  }, []);

  function setTasksTask(t, idx) {
    setArrayState(setTasks, idx, t);
  }

  const GridConfig = task.config.grid;

  /*
  // An example of a GridConfig
  const GridConfig = {
    containerProps: {
      spacing: {
        xs: 2,
        md: 3,
      },
      columns: {
        xs: 4,
        sm: 8,
        md: 12,
      },
    },
    gridItems: [
      { xs: 2, sm: 4, md: 4 },
      // Add more grid item configurations if needed
    ],
  };
  */

  function applyContainerProps(config) {
    return Object.entries(config).reduce((result, [key, value]) => {
      if (typeof value === "object") {
        result[key] = value;
      }
      return result;
    }, {});
  }

  return (
    <div>
      <Grid container {...applyContainerProps(GridConfig.containerProps)}>
        {tasks.map(({ name, stack, instanceId }, idx) => (
          <Grid item key={`task-${name}`} {...GridConfig.gridItems[0]}>
            {stack && (
              <DynamicComponent
                key={instanceId}
                is={stack[stackPtr]}
                task={tasks[idx]}
                setTask={(t) => setTasksTask(t, idx)} // Pass idx as an argument
                parentTask={gridTask}
                stackPtr={stackPtr}
              />
            )}
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default withTask(TaskGrid);
