import { push } from "react-router-redux";
import { c, t } from "ttag";

import { useUserSetting } from "metabase/common/hooks";
import CollapseSection from "metabase/components/CollapseSection";
import CS from "metabase/css/core/index.css";
import { useDispatch } from "metabase/lib/redux";
import * as Urls from "metabase/lib/urls";
import type { CollectionId } from "metabase-types/api";

import { PaddedSidebarLink, SidebarHeading } from "../MainNavbar.styled";
import type { SelectedItem } from "../types";

export const BrowseNavSection = ({
  nonEntityItem,
  onItemSelect,
  hasDataAccess,
  collectionId,
}: {
  nonEntityItem: SelectedItem;
  onItemSelect: () => void;
  hasDataAccess: boolean;
  collectionId?: CollectionId;
}) => {
  const BROWSE_MODELS_URL = "/browse/models";
  const BROWSE_DATA_URL = "/browse/databases";
  const BROWSE_METRICS_URL = "/browse/metrics";

  const [expandBrowse = true, setExpandBrowse] = useUserSetting(
    "expand-browse-in-nav",
  );
  const dispatch = useDispatch();

  return (
    <CollapseSection
      header={
        <SidebarHeading>{c("A verb, shown in the sidebar")
          .t`Browse`}</SidebarHeading>
      }
      initialState={expandBrowse ? "expanded" : "collapsed"}
      iconPosition="right"
      iconSize={8}
      headerClass={CS.mb1}
      onToggle={setExpandBrowse}
    >
      <PaddedSidebarLink
        withAdd
        tooltip="创建模型"
        onAddClick={() => {
          dispatch(push("/model/new"));
        }}
        icon="model"
        url={BROWSE_MODELS_URL}
        isSelected={nonEntityItem?.url?.startsWith(BROWSE_MODELS_URL)}
        onClick={onItemSelect}
        aria-label={t`Browse models`}
      >
        {t`Models`}
      </PaddedSidebarLink>

      {hasDataAccess && (
        <PaddedSidebarLink
          icon="database"
          url={BROWSE_DATA_URL}
          isSelected={nonEntityItem?.url?.startsWith(BROWSE_DATA_URL)}
          onClick={onItemSelect}
          aria-label={t`Browse databases`}
        >
          {t`Databases`}
        </PaddedSidebarLink>
      )}

      <PaddedSidebarLink
        withAdd
        tooltip="创建指标"
        onAddClick={() => {
          const url = Urls.newQuestion({
            mode: "query",
            cardType: "metric",
            collectionId,
          });
          dispatch(push(url));
        }}
        icon="metric"
        url={BROWSE_METRICS_URL}
        isSelected={nonEntityItem?.url?.startsWith(BROWSE_METRICS_URL)}
        onClick={onItemSelect}
        aria-label={t`Browse metrics`}
      >
        {t`Metrics`}
      </PaddedSidebarLink>
    </CollapseSection>
  );
};
