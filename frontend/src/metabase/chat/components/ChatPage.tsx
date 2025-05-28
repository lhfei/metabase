import styled from "@emotion/styled";
import { useViewportSize } from "@mantine/hooks";
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

const Container = styled.div`
  width: 100%;
  max-width: 576px;
  padding: var(--mantine-spacing-md) 0;
  height: calc(100vh - 56px);
`;

interface Message {
  sender: "user" | "ai";
  text: string;
  loading?: boolean;
}

export function ChatPage() {
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

    // 模拟 AI 响应
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

  return (
    <Container>
      <ScrollArea h="calc(100vh - 176px)" offsetScrollbars>
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
                maw="75%"
                bg={msg.sender === "user" ? "#dbeafe" : "#f8fafc"}
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
      />

      <Group position="right" mt="xs">
        <Button onClick={handleSend}>发送</Button>
      </Group>
    </Container>
  );
}
