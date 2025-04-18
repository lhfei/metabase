import { createContext, useContext, useEffect, useMemo } from "react";

import { StaticQuestionSdkMode } from "embedding-sdk/components/public/StaticQuestion/mode";
import { useLoadQuestion } from "embedding-sdk/hooks/private/use-load-question";
import { transformSdkQuestion } from "embedding-sdk/lib/transform-question";
import { useSdkSelector } from "embedding-sdk/store";
import { getPlugins } from "embedding-sdk/store/selectors";
import type { EntityTypeFilterKeys } from "embedding-sdk/types/question";
import type { DataPickerValue } from "metabase/common/components/DataPicker";
import { useValidatedEntityId } from "metabase/lib/entity-id/hooks/use-validated-entity-id";
import { useCreateQuestion } from "metabase/query_builder/containers/use-create-question";
import { useSaveQuestion } from "metabase/query_builder/containers/use-save-question";
import { getEmbeddingMode } from "metabase/visualizations/click-actions/lib/modes";
import { EmbeddingSdkMode } from "metabase/visualizations/click-actions/modes/EmbeddingSdkMode";
import type Question from "metabase-lib/v1/Question";

import type {
  InteractiveQuestionContextType,
  InteractiveQuestionProviderProps,
} from "./types";

/**
 * Note: This context should only be used as a wrapper for the InteractiveQuestionDefaultView
 * component. The idea behind this context is to allow the InteractiveQuestionDefaultView component
 * to use components within the ./components folder, which use the context for display
 * and functions.
 * */
export const InteractiveQuestionContext = createContext<
  InteractiveQuestionContextType | undefined
>(undefined);

const DEFAULT_OPTIONS = {};

const FILTER_MODEL_MAP: Record<EntityTypeFilterKeys, DataPickerValue["model"]> =
  {
    table: "table",
    question: "card",
    model: "dataset",
    metric: "metric",
  };
const mapEntityTypeFilterToDataPickerModels = (
  entityTypeFilter: InteractiveQuestionProviderProps["entityTypeFilter"],
): InteractiveQuestionContextType["modelsFilterList"] => {
  return entityTypeFilter?.map((entityType) => FILTER_MODEL_MAP[entityType]);
};

export const InteractiveQuestionProvider = ({
  questionId: initialQuestionId,
  options = DEFAULT_OPTIONS,
  deserializedCard,
  componentPlugins,
  onNavigateBack,
  children,
  onBeforeSave,
  onSave,
  isSaveEnabled = true,
  entityTypeFilter,
  targetCollection,
  initialSqlParameters,
  withDownloads,
  variant,
}: InteractiveQuestionProviderProps) => {
  const {
    id: questionId,
    isLoading: isLoadingValidatedId,
    isError: isCardIdError,
  } = useValidatedEntityId({
    type: "card",

    // If the question is new, we won't have a question id yet.
    id: initialQuestionId === "new" ? undefined : initialQuestionId,
  });

  const handleCreateQuestion = useCreateQuestion();
  const handleSaveQuestion = useSaveQuestion();

  const handleSave = async (question: Question) => {
    if (isSaveEnabled) {
      const saveContext = { isNewQuestion: false };
      const sdkQuestion = transformSdkQuestion(question);

      await onBeforeSave?.(sdkQuestion, saveContext);
      await handleSaveQuestion(question);
      onSave?.(sdkQuestion, saveContext);
      await loadAndQueryQuestion();
    }
  };

  const handleCreate = async (question: Question): Promise<Question> => {
    if (isSaveEnabled) {
      const saveContext = { isNewQuestion: true };
      const sdkQuestion = transformSdkQuestion(question);

      await onBeforeSave?.(sdkQuestion, saveContext);

      const createdQuestion = await handleCreateQuestion(question);
      onSave?.(sdkQuestion, saveContext);

      // Set the latest saved question object to update the question title.
      replaceQuestion(createdQuestion);
      return createdQuestion;
    }

    return question;
  };

  const {
    question,
    originalQuestion,

    queryResults,

    isQuestionLoading,
    isQueryRunning,

    queryQuestion,
    replaceQuestion,
    loadAndQueryQuestion,
    updateQuestion,
    navigateToNewCard,
  } = useLoadQuestion({
    questionId,
    options,
    deserializedCard,
    initialSqlParameters,
  });

  const globalPlugins = useSdkSelector(getPlugins);

  const combinedPlugins = useMemo(() => {
    return { ...globalPlugins, ...componentPlugins };
  }, [globalPlugins, componentPlugins]);

  const mode = useMemo(() => {
    return (
      question &&
      getEmbeddingMode({
        question,
        queryMode:
          variant === "static" ? StaticQuestionSdkMode : EmbeddingSdkMode,
        plugins: combinedPlugins ?? undefined,
      })
    );
  }, [question, variant, combinedPlugins]);

  const questionContext: InteractiveQuestionContextType = {
    originalId: initialQuestionId,
    isQuestionLoading: isQuestionLoading || isLoadingValidatedId,
    isQueryRunning,
    resetQuestion: loadAndQueryQuestion,
    onReset: loadAndQueryQuestion,
    onNavigateBack,
    queryQuestion,
    replaceQuestion,
    updateQuestion,
    navigateToNewCard,
    plugins: combinedPlugins,
    question,
    originalQuestion,
    queryResults,
    mode,
    onSave: handleSave,
    onCreate: handleCreate,
    modelsFilterList: mapEntityTypeFilterToDataPickerModels(entityTypeFilter),
    isSaveEnabled,
    targetCollection,
    isCardIdError,
    withDownloads,
    variant,
  };

  useEffect(() => {
    loadAndQueryQuestion();
  }, [loadAndQueryQuestion]);

  return (
    <InteractiveQuestionContext.Provider value={questionContext}>
      {children}
    </InteractiveQuestionContext.Provider>
  );
};

export const useInteractiveQuestionContext = () => {
  const context = useContext(InteractiveQuestionContext);
  if (context === undefined) {
    throw new Error(
      "useInteractiveQuestionContext must be used within a InteractiveQuestionProvider",
    );
  }
  return context;
};
