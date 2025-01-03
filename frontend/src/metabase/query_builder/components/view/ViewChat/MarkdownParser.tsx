import React, { type FC, type PropsWithChildren, memo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { visit } from "unist-util-visit";

import Visualization from "metabase/visualizations/components/Visualization";

import { QueryVisualizationRoot } from "../ViewChat.styled";

interface IProps {
  chatList: any[];
  index: number;
  queryBuilderMode: any;
  question: any;
  timelineEvents: any;
  selectedTimelineEventIds: any;
  handleVisualizationClick: any;
  onOpenTimelines: any;
  selectTimelineEvents: any;
  deselectTimelineEvents: any;
  onOpenChartSettings: any;
  onUpdateWarnings: any;
  onUpdateVisualizationSettings: any;
  vizSpecificProps: any;
  chat: any;
  className?: string;
}

const MarkdownParser: FC<PropsWithChildren<IProps>> = props => {
  const { chatList, index, queryBuilderMode } = props;

  const dataRef = useRef<any>(null);
  const contentRef = useRef<string | null>(null);

  const getTextContent = (node: any) => {
    if (node.type === "text") {
      return node.value;
    } // 直接返回文本节点的值
    if (node.children) {
      return node.children.map((child: any) => getTextContent(child)).join(""); // 递归提取子节点内容
    }
    return ""; // 非文本节点忽略
  };

  const captureH2Content = () => {
    return () => (tree: any) => {
      visit(tree, "heading", (node: any) => {
        if (node.depth === 2) {
          // 识别 h2 标签
          const h2Text = getTextContent(node);

          // 将捕获的 h2 内容添加到节点的自定义属性中
          node.data = node.data || {};
          node.data.hProperties = node.data.hProperties || {};
          node.data.hProperties.originalContent = h2Text;
        }
      });
    };
  };

  const getRawSeries = (question: any, result: any) => {
    const { card } = question; // 自定义，非框架中的Question类型
    return [{ card, data: result }];
  };

  const getRawSeries2 = (node: any) => {
    if (contentRef.current !== node.originalContent) {
      let rawSeries: any[] = [];
      try {
        const data = JSON.parse(node.originalContent);
        const question = chatList[index - 1];
        rawSeries = getRawSeries(question, data.data);
      } catch (error) {
        rawSeries = [];
      }
      contentRef.current = node.originalContent;
      dataRef.current = rawSeries;

      return rawSeries;
    }

    return dataRef.current;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[captureH2Content()]}
      components={{
        // 自定义Markdown标签对应的React组件
        h1: mdProps => {
          return <h1 style={{ marginBottom: 0 }}>{mdProps.children}</h1>;
        },
        h2: (node: any, ...mdProps) => {
          const rawSeries = getRawSeries2(node);
          return (
            <QueryVisualizationRoot>
              {/* <QueryVisualization
                            // {...this.props}
                            {...restProps}
                            rawSeries={data}
                            noHeader
                            className={CS.spread}
                            mode={queryMode}
                          /> */}

              {
                <Visualization
                  className={props.className}
                  rawSeries={rawSeries}
                  // onChangeCardAndRun={
                  //   hasDrills ? navigateToNewCardInsideQB : undefined
                  // }
                  isEditing={true}
                  isObjectDetail={false}
                  isQueryBuilder={true}
                  queryBuilderMode={queryBuilderMode}
                  showTitle={false}
                  metadata={props.question.metadata()}
                  timelineEvents={props.timelineEvents}
                  selectedTimelineEventIds={props.selectedTimelineEventIds}
                  handleVisualizationClick={props.handleVisualizationClick}
                  onOpenTimelines={props.onOpenTimelines}
                  onSelectTimelineEvents={props.selectTimelineEvents}
                  onDeselectTimelineEvents={props.deselectTimelineEvents}
                  onOpenChartSettings={props.onOpenChartSettings}
                  onUpdateWarnings={props.onUpdateWarnings}
                  onUpdateVisualizationSettings={
                    props.onUpdateVisualizationSettings
                  }
                  {...props.vizSpecificProps}
                />
              }
            </QueryVisualizationRoot>
          );
        },
        // 其他自定义组件
      }}
    >
      {props.chat.markdown}
    </ReactMarkdown>
  );
};

export const MemoedMarkdownParser = memo(MarkdownParser);
