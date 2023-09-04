/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
// import styles from "./page.module.css";
import { FaAssistiveListeningSystems } from "react-icons/fa";
import { RiSpeakFill } from "react-icons/ri";

export default function Home() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      setMediaRecorder(new MediaRecorder(stream));
    });
  }, []); // Setup mediaRecorder initially

  useEffect(() => {
    if (mediaRecorder) {
      const socket = io("ws://localhost:4000");

      socket.on("connect", async () => {
        console.log("client connected to websocket");
        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            socket.emit("packet-sent", event.data);
          }
        });
        mediaRecorder.start(500);
      });

      socket.on("audioData", (arrayBuffer: ArrayBuffer) => {
        setIsRecording(false);
        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);

        const audioElement = new Audio(audioUrl);
        audioElement.onended = () => setIsRecording(true);
        audioElement.play();
      });

      return () => {
        socket.disconnect(); // Clean up the socket connection on component unmount
      };
    }
  }, [mediaRecorder]);

  useEffect(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      if (isRecording) {
        mediaRecorder.resume();
      } else {
        mediaRecorder.pause();
      }
    }
  }, [isRecording, mediaRecorder]);

  return (
    <main className='bg-blue-50 w-full h-screen pt-12 px-12 flex flex-col items-center'>
      <img src='logo.png' alt='flair logo' className='h-12 w-12' />

      <h3 className='font-semibold text-lg mt-3'>
        VoiceGPT - Your voice AI assistant
      </h3>
      <section className='grid grid-cols-2 w-full'>
        <aside className='relative flex flex-col justify-center items-center h-96'>
          <img
            src='pulse.svg'
            alt='pulse bg'
            className='absolute opacity-75 w-3/4'
          />
          <img src='polygon.svg' alt='polygon bg' className='absolute -mr-28' />
          <div className='h-24 w-24 flex justify-center items-center relative'>
            <div
              className={
                "h-16 w-16 rounded-full bg-teal-600" +
                (isRecording ? " animate-ping " : "")
              }
            ></div>
            <RiSpeakFill className='block mx-auto absolute text-white w-6 h-6' />
          </div>
          <article className='absolute top-1/2 left-1/2 -ml-10 text-center'>
            <h4 className='mt-20 font-semibold'>You</h4>
            {isRecording && <p>Speaking...</p>}
          </article>
        </aside>
        <aside className='relative flex flex-col justify-center items-center h-96'>
          <img
            src='pulse.svg'
            alt='pulse bg'
            className='absolute opacity-75 w-3/4'
          />
          <img
            src='polygon.svg'
            alt='polygon bg'
            className='absolute rotate-180 -ml-28'
          />
          <div className='h-24 w-24 flex justify-center items-center relative'>
            <div className={"h-16 w-16 rounded-full bg-sky-600"}></div>
            <FaAssistiveListeningSystems className='block mx-auto absolute text-white w-6 h-6' />
          </div>
          <article className='absolute top-1/2 left-1/2 -ml-10 text-center'>
            <h4 className='mt-20 font-semibold'>Flair AI</h4>
            {isRecording && <p>Listening...</p>}
          </article>
        </aside>
      </section>
      <section className='bg-white w-4/5 mx-auto rounded-t-lg border-2 border-sky-300 shadow grow p-5 z-10'>
        <h5 className='font-semibold text-lg'>Transcription</h5>
      </section>
    </main>
  );
}
