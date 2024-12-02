'use client';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface Metric {
  animal_col: string;
  plant_col: string;
  animal_col_bar?: string;
  plant_col_bar?: string;
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
  const router = useRouter();

  const metrics: Metrics = {
    "GHG Emission": {
      animal_col: "animal_GHG Emission (g) / 100g",
      plant_col: "plant_GHG Emission (g) / 100g",
      animal_col_bar: "animal_GHG_Emission",
      plant_col_bar: "plant_GHG_Emission",
      unit: "g/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Nitrogen Lost": {
      animal_col: "animal_N lost (g) / 100g",
      plant_col: "plant_N lost (g) / 100g",
      animal_col_bar: "animal_N_lost",
      plant_col_bar: "plant_N_lost",
      unit: "g/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Freshwater Withdrawals": {
      animal_col: "animal_Freshwater Withdrawals (L) / 100g",
      plant_col: "plant_Freshwater Withdrawals (L) / 100g",
      animal_col_bar: "animal_Freshwater_Withdrawals",
      plant_col_bar: "plant_Freshwater_Withdrawals",
      unit: "L/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Stress-Weighted Water Use": {
      animal_col: "animal_Stress-Weighted Water Use (L) / 100g",
      plant_col: "plant_Stress-Weighted Water Use (L) / 100g",
      animal_col_bar: "animal_Stress_Weighted_Water_Use",
      plant_col_bar: "plant_Stress_Weighted_Water_Use",
      unit: "L/100g",
      color: { animal: "#ff6b6b", plant: "#51cf66" }
    },
    "Land Use": {
      animal_col: "animal_Land Use (m^2) / 100g",
      plant_col: "plant_Land Use (m^2) / 100g",
      animal_col_bar: "animal_Land_Use",
      plant_col_bar: "plant_Land_Use",
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
      try {
        setLoading(true);
        const response = await fetch('/data/similar_recipes.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            try {
              const parsedData = results.data.map((row: any) => ({
                animal_recipe: row["animal_recipe"] || '',
                animal_recipe_ID: row["animal_recipe_ID"] || '',
                plant_recipe: row["plant_recipe"] || '',
                plant_recipe_ID: row["plant_recipe_ID"] || '',
                animal_GHG_Emission: row["animal_GHG Emission (g) / 100g"] || 0,
                plant_GHG_Emission: row["plant_GHG Emission (g) / 100g"] || 0,
                animal_N_lost: row["animal_N lost (g) / 100g"] || 0,
                plant_N_lost: row["plant_N lost (g) / 100g"] || 0,
                animal_Freshwater_Withdrawals: row["animal_Freshwater Withdrawals (L) / 100g"] || 0,
                plant_Freshwater_Withdrawals: row["plant_Freshwater Withdrawals (L) / 100g"] || 0,
                animal_Stress_Weighted_Water_Use: row["animal_Stress-Weighted Water Use (L) / 100g"] || 0,
                plant_Stress_Weighted_Water_Use: row["plant_Stress-Weighted Water Use (L) / 100g"] || 0,
                animal_Land_Use: row["animal_Land Use (m^2) / 100g"] || 0,
                plant_Land_Use: row["plant_Land Use (m^2) / 100g"] || 0,
              }));
              setData(parsedData.slice(0, 25));
            } catch (error) {
              console.error('Error processing parsed data:', error);
              setError('Error processing parsed data');
            }
          },
          error: (error : any) => {
            console.error('Error parsing CSV data:', error);
            setError('Error parsing CSV data');
          },
        });
        
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
    animal: number | string;
    plant: number | string;
    animal_recipe: string;
    plant_recipe: string;
  }> => {
    console.log("rawData:");
    console.log(rawData);
  
    const ret_data = rawData.map((item, index) => {
      // Ensure valid metric keys are provided
      const animalCol = metrics[metric]?.animal_col_bar as keyof csvData;
      const plantCol = metrics[metric]?.plant_col_bar as keyof csvData;
  
      console.log("animalCol:", animalCol);
      if (!animalCol || !plantCol) {
        console.error(`Invalid metric configuration for: ${metric}`);
        return {
          id: index,
          name: "",
          animal: 0,
          plant: 0,
          animal_recipe: item.animal_recipe || "",
          plant_recipe: item.plant_recipe || "",
        };
      }
  
      // Access the data using validated column names
      const animalValue = item[animalCol];
      const plantValue = item[plantCol];
  
      if (animalValue === undefined || plantValue === undefined) {
        console.error(
          `Data missing for metric columns: ${animalCol} or ${plantCol} at index ${index}`
        );
      }
  
      return {
        id: index,
        name: "", // Customize this based on your requirements
        animal: animalValue || 0, // Use 0 if value is missing
        plant: plantValue || 0, // Use 0 if value is missing
        animal_recipe: item.animal_recipe || "",
        plant_recipe: item.plant_recipe || "",
      };
    });
  
    console.log("Transformed Data:");
    console.log(ret_data);
  
    return ret_data;
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
