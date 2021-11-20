import { raw } from "@prisma/client/runtime";
import React, { useEffect } from "react";

export type ImageProps = {
  id: number;
  name: string;
  src: string;
  values: string;
  setLoadedCount: (loadedCount: number) => void;
};

const cellSize = 32;
const Image: React.FC<{ image: ImageProps }> = ({ image }) => {
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const cols = Math.round(img.naturalWidth / cellSize);
    const rows = Math.round(img.naturalHeight / cellSize);
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 2048;
    const cx = canvas.getContext("2d");
    cx.drawImage(
      img,
      canvas.width / 2 - (cols * cellSize) / 2,
      canvas.height / 2 - (rows * cellSize) / 2,
      canvas.width,
      canvas.height
    );

    const cellCanvas = document.createElement("canvas");
    cellCanvas.width = cellSize;
    cellCanvas.height = cellSize;
    const cellCx = cellCanvas.getContext("2d");
    const cellValues = [];
    for (let r = 0; r < canvas.width / cellSize; r++) {
      for (let c = 0; c < canvas.height / cellSize; c++) {
        cellCx.drawImage(
          canvas,
          c * cellSize,
          r * cellSize,
          cellSize,
          cellSize,
          0,
          0,
          cellSize,
          cellSize
        );
        const cellData = cellCanvas.toDataURL();
        cellValues.push(cellData.length);
      }
    }
  }, [imgRef]);

  return (
    <img
      key={image.id}
      ref={imgRef}
      crossOrigin=""
      style={{
        position: "fixed",
        width: "50%",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
      }}
      src={image.src}
    />
  );
};

export default Image;
