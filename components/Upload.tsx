import { useState, useRef, useEffect } from "react";
import { useS3Upload } from "next-s3-upload";
import S3 from "aws-sdk/clients/s3";
import { getBase64Strings } from "exif-rotate-js/lib";
import Loader from "react-loader-spinner";

import dummy from "./starter.json"

export default function UploadTest({
  setCollage,
  showLoading,
  setShowLoading,
}) {
  let { FileInput, openFileDialog } = useS3Upload();
  const warningConfirmedRef = useRef(false);
  const baseCanvasRef = useRef(null);
  const [message, setMessage] = useState("");

  let handleFileChange = async (file: any) => {
    // correct orientation
    setMessage("getting latest collage");
    setShowLoading(true);
    const baseCanvas = baseCanvasRef.current;
    baseCanvas.width = 2048;
    baseCanvas.height = 2048;
    const bcx = baseCanvas.getContext("2d");

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 2048;
    tempCanvas.height = 2048;
    const tcx = tempCanvas.getContext("2d");

    const cellSize = 32;
    const cellCanvas = document.createElement("canvas");
    cellCanvas.width = cellSize;
    cellCanvas.height = cellSize;
    const cellCx = cellCanvas.getContext("2d");

    const recentResponse = await fetch("api/collage/mostRecent", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    });
    const mostRecentCollage = await recentResponse.json();
    // const mostRecentCollage = dummy

    const newValues = JSON.parse(mostRecentCollage.values).map(
      (v: number) => v - 200
    );

    const baseImg = new Image();
    baseImg.crossOrigin = "";
    baseImg.onload = async () => {
      const cols = Math.round(baseImg.naturalWidth / cellSize);
      const rows = Math.round(baseImg.naturalHeight / cellSize);

      bcx.drawImage(
        baseImg,
        baseImg.width / 2 - (cols * cellSize) / 2,
        baseImg.height / 2 - (rows * cellSize) / 2,
        cols * cellSize,
        rows * cellSize
      );

      const img = new Image();
      img.crossOrigin = "";
      img.onload = async () => {
        const cols = Math.round(img.naturalWidth / cellSize);
        const rows = Math.round(img.naturalHeight / cellSize);

        tcx.drawImage(
          img,
          tempCanvas.width / 2 - (cols * cellSize) / 2,
          tempCanvas.height / 2 - (rows * cellSize) / 2,
          cols * cellSize,
          rows * cellSize
        );

        for (let r = 0; r < 2048 / cellSize; r++) {
          for (let c = 0; c < 2048 / cellSize; c++) {
            cellCx.clearRect(0, 0, cellSize, cellSize);
            cellCx.drawImage(
              tempCanvas,
              c * cellSize,
              r * cellSize,
              cellSize,
              cellSize,
              0,
              0,
              cellSize,
              cellSize
            );

            const index = r * (2048 / cellSize) + c;
            const value = cellCanvas.toDataURL().length;
            if (value > newValues[index]) {
              newValues[index] = value;
              bcx.drawImage(
                cellCanvas,
                0,
                0,
                cellSize,
                cellSize,
                c * cellSize,
                r * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
        setMessage("processing image");

        const collageName =
          "push-" + Math.round(new Date().getTime() / 1000) + ".png";
        let res = await fetch(`/api/s3-upload?filename=${collageName}`);
        let data = await res.json();

        let s3 = new S3({
          accessKeyId: data.token.Credentials.AccessKeyId,
          secretAccessKey: data.token.Credentials.SecretAccessKey,
          sessionToken: data.token.Credentials.SessionToken,
          region: data.region,
        });

        baseCanvas.toBlob(async (blob) => {
          let params = {
            ACL: "public-read",
            Bucket: data.bucket,
            Key: data.key,
            Body: blob,
            CacheControl: "max-age=630720000, public",
            ContentType: "image/png",
          };

          let s3Upload = s3.upload(params);

          let uploadResult = await s3Upload.promise();

          let { Location } = uploadResult;

          // let Location = 'foobar';

          const valueJson = JSON.stringify(newValues);
          await fetch("api/collage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              src: Location,
              values: valueJson,
            }),
          })
            .then((res) => res.json())
            .then((json) => {
              json.src = URL.createObjectURL(blob);
              setCollage(json);
              setShowLoading(false);

              const faviconCanvas = document.createElement("canvas");
              faviconCanvas.width = 32;
              faviconCanvas.height = 32;
              const faviconCx = faviconCanvas.getContext("2d");
              faviconCx.drawImage(
                baseCanvas,
                0,
                0,
                baseCanvas.width,
                baseCanvas.height,
                0,
                0,
                32,
                32
              );
              faviconCanvas.toBlob(async (blob) => {
                const link = document.querySelector("link[rel*='icon']");
                link.setAttribute("href", URL.createObjectURL(blob));
              });
            });
        });
      };
      const oriented = await getBase64Strings([file], { maxSize: 2048 });

      img.src = oriented[0];
    };
    baseImg.src = mostRecentCollage.src;
  };

  useEffect(() => {
    const onPaste = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      for (const item of e.clipboardData.items) {
        if (item.type.indexOf("image") < 0) {
          continue;
        }
        let file = item.getAsFile();
        handleFileChange(file);
      }
    };

    const onDrop = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      let file = e.dataTransfer.files[0];
      handleFileChange(file);
    };

    const onDrag = (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", onDrag);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", onDrag);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: showLoading ? "block" : "none",
        }}
      >
        <Loader type="TailSpin" color="#ccc" height={60} width={60} />
      </div>

      <canvas
        style={{
          maxWidth: "calc(100% - 32px)",
          width: "100%",
          display: "none",
        }}
        ref={baseCanvasRef}
      ></canvas>
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          display: showLoading ? "flex" : "none",
        }}
      >
        <div
          style={{
            position: "fixed",
            left: 0,
            width: "100%",
            bottom: 32,
            display: showLoading ? "flex" : "none",
            pointerEvents: "none",
            background: "rgba(0,0,0,0.8)",
          }}
        >
          <div
            style={{
              padding: "16px 0",
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "#eee",
            }}
          >
            <div>{message}...</div>
          </div>
        </div>
      </div>
      <FileInput onChange={handleFileChange} accept=".jpg,.png,.jpeg" />
      <div
        role="button"
        title="Add an image"
        style={{
          position: "fixed",
          background: "#ccc",
          right: 32,
          bottom: 32,
          width: 56,
          height: 56,
          borderRadius: 48,
          display: showLoading ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          cursor: "pointer",
          color: "#222",
        }}
        onClick={() => {
          if (!warningConfirmedRef.current) {
            const confirmed = confirm(
              "Any images you upload will be publicly visible as a part of the collage. Make sure you don't upload anything you don't want to be public."
            );
            if (confirmed) {
              openFileDialog();
              warningConfirmedRef.current = true;
            }
          } else {
            openFileDialog();
          }
        }}
      >
        <div>+</div>
      </div>
    </div>
  );
}
