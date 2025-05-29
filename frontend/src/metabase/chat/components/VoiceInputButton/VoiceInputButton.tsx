import { memo, useEffect, useRef, useState } from "react";

import { Button } from "metabase/ui";

import styles from "./VoiceInputButton.modules.css";

const VoiceInputButton = ({
  onResult,
  listening,
  setListening,
}: {
  onResult: (text: string) => void;
  listening: boolean;
  setListening: (listening: boolean) => void;
}) => {
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<
    (typeof window extends { SpeechRecognition: infer T } ? T : any) | null
  >(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("当前浏览器不支持语音识别 Web Speech API");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = true; // 实时识别
    recognition.continuous = true; // 连续识别
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
        onResult(interimTranscript); // 实时显示
      }

      if (finalTranscript) {
        setInterimText("");
        onResult(finalTranscript); // 最终文本写入
      }
    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error);
      stopListening();
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.stop();
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Button onClick={toggleListening} size="sm" style={{ height: 32 }}>
      {listening ? (
        <>
          🎙️ 监听中
          <span className={styles.dotFlash} style={{ marginLeft: 4 }}>
            ●
          </span>
        </>
      ) : (
        "🎤 语音输入"
      )}
    </Button>
  );
};

export const MemoedVoiceInputButton = memo(VoiceInputButton);
