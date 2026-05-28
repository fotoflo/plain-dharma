// Custom entry point. Importing "expo-router/entry" registers the root
// component (replaces the default package.json "main"); we then register the
// react-native-track-player playback service so OS remote controls work.
// Order matters: the root component must be registered first.
import "expo-router/entry";
import TrackPlayer from "react-native-track-player";

import { PlaybackService } from "./src/audio/service";

TrackPlayer.registerPlaybackService(() => PlaybackService);
