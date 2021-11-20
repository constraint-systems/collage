import React, { useEffect, useRef } from "react";
import { ImageProps } from "./Image";
import * as THREE from "three";
import { UseWheelZoom, UsePointerPan } from "../utils/PointerUtils";

const Assembler: React.FC<{ images: ImageProps }> = ({ images }) => {
  const threeRef = useRef<any>({});
  const rendererRef = useRef<HTMLCanvasElement>(null);
  const imageQueue = useRef([]);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.Texture>(null);

  // set up three scene
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    threeRef.current.camera = camera;
    const renderer = new THREE.WebGLRenderer({
      canvas: rendererRef.current,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * 5;
    const zoomPixel = visibleHeight / window.innerHeight;

    const geometry = new THREE.PlaneGeometry(
      2048 * zoomPixel,
      2048 * zoomPixel
    );

    const backCanvas = document.createElement("canvas");
    backCanvas.width = 2048;
    backCanvas.height = 2048;
    const backcx = backCanvas.getContext("2d");
    backcx.lineWidth = 8;
    backcx.strokeStyle = "#222222";
    backcx.strokeRect(4, 4, 2048 - 4, 2048 - 4);
    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.magFilter = THREE.NearestFilter;

    const backerMaterial = new THREE.MeshBasicMaterial({ map: backTexture });
    const meshBack = new THREE.Mesh(geometry, backerMaterial);
    scene.add(meshBack);

    const texture = new THREE.CanvasTexture(baseCanvasRef.current);
    texture.magFilter = THREE.NearestFilter;
    textureRef.current = texture;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 10;
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;

    const baseValues = Array(4096).fill(0);
    const cellSize = 32;
    baseCanvas.width = 2048;
    baseCanvas.height = 2048;
    const bcx = baseCanvas.getContext("2d");
    bcx.clearRect(0, 0, 2048, 2048);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 2048;
    tempCanvas.height = 2048;
    const tcx = tempCanvas.getContext("2d");

    const texture = textureRef.current;

    imageQueue.current = images.slice();

    const processImage = () => {
      const image = imageQueue.current.shift();
      if (!image) return;

      const img = new Image();
      img.crossOrigin = "";
      img.onload = () => {
        const cols = Math.round(img.naturalWidth / cellSize);
        const rows = Math.round(img.naturalHeight / cellSize);

        tcx.clearRect(0, 0, 2048, 2048);
        tcx.drawImage(
          img,
          tempCanvas.width / 2 - (cols * cellSize) / 2,
          tempCanvas.height / 2 - (rows * cellSize) / 2,
          cols * cellSize,
          rows * cellSize
        );

        const values = JSON.parse(image.values);
        for (let i = 0; i < values.length; i++) {
          const baseValue = baseValues[i];
          const value = values[i] - imageQueue.current.length * 200;

          const c = i % (2048 / cellSize);
          const r = Math.floor(i / (2048 / cellSize));

          if (value > baseValue) {
            baseValues[i] = value;
            bcx.drawImage(
              tempCanvas,
              c * cellSize,
              r * cellSize,
              cellSize,
              cellSize,
              c * cellSize,
              r * cellSize,
              cellSize,
              cellSize
            );
          }
        }
        processImage();
        texture.needsUpdate = true;
      };
      img.src = image.src;
    };

    processImage();
  }, [images]);

  UseWheelZoom(rendererRef, threeRef);

  UsePointerPan(rendererRef, threeRef);

  return (
    <>
      <canvas
        style={{
          position: "fixed",
          left: "0",
          top: "0",
        }}
        ref={rendererRef}
      />
      <canvas
        style={{
          display: "none",
          position: "fixed",
          width: "100%",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
        ref={baseCanvasRef}
      />
    </>
  );
};

export default Assembler;
