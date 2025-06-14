import cx from "classnames";
import { useEffect } from "react";
import _ from "underscore";

import {
  DashboardNotFoundError,
  SdkLoader,
  withPublicComponentWrapper,
} from "embedding-sdk/components/private/PublicComponentWrapper";
import {
  type SdkDashboardDisplayProps,
  useSdkDashboardParams,
} from "embedding-sdk/hooks/private/use-sdk-dashboard-params";
import { useSdkDispatch, useSdkSelector } from "embedding-sdk/store";
import type { DashboardEventHandlersProps } from "embedding-sdk/types/dashboard";
import { useLocale } from "metabase/common/hooks/use-locale";
import CS from "metabase/css/core/index.css";
import { useEmbedTheme } from "metabase/dashboard/hooks";
import type { EmbedDisplayParams } from "metabase/dashboard/types";
import { useValidatedEntityId } from "metabase/lib/entity-id/hooks/use-validated-entity-id";
import { PublicOrEmbeddedDashboard } from "metabase/public/containers/PublicOrEmbeddedDashboard/PublicOrEmbeddedDashboard";
import { resetErrorPage } from "metabase/redux/app";
import { getErrorPage } from "metabase/selectors/app";
import { Box } from "metabase/ui";

/**
 * @interface
 * @expand
 * @category StaticDashboard
 */
export type StaticDashboardProps = SdkDashboardDisplayProps &
  DashboardEventHandlersProps;

export const StaticDashboardInner = ({
  dashboardId,
  initialParameters = {},
  withTitle = true,
  withCardTitle = true,
  withDownloads = false,
  hiddenParameters = [],
  onLoad,
  onLoadWithoutCards,
  style,
  className,
}: StaticDashboardProps) => {
  const {
    displayOptions,
    ref,
    isFullscreen,
    onFullscreenChange,
    refreshPeriod,
    onRefreshPeriodChange,
    setRefreshElapsedHook,
  } = useSdkDashboardParams({
    dashboardId,
    initialParameters,
    withTitle,
    withDownloads,
    hiddenParameters,
  });

  const { theme } = useEmbedTheme();

  return (
    <Box
      w="100%"
      ref={ref}
      className={cx(CS.overflowAuto, className)}
      style={style}
    >
      <PublicOrEmbeddedDashboard
        dashboardId={dashboardId}
        parameterQueryParams={initialParameters}
        hideParameters={displayOptions.hideParameters}
        background={displayOptions.background}
        titled={displayOptions.titled}
        cardTitled={withCardTitle}
        theme={theme}
        isFullscreen={isFullscreen}
        onFullscreenChange={onFullscreenChange}
        refreshPeriod={refreshPeriod}
        onRefreshPeriodChange={onRefreshPeriodChange}
        setRefreshElapsedHook={setRefreshElapsedHook}
        bordered={displayOptions.bordered}
        onLoad={onLoad}
        onLoadWithoutCards={onLoadWithoutCards}
        downloadsEnabled={{ pdf: withDownloads, results: withDownloads }}
        isNightMode={false}
        onNightModeChange={_.noop}
        hasNightModeToggle={false}
        withFooter={false}
      />
    </Box>
  );
};

/**
 * A lightweight dashboard component.
 *
 * @function
 * @category StaticDashboard
 */
const StaticDashboard = withPublicComponentWrapper<StaticDashboardProps>(
  ({ dashboardId: initialDashboardId, ...rest }) => {
    const { isLocaleLoading } = useLocale();
    const { isLoading, id: resolvedDashboardId } = useValidatedEntityId({
      type: "dashboard",
      id: initialDashboardId,
    });

    const errorPage = useSdkSelector(getErrorPage);
    const dispatch = useSdkDispatch();
    useEffect(() => {
      if (resolvedDashboardId) {
        dispatch(resetErrorPage());
      }
    }, [dispatch, resolvedDashboardId]);

    if (isLocaleLoading || isLoading) {
      return <SdkLoader />;
    }

    if (!resolvedDashboardId || errorPage?.status === 404) {
      return <DashboardNotFoundError id={initialDashboardId} />;
    }

    return <StaticDashboardInner dashboardId={resolvedDashboardId} {...rest} />;
  },
);

export { EmbedDisplayParams, StaticDashboard };
