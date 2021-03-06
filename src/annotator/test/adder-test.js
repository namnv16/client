import { act } from 'preact/test-utils';

import { Adder, ARROW_POINTING_UP, ARROW_POINTING_DOWN } from '../adder';

function rect(left, top, width, height) {
  return { left: left, top: top, width: width, height: height };
}

/**
 * Offset an `Element` from its default position.
 */
function offsetElement(el) {
  el.style.position = 'relative';
  el.style.left = '-200px';
  el.style.top = '-200px';
}

/**
 * Reset an element back to its default position.
 */
function revertOffsetElement(el) {
  el.style.position = 'static';
  el.style.left = '0';
  el.style.top = '0';
}

// nb. These tests currently cover the `AdderToolbar` Preact component as well
// as the `Adder` container. The tests for `AdderToolbar` should be moved into
// `adder-toolbar-test.js`.
describe('Adder', () => {
  let adderCtrl;
  let adderCallbacks;
  let adderEl;

  beforeEach(() => {
    adderCallbacks = {
      onAnnotate: sinon.stub(),
      onHighlight: sinon.stub(),
    };
    adderEl = document.createElement('div');
    document.body.appendChild(adderEl);

    adderCtrl = new Adder(adderEl, adderCallbacks);
  });

  afterEach(() => {
    adderCtrl.hide();
    adderEl.remove();
  });

  function windowSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  function getContent() {
    return adderCtrl._shadowRoot;
  }

  function adderSize() {
    const rect = getContent(adderCtrl).firstChild.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  it('renders the adder toolbar into a shadow root', () => {
    const adderEl = document.createElement('div');
    let shadowEl;

    adderEl.attachShadow = sinon.spy(() => {
      shadowEl = document.createElement('shadow-root');
      adderEl.appendChild(shadowEl);
      return shadowEl;
    });
    document.body.appendChild(adderEl);

    new Adder(adderEl, adderCallbacks);

    assert.called(adderEl.attachShadow);
    assert.equal(
      shadowEl.childNodes[0].tagName.toLowerCase(),
      'hypothesis-adder-toolbar'
    );

    adderEl.remove();
  });

  describe('button handling', () => {
    it('calls onHighlight callback when Highlight button is clicked', () => {
      const highlightBtn = getContent(adderCtrl).querySelector(
        'button.h-icon-highlight'
      );
      highlightBtn.dispatchEvent(new Event('click'));
      assert.called(adderCallbacks.onHighlight);
    });

    it('calls onAnnotate callback when Annotate button is clicked', () => {
      const annotateBtn = getContent(adderCtrl).querySelector(
        'button.h-icon-annotate'
      );
      annotateBtn.dispatchEvent(new Event('click'));
      assert.called(adderCallbacks.onAnnotate);
    });

    it("calls onAnnotate callback when Annotate button's label is clicked", () => {
      const annotateLabel = getContent(adderCtrl).querySelector(
        'button.h-icon-annotate > span'
      );
      annotateLabel.dispatchEvent(new Event('click', { bubbles: true }));
      assert.called(adderCallbacks.onAnnotate);
    });

    it('calls onAnnotate callback when shortcut is pressed if adder is visible', () => {
      // nb. `act` is necessary here to flush effect hooks in `AdderToolbar`.
      act(() => {
        adderCtrl.showAt(100, 100, ARROW_POINTING_UP);
      });
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      assert.called(adderCallbacks.onAnnotate);
    });

    it('calls onHighlight callback when shortcut is pressed if adder is visible', () => {
      // nb. `act` is necessary here to flush effect hooks in `AdderToolbar`.
      act(() => {
        adderCtrl.showAt(100, 100, ARROW_POINTING_UP);
      });
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      assert.called(adderCallbacks.onHighlight);
    });

    it('does not call callbacks when adder is hidden', () => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      assert.notCalled(adderCallbacks.onAnnotate);
      assert.notCalled(adderCallbacks.onHighlight);
    });
  });

  describe('#target', () => {
    it('positions the adder below the selection if the selection is forwards', () => {
      const target = adderCtrl.target(rect(100, 200, 100, 20), false);
      assert.isAbove(target.top, 220);
      assert.equal(target.arrowDirection, ARROW_POINTING_UP);
    });

    it('positions the adder above the selection if the selection is backwards', () => {
      const target = adderCtrl.target(rect(100, 200, 100, 20), true);
      assert.isBelow(target.top, 200);
      assert.equal(target.arrowDirection, ARROW_POINTING_DOWN);
    });

    it('does not position the adder above the top of the viewport', () => {
      const target = adderCtrl.target(rect(100, -100, 100, 20), false);
      assert.isAtLeast(target.top, 0);
      assert.equal(target.arrowDirection, ARROW_POINTING_UP);
    });

    it('does not position the adder below the bottom of the viewport', () => {
      const viewSize = windowSize();
      const target = adderCtrl.target(
        rect(0, viewSize.height + 100, 10, 20),
        false
      );
      assert.isAtMost(target.top, viewSize.height - adderSize().height);
    });

    it('does not position the adder beyond the right edge of the viewport', () => {
      const viewSize = windowSize();
      const target = adderCtrl.target(
        rect(viewSize.width + 100, 100, 10, 20),
        false
      );
      assert.isAtMost(target.left, viewSize.width);
    });

    it('does not positon the adder beyond the left edge of the viewport', () => {
      const target = adderCtrl.target(rect(-100, 100, 10, 10), false);
      assert.isAtLeast(target.left, 0);
    });
  });

  describe('#showAt', () => {
    context('when the document and body elements have no offset', () => {
      it('shows adder at target position', () => {
        adderCtrl.showAt(100, 100, ARROW_POINTING_UP);

        const { left, top } = adderEl.getBoundingClientRect();
        assert.equal(left, 100);
        assert.equal(top, 100);
      });
    });

    context('when the body element is offset', () => {
      beforeEach(() => {
        offsetElement(document.body);
      });

      afterEach(() => {
        revertOffsetElement(document.body);
      });

      it('shows adder at target position', () => {
        adderCtrl.showAt(100, 100, ARROW_POINTING_UP);

        const { left, top } = adderEl.getBoundingClientRect();
        assert.equal(left, 100);
        assert.equal(top, 100);
      });
    });

    context('when the document element is offset', () => {
      beforeEach(() => {
        offsetElement(document.documentElement);
      });

      afterEach(() => {
        revertOffsetElement(document.documentElement);
      });

      it('shows adder at target position when document element is offset', () => {
        adderCtrl.showAt(100, 100, ARROW_POINTING_UP);

        const { left, top } = adderEl.getBoundingClientRect();
        assert.equal(left, 100);
        assert.equal(top, 100);
      });
    });
  });
});
