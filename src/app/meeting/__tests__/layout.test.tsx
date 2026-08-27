import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MeetingLayout from '../layout';

describe('MeetingLayout', () => {
  it('renders public meeting-link content without requiring a session', () => {
    render(
      <MeetingLayout>
        <div>Guest pre-join</div>
      </MeetingLayout>,
    );

    expect(screen.getByText('Guest pre-join')).toBeTruthy();
  });
});
