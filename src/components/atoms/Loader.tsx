import React from "react";
import Image from "next/image";
import background from "../../assets/background.png";
import arrow from "../../assets/arrow.png";
import circle from "../../assets/circle.svg";

export const Loader: React.FC = () => (
  <div
    style={{
      width: "100vw",
      height: "100vh",
      minHeight: "100dvh",
      minWidth: "100vw",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: `url(${background.src}) center center / cover no-repeat`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "relative",
        width: "30vw",
        maxWidth: 180,
        minWidth: 90,
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
      }}
    >
      {/* Círculo */}
      <Image
        src={circle}
        alt="Círculo"
        style={{
          width: "60%",
          height: "auto",
          position: "absolute",
          top: "20%",
          left: "20%",
          zIndex: 2,
        }}
        priority
        draggable={false}
      />
      {/* Flecha girando alrededor del círculo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          pointerEvents: "none",
          animation: "spin-reverse 1.2s linear infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-32%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "auto",
          }}
        >
          <Image
            src={arrow}
            alt="Cargando"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "180px",
              minWidth: "90px",
            }}
            priority
            draggable={false}
          />
        </div>
      </div>
    </div>
    {/* Nombre CORA debajo */}
    <span
      style={{
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: '2.5rem',
        color: '#fffbe9',
        letterSpacing: 2,
        textShadow: '0 2px 8px #0002',
        marginBottom: 8,
      }}
    >
      CORA
    </span>
    <style jsx global>{`
      @keyframes spin-reverse {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(-360deg); }
      }
    `}</style>
  </div>
);
