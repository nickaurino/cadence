import { render, fireEvent, screen } from '@testing-library/react-native';
import { ManualPaceModal } from '@/components/ManualPaceModal';

// NOTE: the original bug (wheel frozen at the default) was a native iOS
// scroll-position reset and is only reproducible on device. These tests guard
// the selection contract — that a scroll maps to the right spm and confirms it —
// so a future change can't silently break the value mapping.

function scrollTo(spm: number) {
  const ITEM_HEIGHT = 44;
  const MIN = 120;
  fireEvent.scroll(screen.getByTestId('pace-wheel'), {
    nativeEvent: { contentOffset: { x: 0, y: (spm - MIN) * ITEM_HEIGHT } },
  });
}

describe('ManualPaceModal', () => {
  it('maps a scroll position to the matching spm and confirms it', () => {
    const onConfirm = jest.fn();
    render(<ManualPaceModal visible onClose={jest.fn()} onConfirm={onConfirm} />);

    scrollTo(180);
    fireEvent.press(screen.getByText('Set 180 spm'));

    expect(onConfirm).toHaveBeenCalledWith(180);
  });

  it('clamps scrolling past the max to the top of the range', () => {
    const onConfirm = jest.fn();
    render(<ManualPaceModal visible onClose={jest.fn()} onConfirm={onConfirm} />);

    scrollTo(260); // past MAX (200)
    fireEvent.press(screen.getByText('Set 200 spm'));

    expect(onConfirm).toHaveBeenCalledWith(200);
  });
});
