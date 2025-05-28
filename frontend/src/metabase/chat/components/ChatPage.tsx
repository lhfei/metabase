import styled from "@emotion/styled";
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

// 移除 Container，直接用 Box 或 div 并用 theme 变量
// const Container = styled.div` ... `;

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
          text: `你说的是：“${userInput}”`,
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

  console.log("colors", theme.colors);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 576,
        margin: "0 auto",
        paddingTop: theme.spacing.lg,
        height: `calc(100vh - 80px)`,
        fontFamily: theme.fontFamily,
      }}
    >
      <ScrollArea h="calc(100vh - 200px)" offsetScrollbars>
        <div ref={scrollRef}>
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
                maw="75%"
                bg={
                  msg.sender === "user"
                    ? theme.colors.brand?.[0] || "#dbeafe"
                    : theme.colors.gray?.[0] || "#f8fafc"
                }
                style={{
                  fontSize: theme.fontSizes.md,
                  lineHeight: theme.lineHeight,
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
                  <Text
                    style={{
                      color:
                        msg.sender === "user"
                          ? theme.colors.white?.[0]
                          : "unset",
                    }}
                    size="sm"
                  >
                    {msg.text}
                  </Text>
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
        styles={{
          input: {
            fontSize: theme.fontSizes.md,
            fontFamily: theme.fontFamily,
          },
        }}
      />

      <Group position="right" mt="xs">
        <Button onClick={handleSend}>发送</Button>
      </Group>
    </div>
  );
}
