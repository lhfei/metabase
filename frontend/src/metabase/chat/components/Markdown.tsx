import { type FC, type PropsWithChildren, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Paper, Text, useMantineTheme } from "metabase/ui";
interface IProps {
  msg: {
    sender: string;
    text: string;
  };
}

const Markdown: FC<PropsWithChildren<IProps>> = props => {
  const { msg } = props;
  const theme = useMantineTheme();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <Text
            color={msg.sender === "user" ? theme.colors?.white[0] : undefined}
            size="sm"
            mb="xs"
          >
            {children}
          </Text>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code
              style={{
                backgroundColor: theme.colors.gray[1],
                padding: "2px 4px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: theme.fontSizes.sm,
              }}
            >
              {children}
            </code>
          ) : (
            <Paper
              withBorder
              radius="md"
              p="sm"
              mt="xs"
              style={{
                backgroundColor: theme.colors.gray[1],
                overflowX: "auto",
                fontFamily: "monospace",
                fontSize: theme.fontSizes.sm,
                lineHeight: 1.5,
              }}
            >
              <pre style={{ margin: 0 }}>
                <code>{children}</code>
              </pre>
            </Paper>
          ),
        strong: ({ children }) => (
          <Text span fw={600}>
            {children}
          </Text>
        ),
        ul: ({ children }) => (
          <ul style={{ paddingLeft: "1.2em", margin: 0 }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ paddingLeft: "1.2em", margin: 0 }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li>
            <Text size="sm" component="span">
              {children}
            </Text>
          </li>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.colors.blue[6],
              textDecoration: "underline",
            }}
          >
            {children}
          </a>
        ),
      }}
    >
      {msg.text}
    </ReactMarkdown>
  );
};

export const MemoedMarkdown = memo(Markdown);
