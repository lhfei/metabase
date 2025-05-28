import { useViewportSize } from "@mantine/hooks";
import axios from "axios";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import {
  Button,
  // Container,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Text,
  Textarea,
} from "metabase/ui";

interface Message {
  sender: "user" | "ai";
  text: string;
  loading?: boolean;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const viewport = useViewportSize();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isSending) {
      return;
    }

    const userMessage: Message = { sender: "user", text: input };
    const loadingMessage: Message = {
      sender: "ai",
      text: "正在输入...",
      loading: true,
    };

    const updatedMessages = [...messages, userMessage, loadingMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo", // 也可以替换为 'gpt-4'
          messages: [
            ...updatedMessages
              .filter(m => !m.loading)
              .map(m => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text,
              })),
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
        },
      );

      const aiText = res.data.choices[0].message.content.trim();

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: "ai",
          text: aiText,
        };
        return updated;
      });
    } catch (error) {
      console.error("请求出错:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: "ai",
          text: "出错了，请稍后再试。",
        };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
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
        maxWidth: "576px", // sm 尺寸在 Mantine 中默认为 576px
        padding: "var(--mantine-spacing-md) 0", // py="md" 对应上下 padding
        height: viewport.height,
      }}
    >
      <ScrollArea style={{ height: "calc(100vh - 150px)" }} offsetScrollbars>
        <div ref={scrollRef}>
          {messages.map((msg, index) => (
            <Group
              key={index}
              position={msg.sender === "user" ? "right" : "left"}
              mb="xs"
              noWrap
            >
              <Paper
                radius="md"
                p="sm"
                withBorder
                shadow="xs"
                style={{
                  maxWidth: "75%",
                  backgroundColor:
                    msg.sender === "user" ? "#dbeafe" : "#f8fafc",
                }}
              >
                {msg.loading ? (
                  <Group spacing="xs">
                    <Loader size="xs" variant="dots" />
                    <Text size="sm" color="dimmed">
                      正在输入...
                    </Text>
                  </Group>
                ) : (
                  <Text size="sm">{msg.text}</Text>
                )}
              </Paper>
            </Group>
          ))}
        </div>
      </ScrollArea>

      <Textarea
        placeholder="输入你的消息..."
        autosize
        minRows={2}
        maxRows={4}
        value={input}
        onChange={event => setInput(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        mt="md"
        disabled={isSending}
      />

      <Group position="right" mt="xs">
        <Button onClick={handleSend} disabled={isSending}>
          发送
        </Button>
      </Group>
    </div>
  );
}
