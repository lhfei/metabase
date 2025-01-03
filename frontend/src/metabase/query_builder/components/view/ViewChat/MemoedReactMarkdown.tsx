import React, { memo, FC, PropsWithChildren } from "react";
import ReactMarkdown from "react-markdown";

interface IProps {
  remarkPlugins?: any[];
  components?: Record<string, any>;
}

const MemoedReactMarkdown: FC<PropsWithChildren<IProps>> = props => {
  return (
    <ReactMarkdown
      remarkPlugins={props.remarkPlugins}
      components={props.components}
    >
      {props.children as string}
    </ReactMarkdown>
  );
};

// eslint-disable-next-line import/no-default-export
export default memo(MemoedReactMarkdown);
