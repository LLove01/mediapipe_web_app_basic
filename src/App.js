import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawLandmarks } from '@mediapipe/drawing_utils';
import './App.css';

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fpsRef = useRef(null);
  const lastFrameTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);

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

        // Update FPS counter
        const now = Date.now();
        frameCountRef.current++;
        if (now - lastFrameTimeRef.current >= 1000) {
          const fps = frameCountRef.current / ((now - lastFrameTimeRef.current) / 1000);
          if (fpsRef.current) {
            fpsRef.current.textContent = `FPS: ${fps.toFixed(2)}`;
          }
          lastFrameTimeRef.current = now;
          frameCountRef.current = 0;
        }
      }
    });

    if (cameraActive && videoRef.current) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          // Process the frame multiple times for stress testing
          for (let i = 0; i < 3; i++) {
            await pose.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720
      });
      camera.start();
    }

    return () => {
      if (camera) {
        camera.stop();
      }
      pose.close();
    };
  }, [cameraActive]);

  const toggleCamera = useCallback(() => {
    setCameraActive(active => !active);
  }, []);

  return (
    <div className="App" ref={containerRef}>
      <div className="fullscreen-container">
        <div className="navbar">
          <button onClick={toggleCamera}>
            {cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          </button>
        </div>
        <div className="video-container">
          {cameraActive && (
            <>
              <video ref={videoRef} className="input-video" autoPlay playsInline muted></video>
              <canvas ref={canvasRef} className="output-canvas"></canvas>
              <div ref={fpsRef} className="fps-counter">FPS: 0</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
