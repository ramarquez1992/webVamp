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
  gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);


  // REVERB
  var reverbNode = Reverb(audioContext)
  reverbNode.connect(audioContext.destination)

  reverbNode.time = 1 //seconds
  reverbNode.wet.value = 0.8
  reverbNode.dry.value = 1

  reverbNode.filterType = 'lowpass'
  reverbNode.cutoff.value = 4000 //Hz



  microphoneStream = audioContext.createMediaStreamSource(stream);
  microphoneStream.connect(gainNode);

  microphoneStream.connect(reverbNode);


  scriptProcessorNode = audioContext.createScriptProcessor(BUFF_SIZE, 1, 1);
  scriptProcessorNode.onaudioprocess = processMicrophoneBuffer;

  microphoneStream.connect(scriptProcessorNode);

  // --- enable volume control for output speakers

  document.getElementById('gain').addEventListener('change', function () {
    var currGain = this.value;
    gainNode.gain.value = currGain;
  });

  // --- setup FFT

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
