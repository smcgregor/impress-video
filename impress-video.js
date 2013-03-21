/**
 * @fileOverview
 * This file manages the interface between the JS presentation library
 * impress.js and an embedded video provider as defined in one of the 
 * []-interface.js scripts.
 *
 * Three events may cause the slides to change:
 * 1. The video is playing and hits the time for the next slide.
 *    Here the slide number is updated by checking the "data-video-seek"
 *    attribute of the next slide periodically, and advancing the slides
 *    until the next slide has a later time than the current time.
 * 2. The user uses the video player's built in "seek" feature.
 *    Here the slide number is updated in the same manner as case (1), except
 *    the user may seek the time to a slide before the current slide. In this
 *    case the slides will be changed going back until the current slide has a
 *    has a time that is equal to or less than the current video time.
 * 3. The user manually changes the slides.
 *    Here the video is told to seek to the starting time of the current slide
 * 
 */

/**
 * Records the time stamp that the current slide begins based on the time stamp
 * in the video. If the current slide has expired, the presentation moves onto
 * the next slide until it passes the expiration time of the video.
 * When the user manually moves the slides, the video seeks until the 
 * slide is valid.
 */
var slideTimings = [];
var slideApi = null;
var currentVideoTime = 0;
var currentSlideNumber = null;
var nextNumber = null;

/**
 * Must define several functions for the current video API.
 * This object should be initialized by one of the Interfaces
 * defined by the project.
 *
 * The expected functions are:
 * seek(seconds)
 *
 */
var videoApi = {};

/**
 * Assigns the slideTimings array and numbers each of the slides.
 **/
function updateSlideTimings() {
  slideTimings = [];
  var current = 0;
  $( ".step" ).each(function( index ) {
    var timing = this.getAttribute("data-video-seek");
    this.setAttribute("data-slide-number", current);
    if ( timing !== undefined && timing !== null ) {
      slideTimings.push(this.getAttribute("data-video-seek"));
    } else {
      console.error("one of your slides does not have the attribute" +
                    " 'data-video-seek'");
      return;
    }
    ++current;
  });
}

$(window).load(function(){
 updateSlideTimings();
 impress().init();
 slideApi = impress();
 updateVideoBasedOnSlides();
});