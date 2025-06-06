import type { EChartsCoreOption } from "echarts/core";
import type { OptionSourceData } from "echarts/types/src/util/types";

import {
  NEGATIVE_STACK_TOTAL_DATA_KEY,
  OTHER_DATA_KEY,
  POSITIVE_STACK_TOTAL_DATA_KEY,
  X_AXIS_DATA_KEY,
} from "metabase/visualizations/echarts/cartesian/constants/dataset";
import type { CartesianChartModel } from "metabase/visualizations/echarts/cartesian/model/types";
import { buildAxes } from "metabase/visualizations/echarts/cartesian/option/axis";
import { buildEChartsSeries } from "metabase/visualizations/echarts/cartesian/option/series";
import { getTimelineEventsSeries } from "metabase/visualizations/echarts/cartesian/timeline-events/option";
import type { TimelineEventsModel } from "metabase/visualizations/echarts/cartesian/timeline-events/types";
import type {
  ComputedVisualizationSettings,
  RenderingContext,
} from "metabase/visualizations/types";
import type { TimelineEventId } from "metabase-types/api";

import type { ChartMeasurements } from "../chart-measurements/types";
import { CHART_STYLE } from "../constants/style";
import { getBarSeriesDataLabelKey } from "../model/util";

import { getGoalLineSeriesOption } from "./goal-line";
import { getTrendLinesOption } from "./trend-line";
import type { EChartsSeriesOption } from "./types";

export const getSharedEChartsOptions = (isAnimated: boolean) => ({
  useUTC: true,
  animation: isAnimated,
  animationDuration: 0,
  animationDurationUpdate: 1, // by setting this to 1ms we visually eliminate shape transitions while preserving opacity transitions
  toolbox: {
    show: false,
  },
  brush: {
    toolbox: ["lineX" as const],
    xAxisIndex: 0,
    throttleType: "debounce" as const,
    throttleDelay: 200,
  },
});

type Axes = ReturnType<typeof buildAxes>;

export const ensureRoomForLabels = (
  axes: Axes,
  { leftAxisModel, rightAxisModel }: CartesianChartModel,
  chartMeasurements: ChartMeasurements,
  seriesOption: EChartsSeriesOption[],
): Axes => ({
  ...axes,
  yAxis: axes.yAxis.map((axis) => {
    const axisModel = axis.position === "left" ? leftAxisModel : rightAxisModel;
    if (!axisModel) {
      return axis;
    }
    const isAxisUsedForBarChart = axisModel.seriesKeys.some((key) => {
      return seriesOption.some((o) => o.id === key && o.type === "bar");
    });
    if (!isAxisUsedForBarChart) {
      return axis;
    }
    const [min] = axisModel.extent;
    if (min < 0) {
      const { bounds } = chartMeasurements;
      const innerHeight = Math.abs(bounds.bottom - bounds.top);
      const labelPct = CHART_STYLE.seriesLabels.size / innerHeight;
      const lowerBoundaryGap = labelPct / 2; // `/ 2` because it's okay if the bar label overlaps the axis *line*, we just don't want it to overlap the axis *labels*
      return { ...axis, boundaryGap: [lowerBoundaryGap, 0] };
    }
    return axis;
  }),
});

export const getCartesianChartOption = (
  chartModel: CartesianChartModel,
  chartMeasurements: ChartMeasurements,
  timelineEventsModel: TimelineEventsModel | null,
  selectedTimelineEventsIds: TimelineEventId[],
  settings: ComputedVisualizationSettings,
  chartWidth: number,
  isAnimated: boolean,
  renderingContext: RenderingContext,
): EChartsCoreOption => {
  const hasTimelineEvents = timelineEventsModel != null;
  const timelineEventsSeries = hasTimelineEvents
    ? getTimelineEventsSeries(
        timelineEventsModel,
        selectedTimelineEventsIds,
        renderingContext,
      )
    : null;

  const dataSeriesOptions = buildEChartsSeries(
    chartModel,
    settings,
    chartWidth,
    chartMeasurements,
    renderingContext,
  );
  const goalSeriesOption = getGoalLineSeriesOption(
    chartModel,
    settings,
    renderingContext,
  );
  const trendSeriesOption = getTrendLinesOption(chartModel);

  const seriesOption = [
    // Data series should always come first for correct labels positioning
    // since series labelLayout function params return seriesIndex which is used to access label value
    dataSeriesOptions,
    goalSeriesOption,
    trendSeriesOption,
    timelineEventsSeries,
  ].flatMap((option) => option ?? []);

  // dataset option
  const dimensions = [
    X_AXIS_DATA_KEY,
    OTHER_DATA_KEY,
    POSITIVE_STACK_TOTAL_DATA_KEY,
    NEGATIVE_STACK_TOTAL_DATA_KEY,
    ...chartModel.seriesModels.map((seriesModel) => [
      seriesModel.dataKey,
      getBarSeriesDataLabelKey(seriesModel.dataKey, "+"),
      getBarSeriesDataLabelKey(seriesModel.dataKey, "-"),
    ]),
  ].flatMap((dimension) => dimension);

  const echartsDataset = [
    {
      // Type cast is needed here because echarts' internal types are incorrect.
      // Their types do not allow booleans, but in reality booleans do work as
      // data values, see this example
      // https://echarts.apache.org/examples/en/editor.html?c=line-simple&code=PYBwLglsB2AEC8sDeAoWsAmBDMWDOApmAFzJrqx7ACuATgMYGkDaSARFm6QGZYA2hADSw2AIy6wAjAF9h7TqTC1qBYWIkAmaQF1ys8gA8AggYh5SqCrDABPEE1gByejgIBzYLRuPBe3-hsTMwtydFt7UkcAN34VRz9yQloIAnNYZlCyKzC7B0c-CGgCH0z0Amh6YAwHS2z0A1IONn862BtG8VLYaUye9F1pAG4gA
      source: chartModel.transformedDataset as OptionSourceData,
      dimensions,
    },
  ];

  if (chartModel.trendLinesModel) {
    echartsDataset.push({
      source: chartModel.trendLinesModel?.dataset as OptionSourceData,
      dimensions: [
        X_AXIS_DATA_KEY,
        ...chartModel.trendLinesModel?.seriesModels.map((s) => s.dataKey),
      ],
    });
  }

  return {
    ...getSharedEChartsOptions(isAnimated),
    grid: {
      ...chartMeasurements.padding,
    },
    dataset: echartsDataset,
    series: seriesOption,
    ...ensureRoomForLabels(
      buildAxes(
        chartModel,
        chartWidth,
        chartMeasurements,
        settings,
        hasTimelineEvents,
        renderingContext,
      ),
      chartModel,
      chartMeasurements,
      dataSeriesOptions,
    ),
  };
};
