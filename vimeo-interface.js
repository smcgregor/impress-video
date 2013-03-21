var f, url, player;

// Handle messages received from the player
function onMessageReceived(e) {
  
  var data = JSON.parse(e.data);
  
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
      case 'pause':
        onPause();
        break;
      case 'finish':
        onFinish();
        break;
      case 'seek':
        onSeek(data.data);
        break;
    }
  }
}

// Call the API when a button is pressed
$('button').on('click', function() {
    post($(this).text().toLowerCase());
});

// Helper function for sending a message to the player
function post(action, value) {
  var data = { method: action };
  
  if (value) {
    data.value = value;
  }
    
  f[0].contentWindow.postMessage(JSON.stringify(data), url);
}

function onReady() {
  post('addEventListener', 'pause');
  post('addEventListener', 'finish');
  post('addEventListener', 'playProgress');
  post('addEventListener', 'seek');
  
  //Forces Vimeo to pre-load the video
  post('play');
  setTimeout(function(){
    post('pause');
  }, 1000);
}

function onPause() {
  //pass
}

function onSeek(data) {
  //pass
  console.log(data);
}

function onGetCurrentTime(data) {
  currentVideoTime = parseFloat(data.value);
  
  console.log("current time: " + currentVideoTime);
  console.log("next slide's time: " + slideTimings[nextNumber]);
  
  if(currentVideoTime > slideTimings[nextNumber]) {
    while(currentVideoTime > slideTimings[nextNumber]) {
      console.log("advancing slide based on time");
      slideApi.next();
      ++currentSlideNumber;
      ++nextNumber;
    }
  } else if(currentVideoTime + 5 < slideTimings[currentSlideNumber]) {
    while(currentVideoTime < slideTimings[currentSlideNumber]) {
      console.log("reversing slide based on time");
      slideApi.prev();
      --currentSlideNumber;
      --nextNumber;
    }
  }
}

function onFinish() {
  //pass
}

function onPlayProgress(data) {
  //pass
}

/**
 * Function periodically checks the state of the video and 
 * updates the slide show accordingly.
 **/
function loop() {
  post("getCurrentTime");
  setTimeout(loop, 500);
}

function updateVideoBasedOnSlides() {
  currentSlideNumber = parseInt($( ".active" ).attr("data-slide-number"));
  nextNumber = currentSlideNumber + 1;
  post("seekTo", slideTimings[currentSlideNumber]);
  console.log("keyboard switching to: " + currentSlideNumber);
  console.log("keyboard seeking to: " + slideTimings[currentSlideNumber]);
}

$(window).load(function(){
  f = $('#player');
  url = f.attr('src').split('?')[0];
  
  // Listen for messages from the player
  if (window.addEventListener){
      window.addEventListener('message', onMessageReceived, false);
  } else {
      window.attachEvent('onmessage', onMessageReceived, false);
  }
  
   // Trigger impress action (next or prev) on keyup.

  // Supported keys are:
  // [space] - quite common in presentation software to move forward
  // [up] [right] / [down] [left] - again common and natural addition,
  // [pgdown] / [pgup] - often triggered by remote controllers,
  // [tab] - this one is quite controversial, but the reason it ended up on
  //   this list is quite an interesting story... Remember that strange part
  //   in the impress.js code where window is scrolled to 0,0 on every presentation
  //   step, because sometimes browser scrolls viewport because of the focused element?
  //   Well, the [tab] key by default navigates around focusable elements, so clicking
  //   it very often caused scrolling to focused element and breaking impress.js
  //   positioning. I didn't want to just prevent this default action, so I used [tab]
  //   as another way to moving to next step... And yes, I know that for the sake of
  //   consistency I should add [shift+tab] as opposite action...
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
                  //delay a tenth of a second to allow the impress
                  //library to make the change
                  setTimeout(updateVideoBasedOnSlides, 100);
                  break;
          }
          event.preventDefault();
      }
  }, false);
  
  
  loop();
});
