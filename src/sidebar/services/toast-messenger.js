/**
 * A service for managing toast messages. The service will auto-dismiss and
 * remove toast messages created with `#success()` or `#error()`. Added
 * messages may be manually dismissed with the `#dismiss()` method.
 */
import { generateHexString } from '../util/random';

const MESSAGE_DISPLAY_TIME = 5000;
const MESSAGE_DISMISS_DELAY = 1000;

// @ngInject
export default function toastMessenger(store) {
  /**
   * Update a toast message's dismiss status and set a timeout to remove
   * it after a bit. This allows effects/animations to happen before the
   * message is removed entirely.
   */
  const dismiss = messageId => {
    const message = store.getToastMessage(messageId);
    if (message && !message.isDismissed) {
      store.updateToastMessage({ ...message, isDismissed: true });
      setTimeout(() => {
        store.removeToastMessage(messageId);
      }, MESSAGE_DISMISS_DELAY);
    }
  };

  /**
   * Add a new toast message to the store and set a timeout to dismiss it
   * after some time. This method will not add a message that is already
   * extant in the store's collection of toast messages (i.e. has the same
   * `type` and `message` text of an existing message).
   */
  const addMessage = (type, message) => {
    // Do not add duplicate messages (messages with the same type and text)
    if (store.hasToastMessage(type, message)) {
      return;
    }

    const id = generateHexString(10);

    store.addToastMessage({ type, message, id, isDismissed: false });

    // Attempt to dismiss message after a set time period. NB: The message may
    // have been removed by other mechanisms at this point; do not assume its
    // presence.
    setTimeout(() => {
      dismiss(id);
    }, MESSAGE_DISPLAY_TIME);
  };

  /**
   * Add an error toast message with `messageText`
   */
  const error = messageText => {
    addMessage('error', messageText);
  };

  /**
   * Add a success toast message with `messageText`
   */
  const success = messageText => {
    addMessage('success', messageText);
  };

  return {
    dismiss,
    error,
    success,
  };
}
