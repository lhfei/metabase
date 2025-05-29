import styled from "@emotion/styled";
import type { ReactNode } from "react";
import { useState } from "react";
import { push } from "react-router-redux";
import { t } from "ttag";

import Tooltip from "metabase/core/components/Tooltip/Tooltip";
import { useDispatch, useSelector } from "metabase/lib/redux";
import { getUserIsAdmin } from "metabase/selectors/user";
import { getLandingPageIllustration } from "metabase/selectors/whitelabel";

import { CustomHomePageModal } from "../CustomHomePageModal";
import { HomeGreeting } from "../HomeGreeting";

import {
  LayoutBody,
  LayoutEditButton,
  LayoutIllustration,
  LayoutRoot,
} from "./HomeLayout.styled";

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

interface HomeLayoutProps {
  children?: ReactNode;
}

export const HomeLayout = ({ children }: HomeLayoutProps): JSX.Element => {
  const [showModal, setShowModal] = useState(false);
  const isAdmin = useSelector(getUserIsAdmin);
  const landingPageIllustration = useSelector(getLandingPageIllustration);
  const dispatch = useDispatch();

  return (
    <LayoutRoot data-testid="home-page">
      {landingPageIllustration && (
        <LayoutIllustration
          data-testid="landing-page-illustration"
          backgroundImageSrc={landingPageIllustration.src}
          isDefault={landingPageIllustration.isDefault}
        />
      )}
      <HomeGreeting />
      {isAdmin && (
        <Tooltip tooltip={t`Pick a dashboard to serve as the homepage`}>
          <LayoutEditButton
            icon="pencil"
            borderless
            onClick={() => setShowModal(true)}
          >
            {t`Customize`}
          </LayoutEditButton>
        </Tooltip>
      )}
      <LayoutBody>{children}</LayoutBody>
      <CustomHomePageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
      <FloatButton onClick={() => dispatch(push("/chat"))} />
    </LayoutRoot>
  );
};
