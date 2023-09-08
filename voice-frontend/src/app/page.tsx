/* eslint-disable @next/next/no-img-element */
"use client";

// import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { FaAssistiveListeningSystems } from "react-icons/fa";
import { RiSpeakFill } from "react-icons/ri";

const dummyConversation = [
  {
    owner: "user",
    text: "Hello, I have a question about my account.",
    timestamp: new Date(),
  },
  {
    owner: "ai",
    text: "Hello! I'm here to help. What can I assist you with today?",
    timestamp: new Date(),
  },
  {
    owner: "user",
    text: "I noticed some unusual activity on my account. Can you check it for me?",
    timestamp: new Date(),
  },
  {
    owner: "ai",
    text: "Of course, I'd be happy to assist you with that. Can you please provide me with your account number or username?",
    timestamp: new Date(),
  },
  {
    owner: "user",
    text: "My account number is 123456789.",
    timestamp: new Date(),
  },
  {
    owner: "ai",
    text: "Thank you for providing your account number. Let me look that up for you. One moment, please.",
    timestamp: new Date(),
  },
  {
    owner: "ai",
    text: "I've checked your account, and I see some recent transactions. Can you please specify which transactions seem unusual to you?",
    timestamp: new Date(),
  },
  {
    owner: "user",
    text: "There's a charge for $100 from a store I've never visited. I didn't make that transaction.",
    timestamp: new Date(),
  },
  {
    owner: "ai",
    text: "I'm sorry to hear that. It does look suspicious. I'll initiate an investigation into this matter and block the transaction. Your funds will be safe. Is there anything else I can assist you with?",
    timestamp: new Date(),
  },
  {
    owner: "user",
    text: "No, that's all for now. Thank you for your help.",
    timestamp: new Date(),
  },
  {
    owner: "ai",
    text: "You're welcome! If you have any more questions or concerns in the future, please don't hesitate to reach out. Have a great day!",
    timestamp: new Date(),
  },
].map((_, i) => ({
  ..._,
  timestamp: new Date(_.timestamp.getTime() + i * 2000),
}));

const entities = ["property", "properties", "house", "lot", "price"];

type Transcript = { owner: "user" | "ai"; text: string; timestamp: Date };

export default function Home() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(true);
  const [transcripts, setTranscripts] = useState<Transcript[]>(
    dummyConversation as Transcript[]
  );

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

      socket.on("transcriptData", (transcript: string) => {
        setTranscripts((prev) => [
          ...prev,
          { owner: "user", text: transcript, timestamp: new Date() },
        ]);
      });
      socket.on("openAIData", (transcript: string) => {
        setIsRecording(false);
        setTranscripts((prev) => [
          ...prev,
          { owner: "ai", text: transcript, timestamp: new Date() },
        ]);
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
    <main className='relative bg-blue-50 w-full h-screen pt-10 px-10 flex flex-col items-center'>
      <section className='absolute flex flex-col items-center'>
        <img src='logo.png' alt='flair logo' className='h-12 w-12' />
        <h3 className='font-semibold text-lg mt-3 text-gray-900'>
          VoiceGPT - Your voice AI assistant
        </h3>
      </section>

      <section className='grid grid-cols-2 w-full h-1/2'>
        <aside className='relative flex flex-col justify-center items-center h-full'>
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
            {isRecording ? (
              <RiSpeakFill className='block mx-auto absolute text-white w-6 h-6' />
            ) : (
              <FaAssistiveListeningSystems className='block mx-auto absolute text-white w-6 h-6' />
            )}
          </div>
          <article className='absolute top-1/2 left-1/2 -ml-10 text-center text-gray-900'>
            <h4 className='mt-20 font-semibold'>You</h4>
            {isRecording ? <p>Speaking...</p> : <p>Listening...</p>}
          </article>
        </aside>
        <aside className='relative flex flex-col justify-center items-center h-full'>
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
            <div
              className={
                "h-16 w-16 rounded-full bg-sky-600" +
                (!isRecording ? " animate-ping " : "")
              }
            ></div>
            {!isRecording ? (
              <RiSpeakFill className='block mx-auto absolute text-white w-6 h-6' />
            ) : (
              <FaAssistiveListeningSystems className='block mx-auto absolute text-white w-6 h-6' />
            )}
          </div>
          <article className='absolute top-1/2 left-1/2 -ml-10 text-center'>
            <h4 className='mt-20 font-semibold'>Flair AI</h4>
            {!isRecording ? <p>Speaking...</p> : <p>Listening...</p>}
          </article>
        </aside>
      </section>

      <section className='z-10 h-1/2 w-full grid grid-cols-5'>
        <div className='bg-white col-span-3 rounded-t-lg border-2 border-sky-300 shadow p-5 h-full overflow-y-scroll flex flex-col'>
          <h5 className='font-semibold text-lg mb-4 text-gray-900'>
            Transcription
          </h5>
          {transcripts.map((t) => (
            <div
              key={t.timestamp.toTimeString()}
              className={
                "rounded-b-lg text-gray-600 p-3 my-2 w-fit max-w-md relative" +
                (t.owner === "user"
                  ? " bg-teal-300 self-start text-left ml-3 rounded-tr-lg "
                  : " bg-sky-300 self-end text-right mr-3 rounded-tl-lg ")
              }
            >
              <div className=''>{t.text}</div>
              <time className='text-xs'>
                {t.timestamp.toLocaleTimeString()}
              </time>
              {/* <div className='absolute border-5 border-teal-300 top-0 -left-2'></div> */}
            </div>
          ))}
        </div>
        <div className='col-span-2 h-full flex flex-col space-y-5 pl-5'>
          <div className='bg-white grow rounded-lg border-2 border-sky-300 p-5 shadow'>
            <h5 className='font-semibold text-lg mb-4 text-gray-900'>
              Sentiment Analysis
            </h5>
          </div>
          <div className='bg-white grow rounded-t-lg border-2 border-sky-300 p-5 overflow-y-scroll shadow'>
            <h5 className='font-semibold text-lg mb-4 text-gray-900'>
              Detected Entitites
            </h5>
          </div>
        </div>
      </section>
    </main>
  );
}
