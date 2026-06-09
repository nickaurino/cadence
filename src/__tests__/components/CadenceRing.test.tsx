import { render } from '@testing-library/react-native';
import { CadenceRing } from '@/components/CadenceRing';

// Smoke tests: these catch render-time crashes (bad interpolation config,
// undefined access, prop wiring). They do NOT catch the native-vs-JS animation
// driver conflict — jest mocks the native animated module, so driver mixing only
// surfaces on a real device. That class is prevented by the in-file rule
// (everything in CadenceRing uses useNativeDriver: false).

describe('CadenceRing', () => {
  it('renders the value in every state without crashing', () => {
    for (const active of [true, false]) {
      for (const closeness of [0, 0.5, 1, undefined]) {
        const { getByText, unmount } = render(
          <CadenceRing value={172} active={active} closeness={closeness} />,
        );
        expect(getByText('172')).toBeTruthy();
        unmount();
      }
    }
  });

  it('renders a string placeholder value (the calibrating "··")', () => {
    const { getByText } = render(<CadenceRing value="··" active={false} />);
    expect(getByText('··')).toBeTruthy();
  });
});
