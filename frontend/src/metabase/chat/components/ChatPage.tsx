// import { BarChart } from "metabase/visualizations/visualizations/BarChart";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const ChatPage = () => {
  const data = [
    { name: "A", value: 12 },
    { name: "B", value: 19 },
    { name: "C", value: 7 },
    { name: "D", value: 15 },
  ];

  const lineData = [
    { name: "A", value: 10 },
    { name: "B", value: 14 },
    { name: "C", value: 8 },
    { name: "D", value: 20 },
  ];

  const fontFamily = "Lato, Arial, sans-serif";
  const fontColor = "#4C5773";
  const fontWeight = 700;
  const fontSize = 12;
  const axisLineColor = "#EEECEC";
  const barColor = "#88BF4D";
  const gridColor = "#EEECEC";

  return (
    <div style={{ margin: 16 }}>
      <h2 style={{ margin: `16px 0` }}>柱状图</h2>
      <div style={{ width: 800, height: 300, background: "#fff" }}>
        <BarChart width={800} height={300} data={data}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
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
        </BarChart>
      </div>

      <h2 style={{ margin: `32px 0 16px 0` }}>折线图</h2>
      <div style={{ width: 800, height: 300, background: "#fff" }}>
        <LineChart width={800} height={300} data={lineData}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
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
            // 分割线虚线
            tickMargin={10}
          />
          <Tooltip />
          <Legend />
          <Line
            type="linear"
            dataKey="value"
            stroke="#88BF4D"
            strokeWidth={2}
            dot={{
              r: 6,
              stroke: "#88BF4D",
              strokeWidth: 2,
              fill: "#fff",
              fillOpacity: 1,
            }}
            activeDot={{
              r: 7,
              stroke: "#88BF4D",
              strokeWidth: 2,
              fill: "#fff",
              fillOpacity: 1,
            }}
            opacity={1}
            connectNulls
          />
        </LineChart>
      </div>
    </div>
  );
};
