/**
 * created by liushuai
 */
/* eslint-disable react/prop-types */
import { useMarkdownToJSX } from "markdown-to-jsx";
import { Component, createRef, memo } from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { position } from "tether";
import { t } from "ttag";
import _ from "underscore";
import { visit } from "unist-util-visit";

import { deletePermanently } from "metabase/archive/actions";
import { ArchivedEntityBanner } from "metabase/archive/components/ArchivedEntityBanner";
import ExplicitSize from "metabase/components/ExplicitSize";
import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import LogoIcon from "metabase/components/LogoIcon";
import Toaster from "metabase/components/Toaster";
import CS from "metabase/css/core/index.css";
import QueryBuilderS from "metabase/css/query_builder.module.css";
import Bookmarks from "metabase/entities/bookmarks";
import Questions from "metabase/entities/questions";
import { uuid } from "metabase/lib/uuid";
import {
  rememberLastUsedDatabase,
  setArchivedQuestion,
} from "metabase/query_builder/actions";
import { SIDEBAR_SIZES } from "metabase/query_builder/constants";
import { TimeseriesChrome } from "metabase/querying/filters/components/TimeseriesChrome";
import { Transition } from "metabase/ui";
import Visualization from "metabase/visualizations/components/Visualization";
import * as Lib from "metabase-lib";
import { HARD_ROW_LIMIT } from "metabase-lib/v1/queries/utils";

import DatasetEditor from "../../DatasetEditor";
import NativeQueryEditorChat from "../../NativeQueryEditorChat";
import { QueryModals } from "../../QueryModals";
import QueryVisualization from "../../QueryVisualization";
import { SavedQuestionIntroModal } from "../../SavedQuestionIntroModal";
import VisualizationResult from "../../VisualizationResult";
import DataReference from "../../dataref/DataReference";
import { SnippetSidebar } from "../../template_tags/SnippetSidebar";
import { TagEditorSidebar } from "../../template_tags/TagEditorSidebar";
import NewQuestionHeader from "../NewQuestionHeader";
import { QuestionItem } from "../QuestionItem";
import { NotebookContainer } from "../View/NotebookContainer";
import {
  BorderedViewTitleHeader,
  NativeQueryEditorContainer,
  QueryBuilderContentContainer,
  QueryBuilderMain,
  QueryBuilderViewHeaderContainer,
  QueryBuilderViewRoot,
  StyledDebouncedFrame,
  StyledSyncedParametersList,
} from "../View.styled";
import { QueryVisualizationRoot } from "../ViewChat.styled";
import { ViewFooter } from "../ViewFooter";
import ViewSidebar from "../ViewSidebar";
import ChartSettingsSidebar from "../sidebars/ChartSettingsSidebar";
import ChartTypeSidebar from "../sidebars/ChartTypeSidebar";
import { QuestionInfoSidebar } from "../sidebars/QuestionInfoSidebar";
import { SummarizeSidebar } from "../sidebars/SummarizeSidebar";
import TimelineSidebar from "../sidebars/TimelineSidebar";
import { testData } from "../testmd";

import { MemoedMarkdownParser } from "./MarkdownParser";

const ALLOWED_VISUALIZATION_PROPS = [
  // Table
  "isShowingDetailsOnlyColumns",
  // Table Interactive
  "hasMetadataPopovers",
  "tableHeaderHeight",
  "scrollToColumn",
  "renderTableHeaderWrapper",
  "mode",
];

const fadeIn = {
  in: { opacity: 1 },
  out: { opacity: 0 },
  transitionProperty: "opacity",
};

class View extends Component {
  queryBuilderMainRef = createRef();

  getLeftSidebar = () => {
    const {
      isShowingChartSettingsSidebar,
      isShowingChartTypeSidebar,
      onCloseChartSettings,
      onCloseChartType,
    } = this.props;

    if (isShowingChartSettingsSidebar) {
      const {
        question,
        result,
        addField,
        initialChartSetting,
        onReplaceAllVisualizationSettings,
        onOpenChartType,
        visualizationSettings,
        showSidebarTitle,
      } = this.props;
      return (
        <ChartSettingsSidebar
          question={question}
          result={result}
          addField={addField}
          initialChartSetting={initialChartSetting}
          onReplaceAllVisualizationSettings={onReplaceAllVisualizationSettings}
          onOpenChartType={onOpenChartType}
          visualizationSettings={visualizationSettings}
          showSidebarTitle={showSidebarTitle}
          onClose={onCloseChartSettings}
        />
      );
    }

    if (isShowingChartTypeSidebar) {
      return <ChartTypeSidebar {...this.props} onClose={onCloseChartType} />;
    }

    return null;
  };

  getRightSidebarForStructuredQuery = () => {
    const {
      question,
      timelines,
      isShowingSummarySidebar,
      isShowingTimelineSidebar,
      isShowingQuestionInfoSidebar,
      updateQuestion,
      visibleTimelineEventIds,
      selectedTimelineEventIds,
      xDomain,
      showTimelineEvents,
      hideTimelineEvents,
      selectTimelineEvents,
      deselectTimelineEvents,
      onOpenModal,
      onCloseSummary,
      onCloseTimelines,
      onSave,
    } = this.props;

    const isSaved = question.isSaved();

    if (isShowingSummarySidebar) {
      const query = question.query();
      return (
        <SummarizeSidebar
          query={query}
          onQueryChange={nextQuery => {
            const datesetQuery = Lib.toLegacyQuery(nextQuery);
            const nextQuestion = question.setDatasetQuery(datesetQuery);
            updateQuestion(nextQuestion.setDefaultDisplay(), { run: true });
          }}
          onClose={onCloseSummary}
        />
      );
    }

    if (isShowingTimelineSidebar) {
      return (
        <TimelineSidebar
          question={question}
          timelines={timelines}
          visibleTimelineEventIds={visibleTimelineEventIds}
          selectedTimelineEventIds={selectedTimelineEventIds}
          xDomain={xDomain}
          onShowTimelineEvents={showTimelineEvents}
          onHideTimelineEvents={hideTimelineEvents}
          onSelectTimelineEvents={selectTimelineEvents}
          onDeselectTimelineEvents={deselectTimelineEvents}
          onOpenModal={onOpenModal}
          onClose={onCloseTimelines}
        />
      );
    }

    if (isSaved && isShowingQuestionInfoSidebar) {
      return <QuestionInfoSidebar question={question} onSave={onSave} />;
    }

    return null;
  };

  getRightSidebarForNativeQuery = () => {
    const {
      isShowingTemplateTagsEditor,
      isShowingDataReference,
      isShowingSnippetSidebar,
      isShowingTimelineSidebar,
      isShowingQuestionInfoSidebar,
      toggleTemplateTagsEditor,
      toggleDataReference,
      toggleSnippetSidebar,
      showTimelineEvent,
      showTimelineEvents,
      hideTimelineEvents,
      selectTimelineEvents,
      deselectTimelineEvents,
      onCloseTimelines,
      onSave,
      question,
    } = this.props;

    if (isShowingTemplateTagsEditor) {
      return (
        <TagEditorSidebar
          {...this.props}
          query={question.legacyQuery()}
          onClose={toggleTemplateTagsEditor}
        />
      );
    }

    if (isShowingDataReference) {
      return <DataReference {...this.props} onClose={toggleDataReference} />;
    }

    if (isShowingSnippetSidebar) {
      return <SnippetSidebar {...this.props} onClose={toggleSnippetSidebar} />;
    }

    if (isShowingTimelineSidebar) {
      return (
        <TimelineSidebar
          {...this.props}
          onShowTimelineEvent={showTimelineEvent}
          onShowTimelineEvents={showTimelineEvents}
          onHideTimelineEvents={hideTimelineEvents}
          onSelectTimelineEvents={selectTimelineEvents}
          onDeselectTimelineEvents={deselectTimelineEvents}
          onClose={onCloseTimelines}
        />
      );
    }

    if (isShowingQuestionInfoSidebar) {
      return <QuestionInfoSidebar question={question} onSave={onSave} />;
    }

    return null;
  };

  getRightSidebar = () => {
    const { question } = this.props;
    const { isNative } = Lib.queryDisplayInfo(question.query());

    return !isNative
      ? this.getRightSidebarForStructuredQuery()
      : this.getRightSidebarForNativeQuery();
  };

  renderHeader = () => {
    const { question, onUnarchive, onMove, onDeletePermanently } = this.props;
    const query = question.query();
    const card = question.card();
    const { isNative } = Lib.queryDisplayInfo(query);

    const isNewQuestion = !isNative && Lib.sourceTableOrCardId(query) === null;

    return (
      <QueryBuilderViewHeaderContainer>
        {card.archived && (
          <ArchivedEntityBanner
            name={card.name}
            entityType={card.type}
            canWrite={card.can_write}
            canRestore={card.can_restore}
            canDelete={card.can_delete}
            onUnarchive={() => onUnarchive(question)}
            onMove={collection => onMove(question, collection)}
            onDeletePermanently={() => onDeletePermanently(card.id)}
          />
        )}

        <BorderedViewTitleHeader
          {...this.props}
          style={{
            transition: "opacity 300ms linear",
            opacity: isNewQuestion ? 0 : 1,
          }}
        />
        {/*This is used so that the New Question Header is unmounted after the animation*/}
        <Transition mounted={isNewQuestion} transition={fadeIn} duration={300}>
          {style => <NewQuestionHeader className={CS.spread} style={style} />}
        </Transition>
      </QueryBuilderViewHeaderContainer>
    );
  };

  renderNativeQueryEditor = () => {
    const {
      question,
      card,
      height,
      isDirty,
      isNativeEditorOpen,
      setParameterValueToDefault,
      onSetDatabaseId,
    } = this.props;

    const legacyQuery = question.legacyQuery();

    // Normally, when users open native models,
    // they open an ad-hoc GUI question using the model as a data source
    // (using the `/dataset` endpoint instead of the `/card/:id/query`)
    // However, users without data permission open a real model as they can't use the `/dataset` endpoint
    // So the model is opened as an underlying native question and the query editor becomes visible
    // This check makes it hide the editor in this particular case
    // More details: https://github.com/metabase/metabase/pull/20161
    const { isEditable } = Lib.queryDisplayInfo(question.query());
    if (question.type() === "model" && !isEditable) {
      return null;
    }

    return (
      <NativeQueryEditorContainer>
        <NativeQueryEditorChat
          {...this.props}
          runQuestionQuery={this.props.runQuestionQueryChat}
          query={legacyQuery}
          viewHeight={height}
          isOpen={legacyQuery.isEmpty() || isDirty}
          isInitiallyOpen={isNativeEditorOpen}
          datasetQuery={card && card.dataset_query}
          setParameterValueToDefault={setParameterValueToDefault}
          onSetDatabaseId={onSetDatabaseId}
          // hasEditingSidebar={false}
          // resizable={false}
        />
      </NativeQueryEditorContainer>
    );
  };

  captureH2Content = () => {
    return () => tree => {
      visit(tree, "heading", node => {
        if (node.depth === 2) {
          // 识别 h2 标签
          const h2Text = this.getTextContent(node);

          // 将捕获的 h2 内容添加到节点的自定义属性中
          node.data = node.data || {};
          node.data.hProperties = node.data.hProperties || {};
          node.data.hProperties.originalContent = h2Text;
        }
      });
    };
  };

  getTextContent = node => {
    if (node.type === "text") {
      return node.value;
    } // 直接返回文本节点的值
    if (node.children) {
      return node.children.map(child => this.getTextContent(child)).join(""); // 递归提取子节点内容
    }
    return ""; // 非文本节点忽略
  };

  scrollToBottom = () => {
    if (this.queryBuilderMainRef.current) {
      this.queryBuilderMainRef.current.scrollTop =
        this.queryBuilderMainRef.current.scrollHeight;
    }
  };

  renderMain = ({ leftSidebar, rightSidebar }) => {
    const {
      question,
      mode,
      parameters,
      isLiveResizable,
      setParameterValue,
      queryBuilderMode,
    } = this.props;

    if (queryBuilderMode === "notebook") {
      // we need to render main only in view mode
      return;
    }

    const queryMode = mode && mode.queryMode();
    const { isNative } = Lib.queryDisplayInfo(question.query());
    const isSidebarOpen = leftSidebar || rightSidebar;

    const {
      rawSeries,
      chatList,
      maxTableRows = HARD_ROW_LIMIT,
      ...restProps
    } = this.props;

    const vizSpecificProps = _.pick(this.props, ...ALLOWED_VISUALIZATION_PROPS);

    return (
      <QueryBuilderMain
        isSidebarOpen={isSidebarOpen}
        data-testid="query-builder-main"
        style={{ background: `rgb(246, 247, 251)` }}
      >
        <StyledDebouncedFrame
          ref={this.queryBuilderMainRef}
          enabled={!isLiveResizable}
        >
          {chatList.map((chat, index) => {
            if (chat.type === "user") {
              return (
                <QuestionItem
                  key={chat.id}
                  question={chat.question}
                  style={{ marginBottom: 16, marginTop: 16 }}
                ></QuestionItem>
              );
            } else {
              // type = gpt
              return (
                <div style={{ display: "flex" }} key={chat.id}>
                  <LogoIcon height={32} width={32} />
                  <div
                    style={{
                      background: "white",
                      padding: 16,
                      flex: 1,
                      marginLeft: 8,
                    }}
                  >
                    <MemoedMarkdownParser
                      chat={chat}
                      chatList={chatList}
                      index={index}
                      queryBuilderMode={this.props.queryBuilderMode}
                      question={this.props.question}
                      timelineEvents={this.props.timelineEvents}
                      selectedTimelineEventIds={
                        this.props.selectedTimelineEventIds
                      }
                      handleVisualizationClick={
                        this.props.handleVisualizationClick
                      }
                      onOpenTimelines={this.props.onOpenTimelines}
                      selectTimelineEvents={this.props.selectTimelineEvents}
                      deselectTimelineEvents={this.props.deselectTimelineEvents}
                      onOpenChartSettings={this.props.onOpenChartSettings}
                      onUpdateWarnings={this.props.onUpdateWarnings}
                      onUpdateVisualizationSettings={
                        this.props.onUpdateVisualizationSettings
                      }
                      vizSpecificProps={vizSpecificProps}
                      className={this.props.className}
                    ></MemoedMarkdownParser>
                  </div>
                </div>
              );
            }
          })}

          {/* <QueryVisualizationRoot>
            <QueryVisualization
              {...this.props}
              noHeader
              className={CS.spread}
              mode={queryMode}
            />
          </QueryVisualizationRoot> */}
        </StyledDebouncedFrame>
        {/* <ViewFooter className={CS.flexNoShrink} /> */}

        {isNative ? (
          this.renderNativeQueryEditor()
        ) : (
          <StyledSyncedParametersList
            parameters={parameters}
            setParameterValue={setParameterValue}
            commitImmediately
          />
        )}

        <TimeseriesChrome
          question={this.props.question}
          updateQuestion={this.props.updateQuestion}
          className={CS.flexNoShrink}
        />
      </QueryBuilderMain>
    );
  };

  getRawSeries = (question, result) => {
    const { card } = question; // 自定义，非框架中的Question类型
    return [{ card, data: result }];
  };

  componentDidUpdate(prevProps) {
    // 监听 chatList 的变化
    if (this.props.chatList !== prevProps.chatList) {
      this.scrollToBottom();
    }
  }

  render() {
    const {
      question,
      databases,
      isShowingNewbModal,
      isShowingTimelineSidebar,
      queryBuilderMode,
      closeQbNewbModal,
      onDismissToast,
      onConfirmToast,
      isShowingToaster,
      isHeaderVisible,
      updateQuestion,
      reportTimezone,
      readOnly,
      isDirty,
      isRunnable,
      isResultDirty,
      hasVisualizeButton,
      runQuestionQuery,
      setQueryBuilderMode,
    } = this.props;

    // if we don't have a question at all or no databases then we are initializing, so keep it simple
    if (!question || !databases) {
      return <LoadingAndErrorWrapper className={CS.fullHeight} loading />;
    }

    const query = question.query();
    const { isNative } = Lib.queryDisplayInfo(question.query());

    const isNewQuestion = !isNative && Lib.sourceTableOrCardId(query) === null;
    const isModelOrMetric =
      question.type() === "model" || question.type() === "metric";

    if (isModelOrMetric && queryBuilderMode === "dataset") {
      return (
        <>
          <DatasetEditor {...this.props} />
          <QueryModals
            questionAlerts={this.props.questionAlerts}
            user={this.props.user}
            onSave={this.props.onSave}
            onCreate={this.props.onCreate}
            updateQuestion={this.props.updateQuestion}
            modal={this.props.modal}
            modalContext={this.props.modalContext}
            card={this.props.card}
            question={this.props.question}
            onCloseModal={this.props.onCloseModal}
            onOpenModal={this.props.onOpenModal}
            setQueryBuilderMode={this.props.setQueryBuilderMode}
            originalQuestion={this.props.originalQuestion}
            onChangeLocation={this.props.onChangeLocation}
          />
        </>
      );
    }

    const isNotebookContainerOpen =
      isNewQuestion || queryBuilderMode === "notebook";

    const leftSidebar = this.getLeftSidebar();
    const rightSidebar = this.getRightSidebar();
    const rightSidebarWidth = isShowingTimelineSidebar
      ? SIDEBAR_SIZES.TIMELINE
      : SIDEBAR_SIZES.NORMAL;

    return (
      <div className={CS.fullHeight}>
        <QueryBuilderViewRoot
          className={QueryBuilderS.QueryBuilder}
          data-testid="query-builder-root"
        >
          {/* {isHeaderVisible && this.renderHeader()} */}

          <QueryBuilderContentContainer>
            {!isNative && (
              <NotebookContainer
                isOpen={isNotebookContainerOpen}
                updateQuestion={updateQuestion}
                reportTimezone={reportTimezone}
                readOnly={readOnly}
                question={question}
                isDirty={isDirty}
                isRunnable={isRunnable}
                isResultDirty={isResultDirty}
                hasVisualizeButton={hasVisualizeButton}
                runQuestionQuery={runQuestionQuery}
                setQueryBuilderMode={setQueryBuilderMode}
              />
            )}
            <ViewSidebar side="left" isOpen={!!leftSidebar}>
              {leftSidebar}
            </ViewSidebar>
            {this.renderMain({ leftSidebar, rightSidebar })}
            <ViewSidebar
              side="right"
              isOpen={!!rightSidebar}
              width={rightSidebarWidth}
            >
              {rightSidebar}
            </ViewSidebar>
          </QueryBuilderContentContainer>
        </QueryBuilderViewRoot>

        {isShowingNewbModal && (
          <SavedQuestionIntroModal
            question={question}
            isShowingNewbModal={isShowingNewbModal}
            onClose={() => closeQbNewbModal()}
          />
        )}

        <QueryModals
          questionAlerts={this.props.questionAlerts}
          user={this.props.user}
          onSave={this.props.onSave}
          onCreate={this.props.onCreate}
          updateQuestion={this.props.updateQuestion}
          modal={this.props.modal}
          modalContext={this.props.modalContext}
          card={this.props.card}
          question={this.props.question}
          onCloseModal={this.props.onCloseModal}
          onOpenModal={this.props.onOpenModal}
          setQueryBuilderMode={this.props.setQueryBuilderMode}
          originalQuestion={this.props.originalQuestion}
          onChangeLocation={this.props.onChangeLocation}
        />

        <Toaster
          message={t`Would you like to be notified when this question is done loading?`}
          isShown={isShowingToaster}
          onDismiss={onDismissToast}
          onConfirm={onConfirmToast}
          fixed
        />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  onSetDatabaseId: id => dispatch(rememberLastUsedDatabase(id)),
  onUnarchive: async question => {
    await dispatch(setArchivedQuestion(question, false));
    await dispatch(Bookmarks.actions.invalidateLists());
  },
  onMove: (question, newCollection) =>
    dispatch(
      Questions.actions.setCollection({ id: question.id() }, newCollection, {
        notify: { undo: false },
      }),
    ),
  onDeletePermanently: id => {
    const deleteAction = Questions.actions.delete({ id });
    dispatch(deletePermanently(deleteAction));
  },
});

export default _.compose(
  ExplicitSize({ refreshMode: "debounceLeading" }),
  connect(null, mapDispatchToProps),
)(View);
