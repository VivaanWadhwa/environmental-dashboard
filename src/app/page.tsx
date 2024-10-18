'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

const EmissionDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const metrics = {
    "GHG Emission": {
      animal_col: "animal_GHG Emission (g) / 100g",
      plant_col: "plant_GHG Emission (g) / 100g",
      unit: "g/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Nitrogen Lost": {
      animal_col: "animal_N lost (g) / 100g",
      plant_col: "plant_N lost (g) / 100g",
      unit: "g/100g",
      color: { animal: "#ffd43b", plant: "#20c997" }
    },
    "Freshwater Withdrawals": {
      animal_col: "animal_Freshwater Withdrawals (L) / 100g",
      plant_col: "plant_Freshwater Withdrawals (L) / 100g",
      unit: "L/100g",
      color: { animal: "#ff922b", plant: "#339af0" }
    },
    "Stress-Weighted Water Use": {
      animal_col: "animal_Stress-Weighted Water Use (L) / 100g",
      plant_col: "plant_Stress-Weighted Water Use (L) / 100g",
      unit: "L/100g",
      color: { animal: "#f06595", plant: "#845ef7" }
    },
    "Land Use": {
      animal_col: "animal_Land Use (m^2) / 100g",
      plant_col: "plant_Land Use (m^2) / 100g",
      unit: "m²/100g",
      color: { animal: "#e64980", plant: "#3b5bdb" }
    }
  };

  const [selectedMetric, setSelectedMetric] = useState("GHG Emission");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/similar_recipes.csv');
        const csvText = await response.text();
        
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        const parsedData = rows.slice(1).map(row => {
          const values = row.split(',');
          const rowData = {};
          headers.forEach((header, index) => {
            const value = values[index];
            const parsedValue = parseFloat(value);
            rowData[header.trim()] = isNaN(parsedValue) ? value : parsedValue;
          });
          return rowData;
        });

        setData(parsedData);
      } catch (err) {
        setError('Error loading data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const transformDataForOverview = (rawData, metric) => {
    return rawData.map((item, index) => ({
      id: index,
      name: ``,
      animal: item[metrics[metric].animal_col],
      plant: item[metrics[metric].plant_col],
      animal_recipe: item.animal_recipe,
      plant_recipe: item.plant_recipe,
    }));
  };

  const transformDataForDetail = (recipeData) => {
    return Object.keys(metrics).map(metricName => ({
      name: metricName,
      animal: recipeData[metrics[metricName].animal_col],
      plant: recipeData[metrics[metricName].plant_col],
      unit: metrics[metricName].unit
    }));
  };

  const handleBarClick = (data) => {
    if (data && data.activePayload) {
      const recipeId = data.activePayload[0].payload.id;
      setSelectedRecipe(data.activePayload[0].payload);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold">{`Recipe ${data.id + 1}`}</p>
          <p className="text-[#ff6b6b]">{`Animal-based: ${data.animal?.toFixed(2)} ${metrics[selectedMetric].unit}`}</p>
          <p className="text-[#51cf66]">{`Plant-based: ${data.plant?.toFixed(2)} ${metrics[selectedMetric].unit}`}</p>
        </div>
      );
    }
    return null;
  };

  const DetailView = ({ recipeData }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedRecipe(null)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </button>
        <h3 className="text-xl font-semibold">Detailed Comparison</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold text-red-600 mb-2">Animal-based Recipe</h4>
            <p className="text-gray-800">{recipeData.animal_recipe}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold text-green-600 mb-2">Plant-based Recipe</h4>
            <p className="text-gray-800">{recipeData.plant_recipe}</p>
          </CardContent>
        </Card>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={transformDataForDetail(data[recipeData.id])}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip 
              formatter={(value, name, payload) => {
                const metricName = payload?.payload?.name;
                return [`${value.toFixed(2)} ${metrics[metricName].unit}`, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="animal"
              name="Animal-based"
              fill="#ff6b6b"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="plant"
              name="Plant-based"
              fill="#51cf66"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto p-6">
        <CardContent className="flex items-center justify-center h-[400px]">
          <p>Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto p-6">
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environmental Impact Comparison</CardTitle>
          {!selectedRecipe && (
            <div className="w-72">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(metrics).map((metric) => (
                    <SelectItem key={metric} value={metric}>
                      {metric}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {selectedRecipe ? (
            <DetailView recipeData={selectedRecipe} />
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transformDataForOverview(data, selectedMetric)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  onClick={handleBarClick}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: metrics[selectedMetric].unit, angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="animal"
                    name="Animal-based"
                    fill={metrics[selectedMetric].color.animal}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="plant"
                    name="Plant-based"
                    fill={metrics[selectedMetric].color.plant}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmissionDashboard;