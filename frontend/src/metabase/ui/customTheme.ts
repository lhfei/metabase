import type { MantineThemeOverride } from "@mantine/core";
import { rem } from "@mantine/core";

export const customTheme: MantineThemeOverride = {
  colors: {
    brand: ["#1677FF"], // Ant Design 默认主色
    "text-primary": ["#000000D9"], // 主文本颜色
    background: ["#F5F5F5"], // 背景颜色
    border: ["#D9D9D9"], // 边框颜色
  },
  primaryColor: "brand",
  primaryShade: 0,
  shadows: {
    sm: "0px 1px 2px rgba(0, 0, 0, 0.12)",
    md: "0px 4px 8px rgba(0, 0, 0, 0.15)",
  },
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    xl: rem(16),
  },
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(20),
    xl: rem(24),
  },
  lineHeight: "1.5",
  headings: {
    sizes: {
      h1: {
        fontSize: rem(32),
        lineHeight: rem(40),
      },
      h2: {
        fontSize: rem(28),
        lineHeight: rem(36),
      },
      h3: {
        fontSize: rem(24),
        lineHeight: rem(32),
      },
      h4: {
        fontSize: rem(20),
        lineHeight: rem(28),
      },
    },
  },
  fontFamily: "'Roboto', sans-serif",
  fontFamilyMonospace: "'Courier New', monospace",
  focusRingStyles: {
    styles: theme => ({
      outline: `${rem(2)} solid ${theme.colors.brand[0]}`,
      outlineOffset: rem(2),
    }),
  },
};
