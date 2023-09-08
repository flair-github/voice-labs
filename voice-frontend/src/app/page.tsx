/* eslint-disable @next/next/no-img-element */
"use client";

// import styles from "./page.module.css";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { FaAssistiveListeningSystems } from "react-icons/fa";
import { RiSpeakFill } from "react-icons/ri";
import {
  FaRegFaceMeh,
  FaRegFaceSmile,
  FaRegFaceSmileBeam,
} from "react-icons/fa6";
import { Chip, Progress } from "@nextui-org/react";

function highlightSubstrings(
  inputString: string,
  substrings: string[]
): string {
  let replacedString = inputString;

  substrings.forEach((substring) => {
    // Use a regular expression with a capturing group to find and replace the substring
    const regex = new RegExp(`(${substring})`, "gi");
    replacedString = replacedString.replace(regex, "<mark>$1</mark>");
  });

  return replacedString;
}

function doesConversationTextIncludeSubstring(
  conversation: { owner: "user" | "ai"; text: string; timestamp: Date }[],
  substring: string
): boolean {
  const conversationText = conversation
    .map((message) => message.text)
    .join(" ");

  // Create a regular expression with 'gi' flags for global and case-insensitive search
  const regex = new RegExp(substring, "gi");

  // Use the regex to test if the substring exists in the conversation text
  return regex.test(conversationText);
}

const dummyConversation: {
  owner: "user" | "ai";
  text: string;
  timestamp: Date;
}[] = []; /* [
  {
    owner: "user",
    text: "Hello, I'm interested in buying a property in the Oakwood neighborhood. Can you provide information about property prices in that area?",
    timestamp: new Date(new Date().getTime() + 0 * 2000),
  },
  {
    owner: "ai",
    text: "Of course! I'd be happy to help you with that. Oakwood is a desirable neighborhood with a range of property options. Do you have a specific type of property in mind, such as a house or an apartment?",
    timestamp: new Date(new Date().getTime() + 1 * 2000),
  },
  {
    owner: "user",
    text: "I'm looking for a house. Preferably a 3-bedroom house. What's the average price for a 3-bedroom house in Oakwood?",
    timestamp: new Date(new Date().getTime() + 2 * 2000),
  },
  {
    owner: "ai",
    text: "Great choice! 3-bedroom houses in Oakwood typically range from $300,000 to $500,000, depending on the specific location and amenities. Would you like more details on available listings or any other information?",
    timestamp: new Date(new Date().getTime() + 3 * 2000),
  },
  {
    owner: "user",
    text: "Could you provide me with a list of available 3-bedroom houses in Oakwood with prices and locations?",
    timestamp: new Date(new Date().getTime() + 4 * 2000),
  },
  {
    owner: "ai",
    text: "Certainly! I will gather the latest listings for you. Please give me a moment to fetch the information.",
    timestamp: new Date(new Date().getTime() + 5 * 2000),
  },
  {
    owner: "ai",
    text: "Here are some of the 3-bedroom houses available in Oakwood:\n\n1. 123 Oakwood Drive - $350,000\n2. 456 Maple Lane - $480,000\n3. 789 Pine Street - $410,000",
    timestamp: new Date(new Date().getTime() + 6 * 2000),
  },
  {
    owner: "user",
    text: "Thank you for the information. Can you tell me more about the amenities in the Oakwood neighborhood and the nearby schools?",
    timestamp: new Date(new Date().getTime() + 7 * 2000),
  },
  {
    owner: "ai",
    text: "Certainly! Oakwood is known for its family-friendly environment and proximity to schools and parks. The neighborhood offers excellent schools, including Oakwood Elementary and Oakwood High School. Additionally, there are several parks, shopping centers, and restaurants nearby, making it a convenient and pleasant place to live.",
    timestamp: new Date(new Date().getTime() + 8 * 2000),
  },
  {
    owner: "user",
    text: "That sounds great! I'll consider Oakwood for my future home. Thank you for your assistance.",
    timestamp: new Date(new Date().getTime() + 9 * 2000),
  },
  {
    owner: "ai",
    text: "You're very welcome! If you have any more questions or need further assistance in the future, feel free to reach out. Best of luck with your property search!",
    timestamp: new Date(new Date().getTime() + 10 * 2000),
  },
] */

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
  const sentiment = useMemo(() => {
    let value = 50;
    const responseLength = transcripts.filter((t) => t.owner === "ai").length;
    value = value + responseLength * 10;
    if (value > 100) value = 100;
    return value;
  }, [transcripts]);

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
              <p
                dangerouslySetInnerHTML={{
                  __html: highlightSubstrings(t.text, entities),
                }}
              ></p>
              <time className='text-xs'>
                {t.timestamp.toLocaleTimeString()}
              </time>
              {/* <div className='absolute border-5 border-teal-300 top-0 -left-2'></div> */}
            </div>
          ))}
        </div>
        <div className='col-span-2 h-full flex flex-col space-y-5 pl-5'>
          <div className='bg-white rounded-lg border-2 border-sky-300 p-5 shadow'>
            <h5 className='font-semibold text-lg mb-4 text-gray-900'>
              Sentiment Analysis
            </h5>
            <Progress
              isStriped
              color='primary'
              valueLabel={sentiment <= 50 ? "Neutral" : "Positive"}
              label={
                sentiment < 60 ? (
                  <FaRegFaceMeh className='h-6 w-6' />
                ) : sentiment < 81 ? (
                  <FaRegFaceSmile className='h-6 w-6' />
                ) : (
                  <FaRegFaceSmileBeam className='h-6 w-6' />
                )
              }
              value={sentiment}
              className=''
              showValueLabel={true}
            />
          </div>
          <div className='bg-white grow rounded-t-lg border-2 border-sky-300 p-5 overflow-y-scroll shadow'>
            <h5 className='font-semibold text-lg mb-4 text-gray-900'>
              Detected Entitites
            </h5>
            <div className='flex flex-wrap gap-3'>
              {entities
                .filter((entity) =>
                  doesConversationTextIncludeSubstring(transcripts, entity)
                )
                .map((text, idx) => (
                  <Chip key={idx} color='primary' size='lg'>
                    {text}
                  </Chip>
                ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
