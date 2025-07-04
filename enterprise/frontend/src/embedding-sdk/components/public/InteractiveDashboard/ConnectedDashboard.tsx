import type { ComponentType, FC } from "react";
import type { ConnectedProps } from "react-redux";
import _ from "underscore";

import type { DashboardEventHandlersProps } from "embedding-sdk/types/dashboard";
import type { MetabasePluginsConfig } from "embedding-sdk/types/plugins";
import type { CommonStylingProps } from "embedding-sdk/types/props";
import * as dashboardActions from "metabase/dashboard/actions";
import type { NavigateToNewCardFromDashboardOpts } from "metabase/dashboard/components/DashCard/types";
import { Dashboard } from "metabase/dashboard/components/Dashboard/Dashboard";
import {
  getClickBehaviorSidebarDashcard,
  getDashboardBeforeEditing,
  getDashboardComplete,
  getDocumentTitle,
  getFavicon,
  getIsAddParameterPopoverOpen,
  getIsAdditionalInfoVisible,
  getIsDashCardsLoadingComplete,
  getIsDashCardsRunning,
  getIsDirty,
  getIsEditing,
  getIsEditingParameter,
  getIsHeaderVisible,
  getIsNavigatingBackToDashboard,
  getIsSharing,
  getLoadingStartTime,
  getParameterValues,
  getSelectedTabId,
  getSidebar,
  getSlowCards,
} from "metabase/dashboard/selectors";
import type {
  DashboardFullscreenControls,
  DashboardLoaderWrapperProps,
  DashboardRefreshPeriodControls,
} from "metabase/dashboard/types";
import type { ParameterValues } from "metabase/embedding-sdk/types/dashboard";
import { connect } from "metabase/lib/redux";
import { useDashboardLoadHandlers } from "metabase/public/containers/PublicOrEmbeddedDashboard/use-dashboard-load-handlers";
import { closeNavbar, setErrorPage } from "metabase/redux/app";
import { getIsNavbarOpen } from "metabase/selectors/app";
import {
  canManageSubscriptions,
  getUserIsAdmin,
} from "metabase/selectors/user";
import type { DashboardId } from "metabase-types/api";
import type { State } from "metabase-types/store";

const mapStateToProps = (state: State) => {
  return {
    canManageSubscriptions: canManageSubscriptions(state),
    isAdmin: getUserIsAdmin(state),
    isNavbarOpen: getIsNavbarOpen(state),
    isEditing: getIsEditing(state),
    isSharing: getIsSharing(state),
    dashboardBeforeEditing: getDashboardBeforeEditing(state),
    isEditingParameter: getIsEditingParameter(state),
    isDirty: getIsDirty(state),
    dashboard: getDashboardComplete(state),
    slowCards: getSlowCards(state),
    parameterValues: getParameterValues(state),
    loadingStartTime: getLoadingStartTime(state),
    clickBehaviorSidebarDashcard: getClickBehaviorSidebarDashcard(state),
    isAddParameterPopoverOpen: getIsAddParameterPopoverOpen(state),
    sidebar: getSidebar(state),
    pageFavicon: getFavicon(state),
    documentTitle: getDocumentTitle(state),
    isRunning: getIsDashCardsRunning(state),
    isLoadingComplete: getIsDashCardsLoadingComplete(state),
    isHeaderVisible: getIsHeaderVisible(state),
    isAdditionalInfoVisible: getIsAdditionalInfoVisible(state),
    selectedTabId: getSelectedTabId(state),
    isNavigatingBackToDashboard: getIsNavigatingBackToDashboard(state),
  };
};

const mapDispatchToProps = {
  ...dashboardActions,
  closeNavbar,
  setErrorPage,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type ReduxProps = ConnectedProps<typeof connector>;

type ConnectedDashboardProps = {
  dashboardId: DashboardId;
  isLoading: boolean;
  parameterQueryParams: ParameterValues;

  downloadsEnabled?: boolean;
  onNavigateToNewCardFromDashboard: (
    opts: NavigateToNewCardFromDashboardOpts,
  ) => void;

  plugins?: MetabasePluginsConfig;
} & Pick<CommonStylingProps, "className"> &
  DashboardFullscreenControls &
  DashboardRefreshPeriodControls &
  DashboardLoaderWrapperProps &
  DashboardEventHandlersProps;

const ConnectedDashboardInner = ({
  dashboard,
  onLoad,
  onLoadWithoutCards,
  onNavigateToNewCardFromDashboard,
  ...restProps
}: ConnectedDashboardProps & ReduxProps) => {
  useDashboardLoadHandlers({ dashboard, onLoad, onLoadWithoutCards });

  return (
    <Dashboard
      dashboard={dashboard}
      {...restProps}
      isNightMode={false}
      onNightModeChange={_.noop}
      hasNightModeToggle={false}
      navigateToNewCardFromDashboard={onNavigateToNewCardFromDashboard}
      autoScrollToDashcardId={undefined}
      reportAutoScrolledToDashcard={_.noop}
    />
  );
};

export const ConnectedDashboard = connector<
  ComponentType<ConnectedDashboardProps & ReduxProps>
>(ConnectedDashboardInner) as FC<ConnectedDashboardProps>;
