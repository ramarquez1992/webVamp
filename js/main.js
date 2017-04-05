var audioContext = getAudioCtx();
var volumeNode,
  gainNode,
  toneNode,
  reverbNode;

$(document).ready(function () {
  //initGUI();
  initAudioInput();
});

// Initialize after audio so dials can connect to nodes
function initGUI() {
  $("#helpDialog").dialog({
    modal: true,
    autoOpen: false,
    width: '60%',
  });

  $('#volumeDial').knob({
    'change': function (v) { setVolume(v.toFixed(2)); },
    'release': function (v) { setVolume(v.toFixed(2)); }
  });
  $('#volumeDial').val(1).trigger('change');

  $('#gainDial').knob({
    'change': function (v) { setGain(v.toFixed(2)); },
    'release': function (v) { setGain(v.toFixed(2)); }
  });
  $('#gainDial').val(5).trigger('change');

  $('#toneDial').knob({
    'change': function (v) { setTone(v.toFixed(2)); },
    'release': function (v) { setTone(v.toFixed(2)); }
  });
  $('#toneDial').val(1800).trigger('change');

  $('#reverbDial').knob({
    'change': function (v) { setReverb(v.toFixed(2)); },
    'release': function (v) { setReverb(v.toFixed(2)); }
  });
  $('#reverbDial').val(1).trigger('change');

}

function setVolume(v) {
  volumeNode.gain.value = v;
}

function setGain(v) {
  gainNode.gain.value = v;
}

function setTone(v) {
  toneNode.frequency.value = v;
}

function setReverb(v) {
  reverbNode.time = v;
}

function initAudioInput() {
  // Assign navigator.getUserMedia on per browser basis
  if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia;

  // Start stream if possible, else display error
  if (navigator.getUserMedia) {
    navigator.getUserMedia( { audio: true },
      function (stream) {
        startMicrophone(stream);
        initGUI();
      },
      function (e) {
        alert('Error capturing audio.');
      }
    );

  } else {
    alert('getUserMedia not supported in this browser.');
  }
}

function startMicrophone(stream) {
  var microphoneStream = audioContext.createMediaStreamSource(stream);

  // Volume
  volumeNode = audioContext.createGain();

  // Gain
  gainNode = audioContext.createGain();

  // Tone
  toneNode = audioContext.createBiquadFilter();
  toneNode.type = "highshelf";
  toneNode.frequency.value = 2000;  // Hz
  toneNode.gain.value = 50;

  // Reverb
  reverbNode = Reverb(audioContext);
  reverbNode.time = 0; // seconds
  reverbNode.wet.value = 0.8;
  reverbNode.dry.value = 1;
  reverbNode.filterType = 'lowpass';
  reverbNode.cutoff.value = 4000; // Hz

  // Connect effects
  microphoneStream.connect(volumeNode);
  volumeNode.connect(gainNode);
  volumeNode.connect(reverbNode);

  reverbNode.connect(toneNode);
  toneNode.connect(audioContext.destination);

  gainNode.connect(reverbNode);
  gainNode.connect(audioContext.destination);


  // Waveform spectrogram
  var scriptProcessorNode = audioContext.createScriptProcessor(2048, 1, 1);
  scriptProcessorNode.connect(volumeNode);
  microphoneStream.connect(scriptProcessorNode);

  scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {
    var frameBuffer = audioProcessingEvent.inputBuffer.getChannelData(0);

    // Draw waveform
    if (microphoneStream.playbackState == microphoneStream.PLAYING_STATE) {
      draw(frameBuffer, 0, 'timeDomainCanvas');
    }
  };
}

function getAudioCtx() {
  if (window.AudioContext) return new window.AudioContext();
  else if (window.webkitAudioContext) return new window.webkitAudioContext();
  else if (window.audioContext) return new window.audioContext();
  else alert('Browser audio requirements not met');
}
