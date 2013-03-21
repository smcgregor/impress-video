impress-video
=============

Video driver for the Impress.js presentation library. The intention of this project is to build a video driver for video APIs to synchronize their videos with user interactions in the [Impress.js](https://github.com/bartaz/impress.js/) presentation library.

This driver is currently under development and is not ready for your attention. Vimeo has many eccentricities that require careful construction of slide transitions.

# Specs #

## Specifying Slide Timings ##

Slides are tied to the video by setting the following custom attributes:

**data-video-seek: [seconds]**  
Moves the time index of the current video to the time specified in the attribute value. The video should continue playing at the new time index unless it was already stopped. When the video reaches this slide, it will automatically change the viewed slides to match.

## State Variables ##

* currentVideoTime = [seconds]
* videoStopped = [true|false]

## Interactions with the Video ##

* Users may stop the video, but the video will continue to seek to which slide they are viewing.
* The video will automatically change the slide to the slide with the video's current time specified in the data-video-seek html attribute.
