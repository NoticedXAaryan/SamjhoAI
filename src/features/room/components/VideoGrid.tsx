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
  const sharedScreens = tracks.filter((track) => track.source === Track.Source.ScreenShare);
  const cameras = tracks.filter((track) => track.source === Track.Source.Camera);

  return (
    <div className="h-full w-full bg-[#202124] p-2 sm:p-3">
      {sharedScreens.length > 0 ? (
        <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_220px]">
          <ParticipantTile
            trackRef={sharedScreens[0]}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#111315] shadow-lg"
          />
          <div className="grid min-h-0 auto-rows-fr gap-2 overflow-y-auto">
            {cameras.map((track) => (
              <ParticipantTile
                key={`${track.participant.identity}-${track.source}`}
                trackRef={track}
                className="min-h-28 overflow-hidden rounded-xl border border-white/10 bg-[#111315]"
              />
            ))}
          </div>
        </div>
      ) : (
        <GridLayout
          tracks={cameras}
          className="h-full w-full gap-2 [&_.lk-participant-tile]:overflow-hidden [&_.lk-participant-tile]:rounded-xl [&_.lk-participant-tile]:border [&_.lk-participant-tile]:border-white/10 [&_.lk-participant-tile]:bg-[#111315]"
        >
          <TrackLoop tracks={cameras}>
            <ParticipantTile />
          </TrackLoop>
        </GridLayout>
      )}
    </div>
  );
}

