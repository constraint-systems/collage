import React, { useEffect, useRef, useState } from "react";
import { GetStaticProps } from "next";
import Layout from "../components/Layout";
import Upload from "../components/Upload";
import prisma from "../lib/prisma";
import Assembler from "../components/Assembler";
import Head from "next/head";

export const getStaticProps: GetStaticProps = async () => {
  const collage = await prisma.collage.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      src: true,
      values: true,
    },
  });
  return {
    props: {
      collage,
    },
  };
};

const Blog: React.FC = (props: any) => {
  const [collage, setCollage] = React.useState(props.collage);
  const [showMore, setShowMore] = React.useState(false);
  const [showLoading, setShowLoading] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Collage</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="icon" />
      </Head>
      <Assembler collage={collage} showLoading={showLoading} />
      <Upload
        collage={collage}
        setCollage={setCollage}
        showLoading={showLoading}
        setShowLoading={setShowLoading}
      />
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
