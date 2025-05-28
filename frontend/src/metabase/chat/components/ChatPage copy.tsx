// import { BarChart } from "metabase/visualizations/visualizations/BarChart";

import { useEffect, useRef, useState } from "react";
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

import { MemoedBarChart } from "./BarChart";

export const ChatPage = () => {
  // Reference to the container div
  const containerRef = useRef<HTMLDivElement>(null);
  // State to store the container width
  const [containerWidth, setContainerWidth] = useState(0);
  const data = [
    { name: "A", value: 12 },
    { name: "B", value: 19 },
    { name: "C", value: 7 },
    { name: "D", value: 15 },
    { name: "E", value: 15 },
    { name: "F", value: 15 },
    { name: "G", value: 15 },
    { name: "H", value: 15 },
  ];

  const lineData = [
    { name: "A", value: 10 },
    { name: "B", value: 14 },
    { name: "C", value: 8 },
    { name: "D", value: 10 },
    { name: "E", value: 15 },
    { name: "F", value: 19 },
    { name: "G", value: 20 },
    { name: "H", value: 17 },
  ];

  const fontFamily = "Lato, Arial, sans-serif";
  const fontColor = "#4C5773";
  const fontWeight = 700;
  const fontSize = 12;
  const axisLineColor = "#EEECEC";
  const barColor = "#88BF4D";
  const gridColor = "#EEECEC";

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial width
    updateWidth();

    // Add resize event listener
    window.addEventListener("resize", updateWidth);

    // Cleanup event listener on unmount
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div ref={containerRef} style={{ margin: 16 }}>
      <h2 style={{ margin: `16px 0` }}>柱状图</h2>
      <MemoedBarChart data={data} width={containerWidth} />
      {/* <div style={{ width: "100%", height: 300, background: "#fff" }}>
        <BarChart width={containerWidth} height={300} data={data}>
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
        </BarChart>
      </div> */}

      <h2 style={{ margin: `32px 0 16px 0` }}>折线图</h2>
      <div style={{ width: "100%", height: 300, background: "#fff" }}>
        <LineChart width={containerWidth} height={300} data={lineData}>
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
