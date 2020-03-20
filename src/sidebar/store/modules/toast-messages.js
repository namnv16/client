import * as util from '../util';

/**
 * A store module for managing a collection of toast messages. This module
 * maintains state only; it's up to other layers to handle the management
 * and interactions with these messages.
 */

function init() {
  return {
    messages: [],
  };
}

const update = {
  ADD_MESSAGE: function(state, action) {
    return {
      messages: state.messages.concat([{ ...action.message }]),
    };
  },

  REMOVE_MESSAGE: function(state, action) {
    const updatedMessages = state.messages.filter(
      message => message.id !== action.id
    );
    return { messages: updatedMessages };
  },

  UPDATE_MESSAGE: function(state, action) {
    const updatedMessages = state.messages.map(message => {
      if (message.id && message.id === action.message.id) {
        return { ...action.message };
      }
      return { ...message };
    });
    return { messages: updatedMessages };
  },
};

const actions = util.actionTypes(update);

function addMessage(message) {
  return { type: actions.ADD_MESSAGE, message };
}

function removeMessage(id) {
  return { type: actions.REMOVE_MESSAGE, id };
}

function updateMessage(message) {
  return { type: actions.UPDATE_MESSAGE, message };
}

/** Selectors */
function getMessage(state, id) {
  return state.toastMessages.messages.find(message => message.id === id);
}

function getMessages(state) {
  return state.toastMessages.messages;
}

/**
 * Return boolean indicating whether a message with the same type and message
 * text exists in the state's collection of messages. This matches messages
 * by content, not by ID (true uniqueness).
 *
 * @param {string} type
 * @param {string} text
 * @return {boolean}
 */
function hasMessage(state, type, text) {
  return state.toastMessages.messages.some(message => {
    return message.type === type && message.message === text;
  });
}

export default {
  init,
  namespace: 'toastMessages',
  update,
  actions: {
    addToastMessage: addMessage,
    removeToastMessage: removeMessage,
    updateToastMessage: updateMessage,
  },
  selectors: {
    getToastMessage: getMessage,
    getToastMessages: getMessages,
    hasToastMessage: hasMessage,
  },
};
