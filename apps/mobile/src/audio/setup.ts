import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";

// Idempotent player setup. setupPlayer() throws if called twice, so we memoize
// the promise and reset it on failure so a later attempt can retry.
let setupPromise: Promise<void> | null = null;

export function setupAudioPlayer(): Promise<void> {
  if (!setupPromise) {
    setupPromise = (async () => {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        progressUpdateEventInterval: 1,
        forwardJumpInterval: 5,
        backwardJumpInterval: 5,
      });
    })().catch((err) => {
      setupPromise = null;
      throw err;
    });
  }
  return setupPromise;
}
