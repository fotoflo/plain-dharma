import TrackPlayer, { Event } from "react-native-track-player";

// RNTP playback service — handles OS-level remote controls (lock screen,
// notification, headphone buttons). Registered from the app entry (index.js)
// via TrackPlayer.registerPlaybackService. Runs in its own JS context, so it
// must only call TrackPlayer methods (no app state/UI here).
export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious()
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) =>
    TrackPlayer.seekTo(e.position)
  );
  TrackPlayer.addEventListener(Event.RemoteJumpForward, (e) =>
    TrackPlayer.seekBy(e.interval)
  );
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, (e) =>
    TrackPlayer.seekBy(-e.interval)
  );
}
