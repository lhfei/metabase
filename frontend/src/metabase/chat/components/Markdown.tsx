import markdownit from "markdown-it";
import { type FC, type PropsWithChildren, memo } from "react";

const md = markdownit({ html: true, breaks: true });

interface IProps {
  msg: {
    sender: string;
    text: string;
  };
}

const Markdown: FC<PropsWithChildren<IProps>> = props => {
  const { msg } = props;

  return <div dangerouslySetInnerHTML={{ __html: md.render(msg.text) }} />;
};

export const MemoedMarkdown = memo(Markdown);
