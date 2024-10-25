'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import useRecipeStore from '../lib/store';

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
  const [data, setData] = useRecipeStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Freshwater Withdrawals": {
      animal_col: "animal_Freshwater Withdrawals (L) / 100g",
      plant_col: "plant_Freshwater Withdrawals (L) / 100g",
      unit: "L/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Stress-Weighted Water Use": {
      animal_col: "animal_Stress-Weighted Water Use (L) / 100g",
      plant_col: "plant_Stress-Weighted Water Use (L) / 100g",
      unit: "L/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Land Use": {
      animal_col: "animal_Land Use (m^2) / 100g",
      plant_col: "plant_Land Use (m^2) / 100g",
      unit: "m²/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
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
      if (!data) {
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

        setData(parsedData.slice(0, -1));
      } catch (err) {
        setError('Error loading data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    };
    fetchData();
  }, [data, setData]);

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


  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length) {
      // setSelectedRecipe(data.activePayload[0].payload);
      router.push('/recipe/' + data.activePayload[0].payload.id);
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: [{payload : RecipeData}] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const animal_p_classname = `text-[${metrics[selectedMetric].color.animal}]`;
      const plant_p_classname = `text-[${metrics[selectedMetric].color.plant}]`;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold">{`Recipe ${data.id + 1}`}</p>
          <p className = {animal_p_classname}>{`Animal-based: ${data.animal?.toFixed(2)} ${metrics[selectedMetric].unit}`}</p>
          <p className = {plant_p_classname}>{`Plant-based: ${data.plant?.toFixed(2)} ${metrics[selectedMetric].unit}`}</p>
        </div>
      );
    }
    return null;
  };

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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmissionDashboard;
