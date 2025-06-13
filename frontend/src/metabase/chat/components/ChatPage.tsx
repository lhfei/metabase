import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { connect } from "metabase/lib/redux";
import { closeNavbar } from "metabase/redux/app";
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
import { MemoedWelcome } from "./Welcome";
import { md } from "./mockMdWithHtml";

interface Message {
  sender: "user" | "ai";
  text: string;
  loading?: boolean;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

interface IProps {
  closeNavbar: () => void;
}

function Chat(props: IProps) {
  const { closeNavbar } = props;
  const theme = useMantineTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(uuidv4());

  // 用于记录当前鼠标悬停的 session id
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { listening, setListening } = useVoiceInput();

  // 发送消息
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
          text: md,
        };
        return updated;
      });
    }, 1200);
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 新对话：保存当前对话到历史并清空
  const startNewChat = () => {
    if (messages.length > 0) {
      const firstUser = messages.find(m => m.sender === "user");
      const title =
        firstUser?.text.slice(0, 20) || `会话 ${sessions.length + 1}`;
      setSessions(prev => [
        ...prev,
        { id: currentSessionId, title, messages: [...messages] },
      ]);
    }
    const newId = uuidv4();
    setCurrentSessionId(newId);
    setMessages([]);
  };

  // 删除某条历史会话
  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    // 如果删除的是当前会话，自动新建一个
    if (id === currentSessionId) {
      const newId = uuidv4();
      setCurrentSessionId(newId);
      setMessages([]);
    }
  };

  // 加载历史会话
  const loadSession = (session: Session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  // 滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    closeNavbar();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        display: "flex",
        height: "calc(100vh - 80px)",
        fontFamily: theme.fontFamily,
      }}
    >
      {/* 左侧：历史会话列表 */}
      <div
        style={{
          width: 240,
          borderRight: `1px solid ${theme.colors.gray[3]}`,
          padding: theme.spacing.md,
          boxSizing: "border-box",
        }}
      >
        <Button fullWidth variant="outline" onClick={startNewChat} mb="md">
          新对话
        </Button>
        <ScrollArea style={{ height: "calc(100vh - 160px)" }}>
          {sessions.map(session => (
            <div
              key={session.id}
              style={{
                position: "relative",
              }}
              onMouseEnter={() => setHoveredSessionId(session.id)}
              onMouseLeave={() => setHoveredSessionId(null)}
            >
              <Paper
                withBorder
                p="xs"
                mb="sm"
                style={{
                  cursor: "pointer",
                  paddingRight: 40,
                  backgroundColor:
                    session.id === currentSessionId
                      ? theme.colors.gray[2]
                      : theme.white,
                }}
                onClick={() => loadSession(session)}
              >
                <Text size="sm" lineClamp={2}>
                  {session.title}
                </Text>
              </Paper>
              {hoveredSessionId === session.id && (
                <Button
                  size="xs"
                  variant="subtle"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    padding: 2,
                  }}
                  onClick={() => deleteSession(session.id)}
                >
                  删除
                </Button>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 右侧：聊天区 */}
      <div style={{ flex: 1, paddingTop: theme.spacing.lg }}>
        <ScrollArea offsetScrollbars>
          <div
            ref={scrollRef}
            style={{ height: "calc(100vh - 200px)", overflow: "auto" }}
          >
            <div style={{ width: "100%", maxWidth: 576, margin: "0 auto" }}>
              {messages.length === 0 ? (
                <MemoedWelcome />
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{
                      opacity: 0,
                      x: msg.sender === "user" ? 50 : -50,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: idx * 0.05,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    <Group
                      position={msg.sender === "user" ? "right" : "left"}
                      mb="xs"
                      noWrap
                    >
                      <Paper
                        radius={theme.radius.md}
                        p="sm"
                        withBorder
                        shadow="xs"
                        bg={
                          msg.sender === "user"
                            ? theme.colors.brand?.[0] || "#dbeafe"
                            : theme.colors.gray?.[0] || "#f8fafc"
                        }
                        style={{ fontSize: theme.fontSizes.md }}
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
                  </motion.div>
                ))
              )}
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
            onChange={e => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            styles={{
              root: {
                flex: 1,
                border: "none",
                "&:focus-within": { boxShadow: "none" },
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
              style={{ height: 32 }}
            >
              发送
            </Button>
          </Group>
        </Paper>
      </div>
    </motion.div>
  );
}

const mapDispatchToProps = {
  closeNavbar,
};

export const ChatPage = connect(null, mapDispatchToProps)(Chat);
