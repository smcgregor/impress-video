/**
 * @fileOverview
 * This file manages the interface between the JS presentation library
 * impress.js and an embedded video provider Vimeo.
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
 * When the video finishes, the video loop is exited and video seeks
 * stop affecting the slides, and vice versa. When the person hits play again,
 * the video seeks to the location of the current slide, and the loop is reentered.
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

/**
 * Stores the integer of the current slide number. This is used to index into
 * the slideTimings array.
 */
var currentSlideNumber = null;

/**
 * Stores the integer of the next slide number. This is used to index into
 * the slideTimings array.
 */
var nextNumber = null;

/**
 * The impress.js API object.
 * `api.init()` - initializes the presentation,
 * `api.next()` - moves to next step of the presentation,
 * `api.prev()` - moves to previous step of the presentation,
 * `api.goto( idx | id | element, [duration] )` - moves the presentation to 
 *       the step given by its index number id or the DOM element;
 *       second parameter can be used to define duration of the transition in 
 *       ms, but it's optional - if not provided default transition duration 
 *       for the presentation will be used.
 */
var slideApi = null;
var impressApi = null; // The two APIs have not been completely merged

/**
 * Stores the vurrent state of the video's timer.
 */
var currentVideoTime = 0;

/**
 * Vimeo API handle.
 */
var froogaloop;

/**
 * URL of the video being played.
 */
var url;

/**
 * The video player object.
 */
var player;


/**
 * The default height of the video iframe.
 * The video will change to this size on any slide
 * that does not have a video width or height specified.
 */
var defaultHeight = "290px";

/**
 * The default width of the video frame.
 * The video will change to this size on any slide
 * that does not have a video width or height specified.
 */
var defaultWidth = "340px";

/**
 * Handle messages received from the player.
 * All messages are sent here and are forwarded 
 * to the appropriate event handler.
 */
function onMessageReceived(e) {
  
  var data = JSON.parse(e.data);
  
  // If it is an API call the "method"
  // will be defined, otherwise it is an
  // event
  if ( data.method !== undefined ) {
    switch (data.method) {
      case 'getCurrentTime':
        onGetCurrentTime(data);
        break;
    }
  } else {
    switch (data.event) {
      case 'ready':
        onReady();
        break;
      case 'playProgress':
        onPlayProgress(data.data);
        break;
      case 'loadProgress':
        onLoadProgress(data.data);
        break;
      case 'pause':
        onPause();
        break;
      case 'finish':
        onFinish();
        break;
      case 'seek':
        onSeek(data.data);
        break;
      case 'play':
        onPlay();
        break;
    }
  }
}

/**
 * Helper function for sending a message to the player.
 *
 * @param {string} action the name of the Vimeo API action.
 * @param {string} value the value of the action to send to the Vimeo API.
 *                 This parameter is optional depending on the API call.
 *
 */
function post(action, value) {
  var data = { method: action };
  
  if (value) {
    data.value = value;
  }
    
  froogaloop[0].contentWindow.postMessage(JSON.stringify(data), url);
}

/**
 * Register event listeners in the video player and start buffering immediatly
 * by playing the video for a second, then pausing.
 */
function onReady() {
  post('addEventListener', 'pause');
  post('addEventListener', 'finish');
  post('addEventListener', 'play');
  post('addEventListener', 'playProgress');
  post('addEventListener', 'loadProgress');
  post('addEventListener', 'seek');
  
  //Forces Vimeo to pre-load the video
  post('play');
  setTimeout(function(){
    post('pause');
  }, 1000);
}

/**
 * Update the slide to the proper slide based on the current 
 * time of the video player.
 */
function onGetCurrentTime(data) {
  currentVideoTime = parseFloat(data.value);
  
  // Advance forward until reaching the correct time, or
  // go back if it is too far forward
  if(currentVideoTime > slideTimings[nextNumber]) {
    while(currentVideoTime > slideTimings[nextNumber]) {
      slideApi.next();
      ++currentSlideNumber;
      ++nextNumber;
    }
  } else if(currentVideoTime + 5 < slideTimings[currentSlideNumber]) {
    // See: https://github.com/smcgregor/impress-video/issues/1
    while(currentVideoTime < slideTimings[currentSlideNumber]) {
      slideApi.prev();
      --currentSlideNumber;
      --nextNumber;
    }
  }
}

/**
 * Used to determine whether the loop should execute.
 */
var runLoop = false;

/**
 * Will seek the video to the current slide when it is buffered, then it 
 * starts the slide update loop.
 */
function onLoadProgress(data) {
  
  // Only complete this once
  if ( runLoop ) {
    return;
  }
  
  currentSlideNumber = parseInt($( ".active" ).attr("data-slide-number"));
  nextNumber = currentSlideNumber + 1;
  var timeLoaded = data.percent * data.duration;
  
  if ( timeLoaded > slideTimings[currentSlideNumber] ) {
    updateVideoBasedOnSlides();
    runLoop = true;
  }
}

/**
 * Used to continue the loop if it has been stopped.
 */
function onPlayProgress(data) {
  runLoop = true;
}

/**
 * Used to continue the loop if it has been stopped.
 */
function onPlay() {
  runLoop = true;
}

/**
 * Used to stop the loop when the video is done.
 */
function onFinish() {
  runLoop = false;
}

//pass
function onSeek(data) {}

/**
 * Makes the video stop updating the slides when changing slides manually.
 */
function onPause() {
  runLoop = false;
}

/**
 * Function periodically checks the state of the video and 
 * updates the slide show accordingly.
 **/
function loop() {
  if ( runLoop ) {
    post("getCurrentTime");
  }
  setTimeout(loop, 300);
}

/**
 * Sets the current slide and the next slide based on the slide that is
 * currently in view. Then it seeks the video to match the displayed slide.
 */
function updateVideoBasedOnSlides() {
  currentSlideNumber = parseInt($( ".active" ).attr("data-slide-number"));
  nextNumber = currentSlideNumber + 1;
  resizeVideo();
  post("seekTo", slideTimings[currentSlideNumber]);
}

/**
 * Assigns the slideTimings array and numbers each of the slides.
 * This should generally only be called on initialization.
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

/**
 * Checks the current slides's video window settings and updates it accordingly.
 */
function resizeVideo() {
  var videoWidth = $('.active').attr("data-video-width");
  var videoHeight = $('.active').attr("data-video-height");
  
  if(videoWidth !== undefined && videoHeight !== undefined) {
    $('#player').attr("height", videoHeight);
    $('#player').attr("width", videoWidth);
  } else {
    $('#player').attr("height", defaultHeight);
    $('#player').attr("width", defaultWidth);
  }
}

// Supported keys are:
// [space] - quite common in presentation software to move forward
// [up] [right] / [down] [left] - again common and natural addition,
// [pgdown] / [pgup] - often triggered by remote controllers,
// [tab] - this one is quite controversial, see the impress.js source code
document.addEventListener("keyup", function ( event ) {
    if ( event.keyCode === 9 || ( event.keyCode >= 32 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40) ) {
        switch( event.keyCode ) {
            case 33: // pg up
            case 37: // left
            case 38: // up
            case 9:  // tab
            case 32: // space
            case 34: // pg down
            case 39: // right
            case 40: // down
              if( runLoop ) {
                //delay a tenth of a second to allow the impress
                //library to make the change
                setTimeout(updateVideoBasedOnSlides, 100);
              }
              break;
        }
        event.preventDefault();
    }
}, false);


// Call the API when a button is pressed.
$('.video_button').on('click', function() {
    post($(this).text().toLowerCase());
});

// Move to the addenda slides.
$('.addenda_button').on('click', function() {
  
  //Not sure why this is necessary, but something funky in the
  //impress library means this must be asynchronous
  setTimeout(function(){slideApi.next();},0)
});

// Setup everying after it is loaded
$(window).load(function(){
  
  //
  // Player setup
  //
  
  // Get Vimeo API handle
  froogaloop = $('#player');
  url = froogaloop.attr('src').split('?')[0];
  
  // Listen for messages from the player
  if (window.addEventListener){
    window.addEventListener('message', onMessageReceived, false);
  } else {
    window.attachEvent('onmessage', onMessageReceived, false);
  }
  
  $('#player').attr("height", defaultHeight);
  $('#player').attr("width", defaultWidth);
  
  //
  // Slide setup
  //
  updateSlideTimings();
  impress().init();
  
  impressApi = impress();
  
  // Add functionality to the impress API
  slideApi = { 
    next: function() {
      impressApi.next();
      resizeVideo();
    },
    prev: function() {
      impressApi.prev();
      resizeVideo();
    },
    goto: function(param) {
      impressApi.goto(param);
      resizeVideo();
    }
  }
  
  // Start checking the loop
  loop();
});
