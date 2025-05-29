import type React from "react";
import { useEffect, useRef, useState } from "react";

import {
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Text,
  Textarea,
  useMantineTheme,
} from "metabase/ui";

import { MemoedMarkdown } from "./Markdown";
import { MemoedVoiceInputButton } from "./VoiceInputButton/VoiceInputButton";
import { useVoiceInput } from "./VoiceInputButton/useVoiceInput";
import { md } from "./mockMdWithHtml";

interface Message {
  sender: "user" | "ai";
  text: string;
  loading?: boolean;
}

export function ChatPage() {
  const theme = useMantineTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { listening, setListening } = useVoiceInput();

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }

    const userMessage: Message = { sender: "user", text: input };
    const loadingMessage: Message = {
      sender: "ai",
      text: "正在输入...",
      loading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    const userInput = input;
    setInput("");

    setTimeout(() => {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: "ai",
          // text: `你说的是：“${userInput}”`,
          text: `${md}`,
        };
        return updated;
      });
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      style={{
        width: "100%",
        paddingTop: theme.spacing.lg,
        height: `calc(100vh - 80px)`,
        fontFamily: theme.fontFamily,
      }}
    >
      <ScrollArea offsetScrollbars>
        <div
          ref={scrollRef}
          style={{ height: "calc(100vh - 200px)", overflow: "auto" }}
        >
          <div style={{ width: "100%", maxWidth: 576, margin: "0 auto" }}>
            {messages.map((msg, index) => (
              <Group
                key={index}
                position={msg.sender === "user" ? "right" : "left"}
                mb="xs"
                noWrap
              >
                <Paper
                  radius={theme.radius.md}
                  p="sm"
                  withBorder
                  shadow="xs"
                  // maw="75%"
                  bg={
                    msg.sender === "user"
                      ? theme.colors.brand?.[0] || "#dbeafe"
                      : theme.colors.gray?.[0] || "#f8fafc"
                  }
                  style={{
                    fontSize: theme.fontSizes.md,
                    // lineHeight: theme.lineHeight,
                  }}
                >
                  {msg.loading ? (
                    <Group spacing="xs">
                      <Loader size="xs" variant="dots" />
                      <Text size="sm" color="dimmed">
                        正在输入...
                      </Text>
                    </Group>
                  ) : msg.sender === "user" ? (
                    <Text color={theme.colors.white?.[9]} size="sm">
                      {msg.text}
                    </Text>
                  ) : (
                    <MemoedMarkdown msg={msg} />
                  )}
                </Paper>
              </Group>
            ))}
          </div>
        </div>
      </ScrollArea>
      <Paper
        withBorder
        radius="md"
        shadow="sm"
        style={{
          display: "flex",
          flexDirection: "column",
          borderColor: theme.colors.gray[4],
          width: "100%",
          maxWidth: 576,
          margin: "0 auto",
        }}
      >
        <Textarea
          placeholder="输入你的消息..."
          autosize
          minRows={2}
          maxRows={4}
          value={input}
          onChange={event => setInput(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          styles={{
            root: {
              flex: 1,
              // 移除 Textarea 自身的边框
              border: "none",
              "&:focus-within": {
                boxShadow: "none",
              },
            },
            input: {
              fontSize: theme.fontSizes.md,
              fontFamily: theme.fontFamily,
              border: "none",
              borderRadius: theme.radius.md,
            },
          }}
        />

        <Group
          position="right"
          p="xs"
          style={{
            borderTop: `1px solid ${theme.colors.gray[3]}`,
            backgroundColor: theme.colors.gray[0],
          }}
        >
          <MemoedVoiceInputButton
            listening={listening}
            setListening={setListening}
            onResult={setInput}
          />
          <Button
            disabled={!input.trim() || listening}
            onClick={handleSend}
            size="sm"
            style={{
              // 保持按钮高度与输入框对齐
              height: 32,
            }}
          >
            发送
          </Button>
        </Group>
      </Paper>
    </div>
  );
}
