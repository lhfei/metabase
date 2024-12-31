/**
 * created by liushuai
 */
import type { LocationDescriptor } from "history";
import { c, t } from "ttag";

import NewItemMenu from "metabase/containers/NewItemMenuSideBar";
import { useUserSetting } from "metabase/common/hooks";
import { useHasModels } from "metabase/common/hooks/use-has-models";
import CollapseSection from "metabase/components/CollapseSection";
import { DelayedLoadingAndErrorWrapper } from "metabase/components/LoadingAndErrorWrapper/DelayedLoadingAndErrorWrapper";
import CS from "metabase/css/core/index.css";
import { Flex, Skeleton } from "metabase/ui";

import { PaddedSidebarLink, SidebarHeading } from "../MainNavbar.styled";
import type { SelectedItem } from "../types";
import { useState } from "react";

export const NewNavSection = ({
  hasDataAccess,
  isOpen,
  location,
}: {
  nonEntityItem: SelectedItem;
  onItemSelect: () => void;
  hasDataAccess: boolean;
  isOpen: boolean;
  location?: LocationDescriptor;
}) => {
  const {
    hasModels,
    isLoading: areModelsLoading,
    error: modelsError,
  } = useHasModels();
  const noModelsExist = hasModels === false;

  // todo: 由服务端注入 window.MetabaseBootstrap 配置？
  // const [expandBrowse = true, setExpandBrowse] = useUserSetting(
  //   "expand-browse-in-nav",
  // );

  const [expandNew, setExpandNew] = useState(true);

  if (noModelsExist && !hasDataAccess) {
    return null;
  }

  return (
    <CollapseSection
      header={
        <SidebarHeading>{c("A verb, shown in the sidebar")
          .t`New`}</SidebarHeading>
      }
      initialState={expandNew ? "expanded" : "collapsed"}
      iconPosition="right"
      iconSize={8}
      headerClass={CS.mb1}
      onToggle={setExpandNew}
    >
      <NewItemMenu />
    </CollapseSection>
  );
};
