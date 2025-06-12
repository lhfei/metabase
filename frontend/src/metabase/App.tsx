import styled from "@emotion/styled";
import type { Location } from "history";
import { KBarProvider } from "kbar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { push } from "react-router-redux";

import { AppBanner } from "metabase/components/AppBanner";
import {
  Archived,
  GenericError,
  KeyboardTriggeredErrorModal,
  NotFound,
  Unauthorized,
} from "metabase/components/ErrorPages";
import { UndoListing } from "metabase/containers/UndoListing";
import { ContentViewportContext } from "metabase/core/context/ContentViewportContext";
import CS from "metabase/css/core/index.css";
import ScrollToTop from "metabase/hoc/ScrollToTop";
import { initializeIframeResizer } from "metabase/lib/dom";
import { connect } from "metabase/lib/redux";
import AppBar from "metabase/nav/containers/AppBar";
import Navbar from "metabase/nav/containers/Navbar";
import { setErrorPage } from "metabase/redux/app";
import {
  getErrorPage,
  getIsAdminApp,
  getIsAppBarVisible,
  getIsNavBarEnabled,
} from "metabase/selectors/app";
import StatusListing from "metabase/status/components/StatusListing";
import type { AppErrorDescriptor, Dispatch, State } from "metabase-types/store";

import { AppContainer, AppContent, AppContentContainer } from "./App.styled";
import ErrorBoundary from "./ErrorBoundary";
import { NewModals } from "./new/components/NewModals/NewModals";
import { Palette } from "./palette/components/Palette";

const FloatButton = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background-image: url("app/img/robot.png");
  background-size: 48px 44px;
  width: 48px;
  height: 44px;
  cursor: pointer;
  &:hover {
    transform: scale(1.1);
  }
  animation:
    pulseRobot 2s infinite,
    floatRobot 3s infinite ease-in-out,
    fadeInRobot 1s ease-in-out;
  border-radius: 50%;
  @keyframes pulseRobot {
    0% {
      box-shadow: 0 0 5px rgba(0, 0, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 10px rgba(0, 0, 255, 1);
    }
    100% {
      box-shadow: 0 0 5px rgba(0, 0, 255, 0.5);
    }
  }

  @keyframes floatRobot {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes fadeInRobot {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;

const getErrorComponent = ({ status, data, context }: AppErrorDescriptor) => {
  if (status === 403 || data?.error_code === "unauthorized") {
    return <Unauthorized />;
  }
  if (status === 404 || data?.error_code === "not-found") {
    return <NotFound />;
  }
  if (data?.error_code === "archived" && context === "dashboard") {
    return <Archived entityName="dashboard" linkTo="/dashboards/archive" />;
  }
  if (data?.error_code === "archived" && context === "query-builder") {
    return <Archived entityName="question" linkTo="/questions/archive" />;
  }
  return <GenericError details={data?.message} />;
};

interface AppStateProps {
  errorPage: AppErrorDescriptor | null;
  isAdminApp: boolean;
  bannerMessageDescriptor?: string;
  isAppBarVisible: boolean;
  isNavBarEnabled: boolean;
}

interface AppDispatchProps {
  onError: (error: unknown) => void;
  dispatch: Dispatch;
}

interface AppRouterOwnProps {
  location: Location;
  children: ReactNode;
}

type AppProps = AppStateProps & AppDispatchProps & AppRouterOwnProps;

const mapStateToProps = (
  state: State,
  props: AppRouterOwnProps,
): AppStateProps => ({
  errorPage: getErrorPage(state),
  isAdminApp: getIsAdminApp(state, props),
  isAppBarVisible: getIsAppBarVisible(state, props),
  isNavBarEnabled: getIsNavBarEnabled(state, props),
});

// const mapDispatchToProps: AppDispatchProps = {
//   onError: setErrorPage,
// };

const mapDispatchToProps = (dispatch: Dispatch): AppDispatchProps => ({
  onError: error => dispatch(setErrorPage(error)),
  dispatch,
});

function App({
  errorPage,
  isAdminApp,
  isAppBarVisible,
  isNavBarEnabled,
  children,
  location,
  onError,
  dispatch,
}: AppProps) {
  const [viewportElement, setViewportElement] = useState<HTMLElement | null>();

  useEffect(() => {
    initializeIframeResizer();
  }, []);

  return (
    <ErrorBoundary onError={onError}>
      <ScrollToTop>
        <KBarProvider>
          <KeyboardTriggeredErrorModal />
          <AppContainer className={CS.spread}>
            <AppBanner />
            {isAppBarVisible && <AppBar />}
            <AppContentContainer isAdminApp={isAdminApp}>
              {isNavBarEnabled && <Navbar />}
              <AppContent ref={setViewportElement}>
                <ContentViewportContext.Provider
                  value={viewportElement ?? null}
                >
                  {errorPage ? getErrorComponent(errorPage) : children}
                </ContentViewportContext.Provider>
              </AppContent>
              <UndoListing />
              <StatusListing />
              <NewModals />
            </AppContentContainer>
          </AppContainer>
          <Palette />
        </KBarProvider>
      </ScrollToTop>
      {location.pathname !== "/chat" && (
        <FloatButton onClick={() => dispatch(push("/chat"))} />
      )}
    </ErrorBoundary>
  );
}

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default connect<AppStateProps, unknown, AppRouterOwnProps, State>(
  mapStateToProps,
  mapDispatchToProps,
)(App);
