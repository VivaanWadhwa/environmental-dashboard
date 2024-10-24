'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Head from 'next/head';

interface Metric {
  animal_col: string;
  plant_col: string;
  unit: string;
  color: { animal: string; plant: string };
}
interface Metrics {
  [key: string]: Metric;
}

interface RecipeData {
  id: number;
  name: string;
  animal: number;
  plant: number;
  animal_recipe: string;
  plant_recipe: string;
}

interface csvData {
  animal_recipe: string,
  animal_recipe_ID: string,
  plant_recipe: string,
  plant_recipe_ID:  string,
  animal_GHG_Emission: number;
  plant_GHG_Emission: number;
  animal_N_lost: number;
  plant_N_lost: number;
  animal_Freshwater_Withdrawals: number;
  plant_Freshwater_Withdrawals: number;
  animal_Stress_Weighted_Water_Use: number;
  plant_Stress_Weighted_Water_Use: number;
  animal_Land_Use: number;
  plant_Land_Use: number;
}

const EmissionDashboard = () => {
  const [data, setData] = useState<csvData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeData>();

  const metrics: Metrics = {
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

  const [selectedMetric, setSelectedMetric] = useState<string>("GHG Emission");

  const metricDescriptions: { [key: string]: string } = {
    "GHG Emission": "Greenhouse gas (GHG) emissions contribute to climate change. Here, you can compare the GHG emissions of animal-based and plant-based recipes, helping you understand more environmentally friendly choices.",
    "Nitrogen Lost": "Nitrogen loss can negatively impact ecosystems and water quality. Compare the nitrogen lost during the production of animal-based and plant-based foods.",
    "Freshwater Withdrawals": "Freshwater withdrawal measures the amount of water used in food production. Use this data to understand the water demands of different diets.",
    "Stress-Weighted Water Use": "Stress-weighted water use accounts for water use in areas of water scarcity, reflecting the pressure on local water resources.",
    "Land Use": "Land use indicates how much land is required to produce a given food item. Reducing land use is critical for preserving natural habitats and biodiversity."
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/similar_recipes.csv');
        const csvText = await response.text();
        
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        const parsedData: csvData[] = rows.slice(1).map(row => {
          const values = row.split(',');
          const rowData: csvData = {
            animal_recipe: '',
            animal_recipe_ID: '',
            plant_recipe: '',
            plant_recipe_ID: '',
            animal_GHG_Emission: 0,
            plant_GHG_Emission: 0,
            animal_N_lost: 0,
            plant_N_lost: 0,
            animal_Freshwater_Withdrawals: 0,
            plant_Freshwater_Withdrawals: 0,
            animal_Stress_Weighted_Water_Use: 0,
            plant_Stress_Weighted_Water_Use: 0,
            animal_Land_Use: 0,
            plant_Land_Use: 0,
          };
          headers.forEach((header, index) => {
            const value = values[index];
            const parsedValue = parseFloat(value);
            (rowData[header.trim() as keyof csvData] as unknown) = isNaN(parsedValue) ? value : parsedValue;
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

  const transformDataForOverview = (
    rawData: csvData[],
    metric: keyof Metrics
  ): Array<{
    id: number;
    name: string;
    animal: number;
    plant: number;
    animal_recipe: string;
    plant_recipe: string;
  }> => {
    return rawData.map((item, index) => ({
      id: index,
      name: '', // You can set this value based on your requirements
      animal: parseFloat(item[metrics[metric].animal_col as keyof csvData] as unknown as string),
      plant: parseFloat(item[metrics[metric].plant_col as keyof csvData] as unknown as string),
      animal_recipe: item.animal_recipe,
      plant_recipe: item.plant_recipe,
    }));
  };
  

  const transformDataForDetail = (recipeData: csvData) => {
    return Object.keys(metrics).map(metricName => ({
      name: metricName,
      animal: recipeData[metrics[metricName as keyof Metrics].animal_col as keyof csvData],
      plant: recipeData[metrics[metricName as keyof Metrics].plant_col as keyof csvData],
      unit: metrics[metricName].unit
    }));
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length) {
      setSelectedRecipe(data.activePayload[0].payload);
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: [{payload : RecipeData}] }) => {
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

  const DetailView = ({ recipeData }: { recipeData: RecipeData }) => (
    <div className="space-y-6">
      <Head>
        <title>Recipe Comparison - {recipeData.animal_recipe} vs {recipeData.plant_recipe}</title>
      </Head>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedRecipe(undefined)}
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
                return [typeof value === 'number' ? `${value.toFixed(2)} ${metrics[metricName].unit}` : value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="animal"
              name="Animal-based"
              fill= {metrics[selectedMetric].color.animal}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="plant"
              name="Plant-based"
              fill={metrics[selectedMetric].color.plant}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <Card className="h-full w-full">
      <title>Emissions Dashboard</title>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Emissions Dashboard</h2>
            <p className="text-gray-500">Explore the emissions data of different recipes.</p>
          </div>
          <Select onValueChange={setSelectedMetric} defaultValue={selectedMetric}>
            <SelectTrigger>
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(metrics).map(metricName => (
                <SelectItem key={metricName} value={metricName}>{metricName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <div>
            {selectedRecipe ? (
              <DetailView recipeData={selectedRecipe} />
            ) : (
              <div>
                <p className="text-center mb-4">
                  Hover over the chart to explore emissions data by recipe type.
                </p>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transformDataForOverview(data, selectedMetric)} onClick={handleBarClick}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="animal" fill={metrics[selectedMetric].color.animal} />
                      <Bar dataKey="plant" fill={metrics[selectedMetric].color.plant} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {metricDescriptions[selectedMetric]}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmissionDashboard;
