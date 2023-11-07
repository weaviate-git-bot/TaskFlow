
//NODE_NAME=processor-consumer ./nodes/rxjs/scripts/runFunction.js ./runFunctionTaskRAG.mjs
export function newTask(NODE, state, taskFunctionName) {
  taskFunctionName = 'TaskRAGPreprocessing';
  return {
    id: "runFunction." + taskFunctionName,
    instance: "runFunction-" + taskFunctionName,
    config: {
      corpusName: "DTF", //KG
      local: {
        ripple: false,
      },
    },
    type: taskFunctionName,
    environments: ["rxjs-" + NODE.name],
    state: {
      current: state,
    },
    input: {
      query: "vite",
    },
    operators: {
      LLM: {
        environments: ["rxjs-processor-consumer"],
      },
    },
    services: {
      chat: {
        type: "openaigpt.rag-dataprocessing",
        environments: ["rxjs-processor-consumer"],
      },
    },
  };
}