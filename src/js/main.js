var showControlBarTimeout = null;
var elementRef = {
  mediaContainer: document.querySelector('.player-container'),
  media: document.getElementById('media'),
  mediaUrl: document.getElementById('media-url'),
  mediaType: document.getElementById('media-type'),
  loadBtn: document.getElementById('load-media'),
  bar: document.querySelector('.controls'),
  play: document.querySelector('.play-pause'),
  fullscreen: document.querySelector('.fullscreen'),
  progressBar: document.querySelector('.progress-bar'),
  progressBuffered: document.querySelector('.progress-buffered'),
  progressPlayed: document.querySelector('.progress-played'),
  progressSeekPoint: document.querySelector('.progress-seek'),
  currentTime: document.getElementById('media-current'),
  durationTime: document.getElementById('media-duration'),
  loader: document.querySelector('.loader')
};
var player = {
  element: null,
  isPlaying: false,
  isFullscreen: false,
  load: function() {
    var mediaUrl = elementRef.mediaUrl.value;
    var mediaType = elementRef.mediaType.value;
    if (mediaUrl === '') {
      return false;
    }
    player.init();
    var mediaData = parseMediaData(mediaUrl, mediaType);
    loadMediaData(mediaData);
  },
  destroy: function() {
    player.element.pause();
    player.element.unload();
    player.element.detachMediaElement();
    player.element.destroy();
    player.element = null;
    player.isPlaying = false;
    removeClass(elementRef.play, 'playing');
  },
  playPause: function() {
    if (typeof player.element === 'undefined' || player.element === null) {
      return false;
    }

    if (!player.isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  },
  play: function() {
    if (typeof player.element === 'undefined' || player.element === null) {
      return false;
    }

    var playPromise = player.element.play();
    if (playPromise !== 'undefined') {
      playPromise.then(function () {
        player.isPlaying = true;
        addClass(elementRef.play, 'playing');
      }, function () {
        player.element.pause();
      });
    }
  },
  pause: function() {
    if (typeof player.element === 'undefined' || player.element === null) {
      return false;
    }

    player.element.pause();
    player.isPlaying = false;
    removeClass(elementRef.play, 'playing');
  },
  seek: function(time) {
    time = parseFloat(Math.max(time, 0));
    player.element.currentTime = time;
  },
  fullscreen: function() {
    if (!document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
      requestFullscreen(elementRef.mediaContainer);
    } else {
      cancelFullscreen();
    }
  },
  init: function() {
    elementRef.progressPlayed.style.width = 0;
    elementRef.currentTime.innerText = formatTime();
    elementRef.durationTime.innerText = formatTime();
  }
};

function parseMediaData(url, type) {
  var typeConfig = {
    liveFlv: {
      type: 'flv',
      hasAudio: true,
      hasVideo: true,
      isLive: true
    },
    liveMp4: {
      type: 'mp4',
      hasAudio: true,
      hasVideo: true,
      isLive: true
    },
    flv: {
      type: 'flv',
      hasAudio: true,
      hasVideo: true,
      isLive: false
    },
    mp4: {
      type: 'mp4',
      hasAudio: true,
      hasVideo: true,
      isLive: false
    }
  };
  var mediaData = typeConfig[type];
  mediaData.url = url;

  return mediaData;
}

function loadMediaData(mediaData) {
  if (player.element !== null) {
    player.destroy();
  }
  player.element = flvjs.createPlayer(mediaData, {
    enableWorker: false,
    lazyLoadMaxDuration: 3 * 60,
    seekType: 'range'
  });
  player.element.attachMediaElement(elementRef.media);
  player.element.load();
  console.log(player.element);
  if (mediaData.isLive) {
    player.play();
  }
  elementRef.loader.style.display = 'block';
}

function mediaLoaded() {
  elementRef.loader.style.display = 'none';
  onPlaying();
}

function autoType(ev) {
  if (elementRef.mediaUrl.value === '') {
    return false;
  }
  var mightType = 'mp4';
  var typeRange = {
    'flv': 'flv',
    'mp4': 'mp4',
    'ogg': 'mp4',
    'webm': 'mp4',
    'm3u8': 'liveMp4'
  };
  for (var i in typeRange) {
    if (elementRef.mediaUrl.value.indexOf('.' + i) >= 0) {
      mightType = typeRange[i];
      break;
    }
  }
  elementRef.mediaType.value = mightType;
}

function onPlaying() {
  // playing event
  var currentTime = player.element.currentTime;
  var duration = player.element.duration;
  if (duration !== Infinity) {
    var playedPercent = currentTime / duration * 100;
    if (playedPercent > 100) {
      playedPercent = 100;
    }
    var durationText = formatTime(duration);
    elementRef.progressPlayed.style.width = playedPercent + '%';
    elementRef.durationTime.innerText = durationText;
  }
  var currentTimeText = formatTime(currentTime);
  elementRef.currentTime.innerText = currentTimeText;
}

function onBuffer() {
  var elBuffer = player.element.buffered;
  var duration = player.element.duration;
  var buffer = [];
  while (elementRef.progressBuffered.firstChild) {
    elementRef.progressBuffered.removeChild(elementRef.progressBuffered.firstChild);
  }
  for (var i = 0; i < elBuffer.length; i++) {
    var bufferedRange = [elBuffer.start(i), elBuffer.end(i)];
    buffer.push(bufferedRange);
    var bufferBar = document.createElement('div');
    var bufferBarLeft = bufferedRange[0] / duration * 100;
    var bufferBarRight = bufferedRange[1] / duration * 100 - bufferBarLeft;
    bufferBar.style.cssText = 'left:' + bufferBarLeft + '%;width:' + bufferBarRight + '%;';
    elementRef.progressBuffered.appendChild(bufferBar);
  }
}

function seekPoint(ev) {
  var mLeft = ev.offsetX;
  elementRef.progressSeekPoint.style.left = (mLeft - 1) + 'px';
}

function seekAction(ev) {
  if (typeof player.element === 'undefined' || player.element === null) {
    return false;
  }

  var seekTime = player.element.duration * ev.offsetX / elementRef.progressBar.clientWidth;
  player.seek(seekTime);
}

function requestFullscreen(el) {
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  }
}

function cancelFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.oRequestFullscreen) {
    document.oCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

function fullscreenEvent() {
  var fullscreenDOM = document.fullscreenElement ||
  document.mozFullScreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement;
  if (typeof fullscreenDOM !== 'undefined') {
    player.isFullscreen = true;
    addClass(elementRef.mediaContainer, 'fullpage');
    console.log('fullscreen');
  } else {
    player.isFullscreen = false;
    removeClass(elementRef.mediaContainer, 'fullpage');
    console.log('cancel fullscreen');
  }
}

function formatTime(time) {
  if (!isNaN(time)) {
    var timeInt = Math.round(time);
    var timeMin = Math.floor(timeInt / 60);
    var timeSec = timeInt % 60;
    return timeMin + ':' + (timeSec < 10 ? '0' + timeSec : timeSec);
  } else {
    return '--:--';
  }
}

function mouseon(ev) {
  if (showControlBarTimeout) {
    clearTimeout(showControlBarTimeout);
  }
  addClass(elementRef.bar, 'active');
  addClass(elementRef.mediaContainer, 'hover');
  showControlBarTimeout = setTimeout(function () {
    removeClass(elementRef.bar, 'active');
    removeClass(elementRef.mediaContainer, 'hover');
  }, 1200);
}

function bind(el, action, callback) {
  // console.log(el, action, isFunction(callback));
  if (el) {
    el.addEventListener(action, function (ev) {
      if (isFunction(callback)) {
        callback(ev);
      }
    }, false);
  }
}

function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function addClass(el, cla) {
  var elClass = el.className.split(' ');
  if (elClass.indexOf(cla) < 0) {
    elClass.push(cla);
    el.className = elClass.join(' ');
  }
}

function removeClass(el, cla) {
  var elClass = el.className.split(' ');
  var ind = elClass.indexOf(cla);
  if (ind >= 0) {
    elClass.splice(ind, 1);
    el.className = elClass.join(' ');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  bind(elementRef.mediaUrl, 'change', autoType);
  bind(elementRef.mediaUrl, 'blur', autoType);
  bind(elementRef.loadBtn, 'click', player.load);
  bind(elementRef.mediaContainer, 'mousemove', mouseon);
  bind(document, 'webkitfullscreenchange', fullscreenEvent);
  bind(document, 'mozfullscreenchange', fullscreenEvent);
  bind(document, 'MSFullscreenChange', fullscreenEvent);
  bind(document, 'fullscreenchange', fullscreenEvent);

  autoType();
  player.load();
  bind(elementRef.progressBar, 'mousemove', seekPoint);
  bind(elementRef.progressBar, 'click', seekAction);
  bind(elementRef.play, 'click', player.playPause);
  bind(elementRef.fullscreen, 'click', player.fullscreen);

  bind(elementRef.media, 'loadeddata', mediaLoaded);
  bind(elementRef.media, 'timeupdate', onPlaying);
  bind(elementRef.media, 'progress', onBuffer);
  bind(elementRef.media, 'ended', player.pause);
  bind(elementRef.media, 'seeking', function () {
    elementRef.loader.style.display = 'block';
  });
  bind(elementRef.media, 'seeked', function () {
    elementRef.loader.style.display = 'none';
  });

  /* test bind */
  bind(document.getElementById('seek'), 'click', function () {
    var time = document.getElementById('media-range').value;
    player.seek(time);
  });
});
