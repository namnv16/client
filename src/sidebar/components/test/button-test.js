import { mount } from 'enzyme';
import { createElement } from 'preact';

import Button from '../button';
import { $imports } from '../button';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('Button', () => {
  let fakeOnClick;

  function createComponent(props = {}) {
    return mount(
      <Button
        icon="fakeIcon"
        title="My Action"
        onClick={fakeOnClick}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeOnClick = sinon.stub();
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('adds active className if `isPressed` is `true`', () => {
    const wrapper = createComponent({ isPressed: true });

    assert.isTrue(wrapper.find('button').hasClass('is-active'));
  });

  it('renders `SvgIcon` for associated icon', () => {
    const wrapper = createComponent();
    assert.equal(wrapper.find('SvgIcon').prop('name'), 'fakeIcon');
  });

  [true, false].forEach(isPressed => {
    it('sets `aria-pressed` attribute if `isPressed` is a boolean', () => {
      const wrapper = createComponent({ isPressed });
      assert.equal(wrapper.find('button').prop('aria-pressed'), isPressed);
    });
  });

  it('does not set `aria-pressed` attribute if `isPressed` is omitted', () => {
    const wrapper = createComponent();
    assert.notProperty(wrapper.find('button').props(), 'aria-pressed');
  });

  it('sets `title` to provided `title` prop', () => {
    const wrapper = createComponent({});
    assert.equal(wrapper.find('button').prop('title'), 'My Action');
  });

  it('uses `buttonText` to set `title` attr if `title` missing', () => {
    const wrapper = createComponent({
      buttonText: 'My Label',
      title: undefined,
    });

    assert.equal(wrapper.find('button').prop('title'), 'My Label');
  });

  it('invokes `onClick` callback when pressed', () => {
    const wrapper = createComponent();
    wrapper.find('button').simulate('click');
    assert.calledOnce(fakeOnClick);
  });

  it('adds additional class name passed in `className` prop', () => {
    const wrapper = createComponent({ className: 'my-class' });

    assert.isTrue(wrapper.hasClass('my-class'));
  });

  it('sets compact style if `useCompactStyle` is set`', () => {
    const wrapper = createComponent({ useCompactStyle: true });

    assert.isTrue(wrapper.find('button').hasClass('button--compact'));
  });

  it('sets input style if `useInputStyle` is set', () => {
    const wrapper = createComponent({ useInputStyle: true });

    assert.isTrue(wrapper.find('button').hasClass('button--input'));
  });

  it('sets primary style if `usePrimaryStyle` is set`', () => {
    const wrapper = createComponent({ usePrimaryStyle: true });

    assert.isTrue(wrapper.find('button').hasClass('button--primary'));
  });

  it('disables the button when `disabled` prop is true', () => {
    const wrapper = createComponent({ disabled: true });
    assert.isTrue(wrapper.find('button[disabled=true]').exists());
  });

  it('shall not disable the button by default', () => {
    const wrapper = createComponent();
    assert.isTrue(wrapper.find('button[disabled=false]').exists());
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createComponent(),
    })
  );
});
