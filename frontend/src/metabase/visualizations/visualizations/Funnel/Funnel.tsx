import cx from "classnames";
import React from "react";
import { t } from "ttag";
import _ from "underscore";

import CS from "metabase/css/core/index.css";
import { formatNullable } from "metabase/lib/formatting/nullable";
import ChartCaption from "metabase/visualizations/components/ChartCaption";
import { TransformedVisualization } from "metabase/visualizations/components/TransformedVisualization";
import { ChartSettingOrderedSimple } from "metabase/visualizations/components/settings/ChartSettingOrderedSimple";
import { useBrowserRenderingContext } from "metabase/visualizations/hooks/use-browser-rendering-context";
import { groupRawSeriesMetrics } from "metabase/visualizations/lib/dataset";
import {
  ChartSettingsError,
  MinRowsError,
} from "metabase/visualizations/lib/errors";
import { columnSettings } from "metabase/visualizations/lib/settings/column";
import {
  dimensionSetting,
  metricSetting,
} from "metabase/visualizations/lib/settings/utils";
import {
  getDefaultSize,
  getMinSize,
} from "metabase/visualizations/shared/utils/sizes";
import type {
  ComputedVisualizationSettings,
  VisualizationProps,
} from "metabase/visualizations/types";
import { BarChart } from "metabase/visualizations/visualizations/BarChart";
import { funnelToBarTransform } from "metabase/visualizations/visualizations/Funnel/funnel-bar-transform";
import type { DatasetData, RawSeries, RowValue } from "metabase-types/api";

import FunnelNormal from "../../components/FunnelNormal";

import type { FunnelRow } from "./types";

const getUniqueFunnelRows = (rows: FunnelRow[]) => {
  return [...new Map(rows.map((row) => [row.key, row])).values()];
};

Object.assign(Funnel, {
  getUiName: () => t`Funnel`,
  identifier: "funnel",
  iconName: "funnel",
  noHeader: true,
  minSize: getMinSize("funnel"),
  supportsVisualizer: true,
  defaultSize: getDefaultSize("funnel"),
  isSensible({ cols }: DatasetData) {
    return cols.length === 2;
  },
  checkRenderable: (
    series: RawSeries,
    settings: ComputedVisualizationSettings,
  ) => {
    const [
      {
        data: { rows },
      },
    ] = series;
    if (series.length > 1) {
      return;
    }

    if (rows.length < 1) {
      throw new MinRowsError(1, rows.length);
    }
    if (!settings["funnel.dimension"] || !settings["funnel.metric"]) {
      throw new ChartSettingsError(
        t`Which fields do you want to use?`,
        { section: t`Data` },
        t`Choose fields`,
      );
    }
  },

  hasEmptyState: true,

  settings: {
    ...columnSettings({ hidden: true }),
    ...dimensionSetting("funnel.dimension", {
      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      section: t`Data`,
      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      title: t`Column with steps`,
      dashboard: false,
      useRawSeries: true,
      showColumnSetting: true,
      marginBottom: "0.625rem",
    }),
    "funnel.order_dimension": {
      getValue: (_series: RawSeries, settings: ComputedVisualizationSettings) =>
        settings["funnel.dimension"],
      readDependencies: ["funnel.rows"],
    },
    "funnel.rows": {
      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      section: t`Data`,
      widget: ChartSettingOrderedSimple,
      getValue: (
        [
          {
            data: { cols, rows },
          },
        ]: RawSeries,
        settings: ComputedVisualizationSettings,
      ) => {
        const dimensionIndex = cols.findIndex(
          (col) => col.name === settings["funnel.dimension"],
        );
        const orderDimension = settings["funnel.order_dimension"];
        const dimension = settings["funnel.dimension"];

        const rowsOrder = settings["funnel.rows"];
        const rowsKeys = rows.map((row) => formatNullable(row[dimensionIndex]));

        const getDefault = (keys: RowValue[]) =>
          keys.map((key) => ({
            key,
            name: key,
            enabled: true,
          }));
        if (
          !rowsOrder ||
          !_.isArray(rowsOrder) ||
          !rowsOrder.every((setting) => setting.key !== undefined) ||
          orderDimension !== dimension
        ) {
          return getUniqueFunnelRows(getDefault(rowsKeys));
        }

        const removeMissingOrder = (keys: RowValue[], order: any) =>
          order.filter((o: any) => keys.includes(o.key));
        const newKeys = (keys: RowValue[], order: any) =>
          keys.filter((key) => !order.find((o: any) => o.key === key));

        const funnelRows = [
          ...removeMissingOrder(rowsKeys, rowsOrder),
          ...getDefault(newKeys(rowsKeys, rowsOrder)),
        ];

        return getUniqueFunnelRows(funnelRows);
      },
      props: {
        hasEditSettings: false,
      },
      getHidden: (series: RawSeries, settings: ComputedVisualizationSettings) =>
        settings["funnel.dimension"] === null ||
        settings["funnel.metric"] === null,
      writeDependencies: ["funnel.order_dimension"],
      dataTestId: "funnel-row-sort",
    },
    ...metricSetting("funnel.metric", {
      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      section: t`Data`,

      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      title: t`Measure`,

      dashboard: false,
      useRawSeries: true,
      showColumnSetting: true,
    }),
    "funnel.type": {
      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      title: t`Funnel type`,

      // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
      section: t`Display`,

      widget: "select",
      props: {
        options: [
          // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
          { name: t`Funnel`, value: "funnel" },
          // eslint-disable-next-line ttag/no-module-declaration -- see metabase#5504
          { name: t`Bar chart`, value: "bar" },
        ],
      },
      // legacy "bar" funnel was only previously available via multiseries
      getDefault: (series: RawSeries) => (series.length > 1 ? "bar" : "funnel"),
      useRawSeries: true,
    },
  },
});

export function Funnel(props: VisualizationProps) {
  const {
    headerIcon,
    settings,
    showTitle,
    isVisualizerViz,
    actionButtons,
    className,
    onChangeCardAndRun,
    rawSeries,
    fontFamily,
    getHref,
    isDashboard,
    isEditing,
    titleMenuItems,
  } = props;
  const hasTitle = showTitle && settings["card.title"];

  const groupedRawSeries = groupRawSeriesMetrics(
    rawSeries,
    settings["funnel.dimension"],
  );

  const renderingContext = useBrowserRenderingContext({ fontFamily });

  if (settings["funnel.type"] === "bar") {
    return (
      <TransformedVisualization
        originalProps={{ ...props, rawSeries: groupedRawSeries }}
        VisualizationComponent={BarChart}
        transformSeries={funnelToBarTransform}
        renderingContext={renderingContext}
      />
    );
  }

  // We can't navigate a user to a particular card from a visualizer viz,
  // so title selection is disabled in this case
  const canSelectTitle =
    !!onChangeCardAndRun &&
    (!isVisualizerViz || React.Children.count(titleMenuItems) === 1);

  return (
    <div className={cx(className, CS.flex, CS.flexColumn, CS.p1)}>
      {hasTitle && (
        <ChartCaption
          series={groupedRawSeries}
          settings={settings}
          icon={headerIcon}
          getHref={canSelectTitle ? getHref : undefined}
          actionButtons={actionButtons}
          hasInfoTooltip={!isDashboard || !isEditing}
          onChangeCardAndRun={canSelectTitle ? onChangeCardAndRun : undefined}
          titleMenuItems={titleMenuItems}
        />
      )}
      <FunnelNormal
        {...props}
        rawSeries={groupedRawSeries}
        className={CS.flexFull}
      />
    </div>
  );
}
