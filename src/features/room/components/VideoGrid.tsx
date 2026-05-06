'use client';

import { GridLayout, ParticipantTile, TrackLoop, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="h-full w-full">
      <GridLayout tracks={tracks} className="h-full w-full p-2">
        <TrackLoop tracks={tracks}>
          <ParticipantTile />
        </TrackLoop>
      </GridLayout>
    </div>
  );
}

