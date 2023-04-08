// libs
import React, { useCallback, useState, useRef, useEffect } from 'react';
import Dropdown from './Dropdown';

// assets
import send from '../assets/send.svg';

// contexts
import { useModel } from '../contexts/ModelContext';
import { useWebSocket } from '../contexts/WebSocketContext';

import { sessionId } from '../App';

const MsgBox = (props) => {
  const { webSocket, webSocketEventEmitter, sendJsonMessage } = useWebSocket();
  const [lastMessage, setLastMessage] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [pending, setPending] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const model = useModel();
  const [conversationId, setConversationId] = useState('initialize');
  const textareaRef = useRef(null);

  //console.log("MSGBox component")

  useEffect(() => {
    if (!webSocketEventEmitter) {return}

    const handleMessage = (e) => {
      const j = JSON.parse(e.data)
      if (j?.conversationId) {
        //setLastMessage(j);
        setConversationId(j.conversationId)
        if (j?.stream) {
          let newMsgs =  JSON.parse(JSON.stringify(props.msgs)); // deep copy
          const lastElement = newMsgs[props.selectedExercise.id][newMsgs[props.selectedExercise.id].length - 1];
          lastElement.text += j.stream
          // This allows the text to be displayed
          lastElement.isLoading = false 
          newMsgs[props.selectedExercise.id] = [...newMsgs[props.selectedExercise.id].slice(0,-1), lastElement]
          props.setMsgs(newMsgs);
          setPending(false);
        }
        if (j?.final) {
          // This fixs any missing messages over the websocket in the incremental mode
          let newMsgs =  JSON.parse(JSON.stringify(props.msgs)); // deep copy
          const lastElement = newMsgs[props.selectedExercise.id][newMsgs[props.selectedExercise.id].length - 1];
          lastElement.text = j.final
          lastElement.isLoading = false 
          newMsgs[props.selectedExercise.id] = [...newMsgs[props.selectedExercise.id].slice(0,-1), lastElement]
          props.setMsgs(newMsgs);
          setPending(false);
          console.log(j.final)
        }
        if (j?.message) {
          console.log("Message: " + j.message)
        }
      }
    };

    webSocketEventEmitter.on('message', handleMessage);

    return () => {
      webSocketEventEmitter.removeListener('message', handleMessage);
    };
  }, [webSocketEventEmitter, props.msgs, props.selectedExercise.id]);

  const connectionStatus = webSocket
  ? {
      [WebSocket.CONNECTING]: 'Connecting',
      [WebSocket.OPEN]: 'Open',
      [WebSocket.CLOSING]: 'Closing',
      [WebSocket.CLOSED]: 'Closed',
    }[webSocket.readyState]
  : 'Uninstantiated';

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault(); 
    if (!newMsg){
      return
    }
    setPending(true);
    const newMsgArray = [
      { sender: 'user', text: newMsg,  isLoading: false,}, 
      { sender: 'bot', 
        text: "", 
        isLoading: true, 
      }];
    let newMsgs =  JSON.parse(JSON.stringify(props.msgs)); // deep copy
    newMsgs[props.selectedExercise.id] = [...newMsgs[props.selectedExercise.id], ...newMsgArray]
    props.setMsgs(newMsgs);
    setMessageHistory((prev) => [...prev, newMsg]);
    sendJsonMessage({
      sessionId: sessionId,
      userId: props.user.userId,
      selectedExerciseId: props.selectedExercise.id,
      conversationId: conversationId,
      prompt: newMsg,
      ...model,
    });
    console.log("conversationId sent " + conversationId)
    // Clear the textbox for our next prompt
    setNewMsg("");
  },[props.msgs, props.setMsgs, newMsg, setNewMsg, sendJsonMessage, model, props.user, props.selectedExercise.id]);

  useEffect(() => {
   // Access the form element using the ref
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.placeholder="Écrivez votre prompt ici.";
  }, [newMsg]);

  const handleDropdownSelect = (selectedPrompt) => {
    setNewMsg(newMsg + selectedPrompt)
  };

  return (
    <form onSubmit={handleSubmit} className="msg-form">
        {props?.selectedExercise?.suggested_prompts ?
          <div style={{textAlign: 'left'}}>
            <Dropdown 
              prompts={props.selectedExercise.suggested_prompts} 
              onSelect={handleDropdownSelect} 
            />
          </div>
          : ''
        }
        <div className="msg-textarea-button">
          <textarea
            ref={textareaRef} 
            name="prompt"
            value={newMsg}
            rows="1"
            cols="1"
            onChange={(e) => {
              setNewMsg(e.target.value);
            } }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey === false) {
                e.preventDefault();
                //console.log(formRef.current.elements.prompt.value);
                handleSubmit(e);
              }
            } }
          />
          <button type="submit" disabled={pending} className={pending ? "send-button not-ready" : "send-button ready"}>
            {/* The key stops React double loading the image when both img and message are updated */}
            <img key={send} src={send} alt="Send" className={pending ? "send-not-ready" : "send-ready"} />
          </button>
        </div>
        {/* This can cause continuous reloading when it alternates opeņ/close ? */}
        <div>The WebSocket is currently {connectionStatus}</div>
        {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
        <ul>
          {messageHistory?.map((message, idx) => (
            <span key={idx}>{message ? message.data : null}</span>
          ))}
        </ul>
    </form>
  );
}

export default React.memo(MsgBox);