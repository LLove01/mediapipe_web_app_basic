import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawLandmarks } from '@mediapipe/drawing_utils';
import './App.css';

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Declare canvasRef here

  useEffect(() => {
    let camera;
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      // drawing 
      if (canvasRef.current && videoRef.current && results.poseLandmarks) {
        const canvasCtx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // drawing key points
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#1F51FF', fillColor: '#D3D3D3', lineWidth: 2, radius: 5 });
        canvasCtx.restore();
      }
    });

    if (cameraActive && videoRef.current) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720
      });
      camera.start();
    }

    return () => {
      if (camera) {
        camera.stop(); // Stop the camera when the component unmounts or camera is turned off
      }
      pose.close(); // Close the pose model to clean up resources
    };
  }, [cameraActive]);



  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      // Turning the camera off
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach((track) => {
          track.stop(); // This line stops each track
        });

        videoRef.current.srcObject = null; // Clear the srcObject to release the stream
      }

      // Exit fullscreen when turning the camera off
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error(`Error attempting to disable full-screen mode: ${err.message} (${err.name})`);
        });
      }
    } else {
      // Attempt to enter full-screen and start camera stream
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: {
            aspectRatio: 16 / 9,
            width: { ideal: 1280 },
            frameRate: { ideal: 60 },
          }
        })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              // Access the video track's settings to log the frame rate
              const videoTrack = stream.getVideoTracks()[0]; // Assuming you're interested in the first video track
              const trackSettings = videoTrack.getSettings();
              console.log(`Actual frame rate: ${trackSettings.frameRate}`);
            }
          })
          .catch(err => {
            console.error(`Error accessing the camera: ${err}`);
          });
      }
    }

    setCameraActive(!cameraActive);
  }, [cameraActive]);

  // Add an effect to listen for fullscreen changes
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement && cameraActive) {
        toggleCamera(); // Toggle camera off when exiting fullscreen
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [cameraActive, toggleCamera]);


  return (
    <div className="App" ref={containerRef}>
      <div className="fullscreen-container">
        {/* Navbar section */}
        <div className="navbar">
          <button onClick={toggleCamera}>
            {cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          </button>

        </div>

        {/* Video and Canvas Container */}
        <div className="video-container">
          {cameraActive && (
            <>
              <video ref={videoRef} className="input-video" autoPlay playsInline muted ></video>
              <canvas ref={canvasRef} className="output-canvas"></canvas>

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;