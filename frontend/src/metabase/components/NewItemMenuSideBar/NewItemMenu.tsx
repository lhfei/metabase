import type { LocationDescriptor } from "history";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { t } from "ttag";

import EntityMenuItem from "metabase/components/EntityMenuItem";
import { alpha } from "metabase/lib/colors";
import { useDispatch, useSelector } from "metabase/lib/redux";
import * as Urls from "metabase/lib/urls";
import { setOpenModal } from "metabase/redux/ui";
import { getSetting } from "metabase/selectors/settings";
import type { CollectionId } from "metabase-types/api";

export interface NewItemMenuProps {
  className?: string;
  collectionId?: CollectionId;
  trigger?: ReactNode;
  triggerIcon?: string;
  triggerTooltip?: string;
  hasModels: boolean;
  hasDataAccess: boolean;
  hasNativeWrite: boolean;
  hasDatabaseWithJsonEngine: boolean;
  hasDatabaseWithActionsEnabled: boolean;
  isOpen: boolean;
  location: LocationDescriptor;
  onCloseNavbar: () => void;
  onOpenNavbar: () => void;
  onChangeLocation: (nextLocation: LocationDescriptor) => void;
}

type NewMenuItem = {
  title: string;
  icon: string;
  link?: LocationDescriptor;
  event?: string;
  action?: () => void;
  onClose?: () => void;
};

const NewItemMenu = ({
  collectionId,
  hasModels,
  hasDataAccess,
  hasNativeWrite,
  hasDatabaseWithJsonEngine,
  hasDatabaseWithActionsEnabled,
  location,
  onCloseNavbar,
  onOpenNavbar,
}: NewItemMenuProps) => {
  const dispatch = useDispatch();

  const lastUsedDatabaseId = useSelector(state =>
    getSetting(state, "last-used-native-database-id"),
  );

  const menuItems = useMemo(() => {
    const items: any[] = [];

    if (hasDataAccess) {
      items.push({
        title: t`Question`,
        icon: "insight",
        link: Urls.newQuestion({
          mode: "notebook",
          creationType: "custom_question",
          collectionId,
          cardType: "question",
        }),
        onClose: onCloseNavbar,
        hoverBgColor: alpha("brand", 0.35),
        isSelected: location?.pathname?.startsWith("/question/notebook"),
      });
    }

    if (hasNativeWrite) {
      items.push({
        title: hasDatabaseWithJsonEngine ? t`Native query` : t`SQL query`,
        icon: "sql",
        link: Urls.newQuestion({
          type: "native",
          creationType: "native_question",
          collectionId,
          cardType: "question",
          databaseId: lastUsedDatabaseId || undefined,
        }),
        onClose: onCloseNavbar,
        hoverBgColor: alpha("brand", 0.35),
        isSelected: /^\/question(?!\/[a-zA-Z]+).*$/.test(location.pathname),
      });
    }

    items.push(
      {
        title: t`Dashboard`,
        icon: "dashboard",
        action: () => dispatch(setOpenModal("dashboard")),
        hoverBgColor: alpha("brand", 0.35),
      },
      {
        title: t`Collection`,
        icon: "folder",
        action: () => dispatch(setOpenModal("collection")),
        hoverBgColor: alpha("brand", 0.35),
      },
    );

    if (hasNativeWrite) {
      const collectionQuery = collectionId
        ? `?collectionId=${collectionId}`
        : "";

      items.push({
        title: t`Model`,
        icon: "model",
        link: `/model/new${collectionQuery}`,
        onClose: onCloseNavbar,
        hoverBgColor: alpha("brand", 0.35),
        isSelected: location.pathname.startsWith("/model"),
      });
    }

    if (hasModels && hasDatabaseWithActionsEnabled && hasNativeWrite) {
      items.push({
        title: t`Action`,
        icon: "bolt",
        action: () => dispatch(setOpenModal("action")),
        hoverBgColor: alpha("brand", 0.35),
      });
    }

    if (hasDataAccess) {
      items.push({
        title: t`Metric`,
        icon: "metric",
        link: Urls.newQuestion({
          mode: "query",
          cardType: "metric",
          collectionId,
        }),
        onClose: onCloseNavbar,
        hoverBgColor: alpha("brand", 0.35),
        isSelected: location.pathname.startsWith("/metric"),
      });
    }

    return items;
  }, [
    hasDataAccess,
    hasNativeWrite,
    hasModels,
    hasDatabaseWithActionsEnabled,
    collectionId,
    onCloseNavbar,
    hasDatabaseWithJsonEngine,
    dispatch,
    lastUsedDatabaseId,
    location,
  ]);

  return (
    <ol>
      {menuItems.map(item => {
        if (!item) {
          return null;
        }

        const key = item.key ?? item.title;

        return (
          <li key={key} data-testid={item.testId}>
            <EntityMenuItem
              icon={item.icon}
              title={item.title}
              externalLink={item.externalLink}
              action={
                item.action &&
                (e => {
                  item.action(e);
                })
              }
              event={item.event}
              link={item.link}
              tooltip={item.tooltip}
              disabled={item.disabled}
              onClose={() => {
                // item?.onClose?.();
              }}
              color={item.color}
              hoverColor={item.hoverColor}
              hoverBgColor={item.hoverBgColor}
              isSelected={item.isSelected}
            />
          </li>
        );
      })}
    </ol>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default NewItemMenu;
