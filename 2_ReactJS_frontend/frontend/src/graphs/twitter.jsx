import React, { useState, useEffect } from "react";
import { BsTwitter } from "react-icons/bs";
import { Typography, CircularProgress } from "@mui/material";
import Plot from "react-plotly.js";
import pako from "pako";
import localForage from "localforage";

function TwitterPlotHeader({ twitterData }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center" }}
      className="pt-4 pl-4"
    >
      <BsTwitter
        style={{ color: "#094183", fontSize: "30px", margin: "10px" }}
      />
      <Typography variant="h6" component="div" color="#094183">
        {twitterData.title}
      </Typography>
    </div>
  );
}

export default function TwitterPlot({ twitterData }) {
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const storedData = await localForage.getItem(twitterData.map);

        if (storedData) {
          setPlotData(storedData);
          setLoading(false);
        } else {
          const controller = new AbortController();
          const signal = controller.signal;

          const response = await fetch(
            `/twitter_data/map/${twitterData.map}.json.gz`,
            { signal },
          );

          if (!response.ok) {
            throw new Error("Error fetching data");
          }

          const compressedData = await response.arrayBuffer();
          const decompressedData = pako.inflate(compressedData, {
            to: "string",
          });
          const data = JSON.parse(decompressedData);

          // Update the map center to Melbourne
          if (data.layout && data.layout.mapbox) {
            data.layout.mapbox.center = { lat: -37.8136, lon: 144.9631 };
          } else {
            // If the mapbox property doesn't exist, create it
            data.layout = {
              ...data.layout,
              mapbox: { center: { lat: -37.8136, lon: 144.9631 } },
            };
          }

          setPlotData(data);
          setLoading(false);
          await localForage.setItem(twitterData.map, data);

          return () => {
            controller.abort();
          };
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching data:", error);
          setPlotData(null);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [twitterData]);

  return (
    <div className="bg-white h-full rounded-md p-4 w-full">
      <TwitterPlotHeader twitterData={twitterData} />
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <CircularProgress size={50} />
        </div>
      ) : plotData ? (
        <Plot
          data={plotData.data}
          layout={{
            ...plotData.layout,
            mapbox: {
              ...plotData.layout.mapbox,
              center: { lat: -37.8136, lon: 144.9631 },
              zoom: 11,
            },
          }}
          useResizeHandler
          className="w-full h-auto"
        />
      ) : (
        <p className="px-8">No plot data available.</p>
      )}
    </div>
  );
}
