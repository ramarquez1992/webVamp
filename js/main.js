var audioContext = getAudioCtx();
var BUFF_SIZE = 16384;
var audioInput = null,
  microphoneStream = null,
  gainNode = null,
  scriptProcessorNode = null,
  scriptProcessorFFTNode = null,
  analyserNode = null;

$(document).ready(function () {
  initAudioInput();
  initGUI();
});

function initGUI() {
  //alert(asdf);
}

function initAudioInput() {
  console.log("audio is starting up ...");

  if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia;

  if (navigator.getUserMedia) {

    navigator.getUserMedia({audio: true},
      function (stream) {
        startMicrophone(stream);
      },
      function (e) {
        alert('Error capturing audio.');
      }
    );

  } else {
    alert('getUserMedia not supported in this browser.');
  }
}


// ---


function getAudioCtx() {
  if ( window.AudioContext ) return new window.AudioContext();
  else if ( window.webkitAudioContext ) return new window.webkitAudioContext();
  else if ( window.audioContext ) return new window.audioContext();
  else alert( 'Browser audio requirements not met' );
}

function processMicrophoneBuffer(event) {
  var microphoneOutputBuffer = event.inputBuffer.getChannelData(0); // contains current frame of data size BUFF_SIZE
  //draw( microphoneOutputBuffer, 0, 'freqDomainCanvas' );
}

function startMicrophone(stream) {
  microphoneStream = audioContext.createMediaStreamSource(stream);

  // VOLUME
  volumeNode = audioContext.createGain();

  document.getElementById('volume').addEventListener('change', function () {
    var currVolume = this.value;
    volumeNode.gain.value = currVolume;
  });

  // GAIN
  gainNode = audioContext.createGain();

  document.getElementById('gain').addEventListener('change', function () {
    var currGain = this.value;
    gainNode.gain.value = currGain;
  });


  // REVERB
  var reverbNode = Reverb(audioContext);
  reverbNode.time = 0; // seconds
  reverbNode.wet.value = 0.8;
  reverbNode.dry.value = 1;
  reverbNode.filterType = 'lowpass';
  reverbNode.cutoff.value = 4000; // Hz

  document.getElementById('reverb').addEventListener('change', function () {
    var currReverb = this.value;
    reverbNode.time = currReverb;
  });


  // TONE
  var toneNode = audioContext.createBiquadFilter();
  toneNode.type = "highshelf";
  toneNode.frequency.value = 2000;  // Hz
  toneNode.gain.value = 50;

  document.getElementById('tone').addEventListener('change', function () {
    var currTone = this.value;
    toneNode.frequency.value = currTone;
  });

  microphoneStream.connect(volumeNode);
  volumeNode.connect(gainNode);
  volumeNode.connect(reverbNode);

  reverbNode.connect(toneNode);
  toneNode.connect(audioContext.destination);

  gainNode.connect(reverbNode);
  gainNode.connect(audioContext.destination);



  // Complete mic stream setup
  scriptProcessorNode = audioContext.createScriptProcessor(BUFF_SIZE, 1, 1);
  scriptProcessorNode.onaudioprocess = processMicrophoneBuffer;

  microphoneStream.connect(scriptProcessorNode);




  // Setup FFT
  scriptProcessorFFTNode = audioContext.createScriptProcessor(2048, 1, 1);
  scriptProcessorFFTNode.connect(gainNode);

  analyserNode = audioContext.createAnalyser();
  analyserNode.smoothingTimeConstant = 0;
  analyserNode.fftSize = 2048;

  microphoneStream.connect(analyserNode);

  analyserNode.connect(scriptProcessorFFTNode);

  scriptProcessorFFTNode.onaudioprocess = function () {

    // get the average for the first channel
    var array = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(array);

    // draw the spectrogram
    if (microphoneStream.playbackState == microphoneStream.PLAYING_STATE) {
      draw( array, -1, 'freqDomainCanvas' );
    }
  };
}
