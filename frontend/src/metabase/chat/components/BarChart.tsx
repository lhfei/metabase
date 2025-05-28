import { type FC, type PropsWithChildren, memo } from "react";
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
interface IProps {
  data: any;
  width?: number;
}

const BarChart: FC<PropsWithChildren<IProps>> = props => {
  const { width, data } = props;
  const fontFamily = "Lato, Arial, sans-serif";
  const fontColor = "#4C5773";
  const fontWeight = 700;
  const fontSize = 12;
  const axisLineColor = "#EEECEC";
  const barColor = "#88BF4D";
  const gridColor = "#EEECEC";

  return (
    <div style={{ width: "100%", height: 300, background: "#fff" }}>
      <RBarChart width={width} height={300} data={data}>
        <CartesianGrid
          vertical={false}
          stroke={gridColor}
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="name"
          stroke={axisLineColor}
          tick={{
            fill: fontColor,
            fontFamily,
            fontWeight,
            fontSize,
          }}
          axisLine={{ stroke: axisLineColor }}
          tickLine={false}
        />
        <YAxis
          stroke={axisLineColor}
          tick={{
            fill: fontColor,
            fontFamily,
            fontWeight,
            fontSize,
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill={barColor} />
      </RBarChart>
    </div>
  );
};

export const MemoedBarChart = memo(BarChart);
