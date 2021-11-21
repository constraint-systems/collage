import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Upload from "../components/Upload";
import Assembler from "../components/Assembler";
import Head from "next/head";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

const Blog: React.FC = () => {
  const [collage, setCollage] = React.useState(null);
  const [showMore, setShowMore] = React.useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    fetch("api/collage/mostRecent", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => setCollage(res));
  }, []);

  return (
    <Layout>
      <Head>
        <title>Collage</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="icon" href="/icon.png" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="An experimental public collage that combines images according to their complexity."
        />
        <meta property="og:title" content="Collage" />
        <meta
          property="og:description"
          content="An experimental public collage that combines images according to their complexity."
        />
        <meta
          property="og:image"
          content="https://collage.constraint.systems/collage.jpg"
        />
        <meta property="og:url" content="https://collage.constraint.systems" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {collage ? (
        <Assembler collage={collage} showLoading={showLoading} />
      ) : (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Loader type="TailSpin" color="#ccc" height={60} width={60} />
        </div>
      )}
      {collage ? (
        <Upload
          setCollage={setCollage}
          showLoading={showLoading}
          setShowLoading={setShowLoading}
        />
      ) : null}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          color: "#ddd",
          padding: "8px 16px",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            background: "rgba(0,0,0,0.5)",
            paddingTop: 1,
            paddingBottom: 1,
          }}
        >
          Upload an image to add it the public collage.{" "}
          {showMore ? (
            <>
              <span
                role="button"
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={() => setShowMore(false)}
              >
                Less info
              </span>
              <span>
                <br />
                Which image cells are shown is determined by{" "}
                <a href="https://res.constraint.systems/" target="_blank">
                  comparing their complexity
                </a>
                . <br />
                There is a decay rate that makes older images drop out over
                time.
                <br />
                by{" "}
                <a href="https://constraint.systems" target="_blank">
                  Constraint Systems
                </a>
              </span>{" "}
            </>
          ) : (
            <span
              role="button"
              style={{ textDecoration: "underline", cursor: "pointer" }}
              onClick={() => setShowMore(true)}
            >
              More info
            </span>
          )}
        </span>
      </div>
    </Layout>
  );
};

export default Blog;
