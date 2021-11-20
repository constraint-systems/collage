import React, { useEffect, useRef } from "react";
import { ImageProps } from "./Image";
import * as THREE from "three";
import { UseWheelZoom, UsePointerPan } from "../utils/PointerUtils";

// from https://stackoverflow.com/a/45873660
// ctx is the 2d context of the canvas to be trimmed
// This function will return false if the canvas contains no or no non transparent pixels.
// Returns true if the canvas contains non transparent pixels
function trimCanvas(ctx) {
  // removes transparent edges
  var x, y, w, h, top, left, right, bottom, data, idx1, idx2, found, imgData;
  w = ctx.canvas.width;
  h = ctx.canvas.height;
  if (!w && !h) {
    return false;
  }
  imgData = ctx.getImageData(0, 0, w, h);
  data = new Uint32Array(imgData.data.buffer);
  idx1 = 0;
  idx2 = w * h - 1;
  found = false;
  // search from top and bottom to find first rows containing a non transparent pixel.
  for (y = 0; y < h && !found; y += 1) {
    for (x = 0; x < w; x += 1) {
      if (data[idx1++] && !top) {
        top = y + 1;
        if (bottom) {
          // top and bottom found then stop the search
          found = true;
          break;
        }
      }
      if (data[idx2--] && !bottom) {
        bottom = h - y - 1;
        if (top) {
          // top and bottom found then stop the search
          found = true;
          break;
        }
      }
    }
    if (y > h - y && !top && !bottom) {
      return false;
    } // image is completely blank so do nothing
  }
  top -= 1; // correct top
  found = false;
  // search from left and right to find first column containing a non transparent pixel.
  for (x = 0; x < w && !found; x += 1) {
    idx1 = top * w + x;
    idx2 = top * w + (w - x - 1);
    for (y = top; y <= bottom; y += 1) {
      if (data[idx1] && !left) {
        left = x + 1;
        if (right) {
          // if left and right found then stop the search
          found = true;
          break;
        }
      }
      if (data[idx2] && !right) {
        right = w - x - 1;
        if (left) {
          // if left and right found then stop the search
          found = true;
          break;
        }
      }
      idx1 += w;
      idx2 += w;
    }
  }
  left -= 1; // correct left
  if (w === right - left + 1 && h === bottom - top + 1) {
    return true;
  } // no need to crop if no change in size
  w = right - left + 1;
  h = bottom - top + 1;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.putImageData(imgData, -left, -top);
  return true;
}

const Assembler: React.FC<{ collage: any; showLoading: boolean }> = ({
  collage,
  showLoading,
}) => {
  const threeRef = useRef<any>({});
  const rendererRef = useRef<HTMLCanvasElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.Texture>(null);
  const pressedRef = useRef([]);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

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

    const texture = textureRef.current;
    const img = new Image();
    img.crossOrigin = "";
    img.onload = () => {
      const cols = Math.round(img.naturalWidth / cellSize);
      const rows = Math.round(img.naturalHeight / cellSize);

      bcx.drawImage(
        img,
        baseCanvas.width / 2 - (cols * cellSize) / 2,
        baseCanvas.height / 2 - (rows * cellSize) / 2,
        cols * cellSize,
        rows * cellSize
      );

      const faviconCanvas = document.createElement("canvas");
      faviconCanvas.width = 32;
      faviconCanvas.height = 32;
      const faviconCx = faviconCanvas.getContext("2d");
      faviconCx.drawImage(
        bcx.canvas,
        0,
        0,
        bcx.canvas.width,
        bcx.canvas.height,
        0,
        0,
        32,
        32
      );
      faviconCanvas.toBlob(async (blob) => {
        const link = document.querySelector("link[rel*='icon']");
        link.setAttribute("href", URL.createObjectURL(blob));
      });

      texture.needsUpdate = true;
    };
    img.src = collage.src;
  }, [collage]);

  UseWheelZoom(rendererRef, threeRef);

  UsePointerPan(rendererRef, threeRef);

  useEffect(() => {
    const pressed = pressedRef.current;
    const three = threeRef.current;

    const discretePanCamera = (diff: Array<number>) => {
      const visibleHeight =
        2 *
        Math.tan((three.camera.fov * Math.PI) / 360) *
        three.camera.position.z;
      const zoomPixel = visibleHeight / window.innerHeight;
      three.camera.position.x -= 16 * diff[0] * zoomPixel;
      three.camera.position.y += 16 * diff[1] * zoomPixel;
    };

    const discreteZoom = (change: number) => {
      const percent = (window.innerHeight - change) / window.innerHeight;
      three.camera.position.z = Math.min(
        32,
        Math.max(1, three.camera.position.z / percent)
      );
    };

    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === "-") {
        discreteZoom(32);
      } else if (press === "+" || press === "=") {
        discreteZoom(-32);
      }
      if (!pressed.includes(press)) {
        pressed.push(press);
      }
      if (pressed.includes("arrowleft") || pressed.includes("h")) {
        discretePanCamera([1, 0]);
      }
      if (pressed.includes("arrowright") || pressed.includes("l")) {
        discretePanCamera([-1, 0]);
      }
      if (pressed.includes("arrowup") || pressed.includes("k")) {
        discretePanCamera([0, 1]);
      }
      if (pressed.includes("arrowdown") || pressed.includes("j")) {
        discretePanCamera([0, -1]);
      }
    };

    const upHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      const index = pressed.indexOf(press);
      if (index !== -1) {
        pressed.splice(index, 1);
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

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
        }}
        ref={downloadCanvasRef}
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
      <div
        role="button"
        title="Download collage"
        style={{
          position: "fixed",
          background: "#ccc",
          left: 32,
          bottom: 32,
          width: 56,
          height: 56,
          borderRadius: 48,
          display: showLoading ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          cursor: "pointer",
          color: "#222",
        }}
        onClick={async () => {
          const downloadCanvas = downloadCanvasRef.current;
          downloadCanvas.width = 2048;
          downloadCanvas.height = 2048;
          const dcx = downloadCanvas.getContext("2d");
          dcx.drawImage(baseCanvasRef.current, 0, 0);
          trimCanvas(dcx);
          dcx.canvas.toBlob(async (blob) => {
            const imageURL = URL.createObjectURL(blob);
            let link = document.createElement("a");
            link.setAttribute(
              "download",
              "collage-" + Math.round(new Date().getTime() / 1000) + ".png"
            );
            link.setAttribute("href", imageURL);
            link.dispatchEvent(
              new MouseEvent(`click`, {
                bubbles: true,
                cancelable: true,
                view: window,
              })
            );
          });
        }}
      >
        <div>↓</div>
      </div>
    </>
  );
};

export default Assembler;
