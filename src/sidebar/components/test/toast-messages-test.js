import { mount } from 'enzyme';
import { createElement } from 'preact';
import { act } from 'preact/test-utils';

import mockImportedComponents from '../../../test-util/mock-imported-components';

import ToastMessages, { $imports } from '../toast-messages';
//import { checkAccessibility } from '../../../test-util/accessibility';

describe('ToastMessages', () => {
  let fakeStore;
  let fakeToastMessenger;

  let fakeErrorMessage = () => {
    return {
      type: 'error',
      message: 'boo',
      id: 'someid2',
      isDismissed: false,
    };
  };

  let fakeSuccessMessage = () => {
    return {
      type: 'success',
      message: 'yay',
      id: 'someid',
      isDismissed: false,
    };
  };

  function createComponent(props) {
    return mount(
      <ToastMessages
        toastMessenger={fakeToastMessenger}
        settings={{}}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeStore = {
      getToastMessages: sinon.stub(),
    };

    fakeToastMessenger = {
      dismiss: sinon.stub(),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': callback => callback(fakeStore),
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('should render a `ToastMessage` for each message returned by the store', () => {
    fakeStore.getToastMessages.returns([
      fakeSuccessMessage(),
      fakeErrorMessage(),
    ]);

    const wrapper = createComponent();

    assert.lengthOf(wrapper.find('ToastMessage'), 2);
  });

  describe('`ToastMessage` sub-component', () => {
    it('should add `is-dismissed` stateful class name if message has been dismissed', () => {
      const message = fakeSuccessMessage();
      message.isDismissed = true;
      fakeStore.getToastMessages.returns([message]);

      const wrapper = createComponent();
      const messageContainer = wrapper.find('ToastMessage li');

      assert.isTrue(messageContainer.hasClass('is-dismissed'));
    });

    it('should dismiss the message when clicked', () => {
      fakeStore.getToastMessages.returns([fakeSuccessMessage()]);

      const wrapper = createComponent();

      const messageContainer = wrapper.find('ToastMessage li');

      act(() => {
        messageContainer.simulate('click');
      });

      assert.calledOnce(fakeToastMessenger.dismiss);
    });

    [
      { message: fakeSuccessMessage(), className: 'toast-message--success' },
      { message: fakeErrorMessage(), className: 'toast-message--error' },
    ].forEach(testCase => {
      it('should assign a CSS class based on message type', () => {
        fakeStore.getToastMessages.returns([testCase.message]);

        const wrapper = createComponent();

        const messageWrapper = wrapper.find('.toast-message');

        assert.isTrue(messageWrapper.hasClass(testCase.className));
      });

      [
        { message: fakeSuccessMessage(), prefix: 'Success' },
        { message: fakeErrorMessage(), prefix: 'Error' },
      ].forEach(testCase => {
        it('should prefix the message with the message type', () => {
          fakeStore.getToastMessages.returns([testCase.message]);

          const wrapper = createComponent();

          const messageContent = wrapper
            .find('.toast-message__message')
            .first();

          assert.equal(
            messageContent.text(),
            `${testCase.prefix}: ${testCase.message.message}`
          );
        });
      });
    });

    [
      { message: fakeSuccessMessage(), icon: 'success' },
      { message: fakeErrorMessage(), icon: 'error' },
    ].forEach(testCase => {
      it('should render an appropriate icon for the message type', () => {
        fakeStore.getToastMessages.returns([testCase.message]);

        const wrapper = createComponent();

        assert.equal(wrapper.find('SvgIcon').props().name, testCase.icon);
      });
    });
  });
});
