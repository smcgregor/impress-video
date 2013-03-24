impress-video
=============

Video driver for the Impress.js presentation library. The intention of this project is to build a video driver for video APIs to synchronize their videos with user interactions in the [Impress.js](https://github.com/bartaz/impress.js/) presentation library.

This script is still under development.

# Specs #

## Pluging in Your Video ##

Edit the helloworld.html files in the demos folder and change the vimeo iframe URL to the video of your choice. Make sure you copy over the parameters found on the current video.

## Specifying Slide Timings ##

Slides are tied to the video by setting the following custom attributes:

`data-video-seek: [seconds]`  
Moves the time index of the current video to the time specified in the attribute value. The video should continue playing at the new time index unless it was already stopped. When the video reaches this slide, it will automatically change the viewed slides to match.

## Changing the Video Size ##

Slides can specify how large the video should be when the slide is currently in view. This is achieved with the following optional attributes on the slide div:

`data-video-width: [pixels]`
`data-video-height: [pixels]`

When these attributes are not defined, the video reverts to its default size.