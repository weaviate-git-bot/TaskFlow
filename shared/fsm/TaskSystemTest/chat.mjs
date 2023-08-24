/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { actionThenQuery } from '../xutils.mjs';

export function getFsm(initialTask) {
  return {
    initial: 'init',
    on: {
      TIMEOUT: 'fail' // Listen for the 'FAIL' event generated by timeout
    },
    states: {
      init: {
        on: { START: 'start'},
      },
      // start state is defined in task.config.fsm.merge (to demonstrate the merge feature)
      ...actionThenQuery('foundTextarea', ['enterPrompt'], ['findPrompt']),
      ...actionThenQuery('foundPrompt', ['submitPrompt'], ['findResponse']),
      foundResponse: {
        entry: 'pass',
        type: 'final', // Will ignore future events e.g. TIMEOUT
      },
      fail: {
        entry: 'fail',
        type: 'final',
      },
    },
  }
};
  
  
