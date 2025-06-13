import styled from "@emotion/styled";

import { Icon } from "metabase/ui";

const AddButton = styled.button`
  margin-left: auto;
  margin-right: 8px;
  background: transparent;
  border: none;
  color: #1a7dd7;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
`;

type SidebarAddButtonProps = {
  icon: string;
  tooltip?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export const SidebarAddButton = ({
  icon,
  tooltip,
  onClick,
}: SidebarAddButtonProps) => (
  <AddButton onClick={onClick}>
    <Icon name={icon as any} tooltip={tooltip} />
  </AddButton>
);
