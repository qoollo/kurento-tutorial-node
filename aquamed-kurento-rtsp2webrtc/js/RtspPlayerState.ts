
module CitySoft {

    export enum RtspPlayerState {
        /** Playback is in progress */
        Playing,
        /** Playback is paused */
        Paused,
        /** Playback is stopeed */
        Stopped,
        /** RtspPlayer has been disposed and can never play again */
        Disposed,

        TransitionToPlay,
        TransitionToPause,
        TransitionToStop
    }
}