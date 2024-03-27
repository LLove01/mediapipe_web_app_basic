import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawLandmarks } from '@mediapipe/drawing_utils';
import './App.css';

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const updateVideoDimensions = useCallback(() => {
    if (videoRef.current) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      videoRef.current.width = width;
      videoRef.current.height = height;
    }
  }, []);

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
      if (canvasRef.current && videoRef.current && results.poseLandmarks) {
        const canvasCtx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#1F51FF', fillColor: '#D3D3D3', lineWidth: 2, radius: 5 });
        canvasCtx.restore();
      }
    });

    window.addEventListener('resize', updateVideoDimensions);

    if (cameraActive && videoRef.current) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }

    return () => {
      if (camera) {
        camera.stop();
      }
      pose.close();
      window.removeEventListener('resize', updateVideoDimensions);
    };
  }, [cameraActive, updateVideoDimensions]);

  useEffect(() => {
    // Automatically adjust video dimensions on initial load
    updateVideoDimensions();
  }, [updateVideoDimensions]);

  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach((track) => {
          track.stop();
        });

        videoRef.current.srcObject = null;
      }
    } else {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: {
            aspectRatio: 16 / 9,
            // Use 'ideal' values to suggest preferences but allow flexibility
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight },
            frameRate: { ideal: 60 }, // Adjust frame rate for better performance
          }
        })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.error(`Error accessing the camera: ${err}`);
          });
      }
    }

    setCameraActive(!cameraActive);
  }, [cameraActive]);

  return (
    <div className="App">
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
