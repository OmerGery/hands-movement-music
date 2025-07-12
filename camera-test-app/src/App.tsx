import { useEffect, useRef, useState } from 'react';
import { Hands, ResultsListener } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const drawingRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);

  const [status, setStatus] = useState('Loading...');
  const [brushColor, setBrushColor] = useState('#00ffcc');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.8,
    });

    hands.onResults(onResults as ResultsListener);

    if (videoRef.current) {
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current.start().then(() => {
        setStatus('Camera is working. Move your finger to draw!');
      });
    }

    return () => {
      cameraRef.current?.stop();
    };
  }, [brushColor, brushSize]);

  const onResults = (results: any) => {
    if (!canvasRef.current || !results.multiHandLandmarks) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    drawingRef.current = ctx;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;

    const landmarks = results.multiHandLandmarks[0];
    const fingerTip = landmarks?.[8];
    if (!fingerTip) return;

    const x = (1 - fingerTip.x) * canvasRef.current.width;

    const y = fingerTip.y * canvasRef.current.height;

    if (lastX.current !== null && lastY.current !== null) {
      ctx.beginPath();
      ctx.moveTo(lastX.current, lastY.current);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastX.current = x;
    lastY.current = y;
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    lastX.current = null;
    lastY.current = null;
  };

  return (
    <div style={styles.container}>
      <h1>Finger Brush</h1>
      <div style={styles.status}>{status}</div>

      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <span style={styles.label}>Brush Size:</span>
          {[3, 5, 8].map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              style={{
                ...styles.controlButton,
                background: brushSize === size ? '#007bff' : '#444',
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <div style={styles.controlGroup}>
          <span style={styles.label}>Color:</span>
          {['#00ffcc', '#ff0066', '#ffcc00', '#ffffff'].map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              style={{
                ...styles.colorButton,
                background: color,
                border: brushColor === color ? '2px solid white' : 'none',
              }}
            />
          ))}
        </div>

        <button onClick={clearCanvas} style={{ ...styles.controlButton, background: '#dc3545' }}>
          Clear Canvas
        </button>
      </div>

      <div style={styles.videoWrapper}>
        <video ref={videoRef} autoPlay playsInline style={styles.video} />
        <canvas ref={canvasRef} width={640} height={480} style={styles.canvas} />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 20,
    background: '#000',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    height: '100vh',
  },
  status: {
    margin: '10px 0',
    padding: '10px',
    background: '#222',
    borderRadius: 5,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '14px',
    color: '#ccc',
  },
  controlButton: {
    padding: '8px 14px',
    borderRadius: 5,
    cursor: 'pointer',
    background: '#444',
    color: 'white',
    border: 'none',
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    cursor: 'pointer',
    border: 'none',
  },
  videoWrapper: {
    position: 'relative',
    width: 640,
    height: 480,
    marginTop: 20,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 640,
    height: 480,
    transform: 'scaleX(-1)',
    zIndex: 1,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
};

export default App;
