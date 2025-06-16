import { memo } from "react";

import { Button, Group, Paper, Text, useMantineTheme } from "metabase/ui";

function Welcome() {
  const theme = useMantineTheme();

  return (
    <Group position="center" style={{ height: "100%" }}>
      <Paper
        radius={theme.radius.md}
        p="lg"
        withBorder
        shadow="sm"
        bg={theme.colors.gray[0]}
      >
        <Text size="lg" weight={500} mb="sm">
          欢迎来到聊天界面
        </Text>
        <Text size="sm">
          请开始你的对话。您可以使用文本或语音输入与我交流。
        </Text>
      </Paper>
    </Group>
  );
}

export const MemoedWelcome = memo(Welcome);
