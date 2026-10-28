/**
 * Every audio/voice message in a conversation thread renders its own native
 * `<audio>` element, so nothing stops two from playing at once. Call this
 * from each element's `onPlay` to pause whichever one was playing before it.
 */
let currentlyPlaying: HTMLAudioElement | null = null;

export function pauseOtherAudio(el: HTMLAudioElement): void {
  if (currentlyPlaying && currentlyPlaying !== el) {
    currentlyPlaying.pause();
  }
  currentlyPlaying = el;
}
