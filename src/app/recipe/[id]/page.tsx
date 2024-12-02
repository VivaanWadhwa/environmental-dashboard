'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface RecipePageProps {
  params: {
    id: string;
  };
}

interface MetricData {
  metric: string;
  animal: number;
  plant: number;
  unit: string;
  animalNormalized: number;
  plantNormalized: number;
  description: string;
}

const RecipePage = ({ params }: RecipePageProps) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [radarData, setRadarData] = useState<MetricData[]>([]);

  const metricMappings = {
    "GHG Emission": {
      animal: "animal_GHG Emission (g) / 100g",
      plant: "plant_GHG Emission (g) / 100g",
      unit: "g/100g",
      description: "Greenhouse gas emissions per 100g of food"
    },
    "Nitrogen Lost": {
      animal: "animal_N lost (g) / 100g",
      plant: "plant_N lost (g) / 100g",       
      unit: "g/100g",
      description: "Nitrogen loss during production per 100g"
    },
    "Freshwater Withdrawals": {
      animal: "animal_Freshwater Withdrawals (L) / 100g",
      plant: "plant_Freshwater Withdrawals (L) / 100g",
      unit: "L/100g",
      description: "Water used in production per 100g"
    },
    "Stress-Weighted Water Use": {
      animal: "animal_Stress-Weighted Water Use (L) / 100g",
      plant: "plant_Stress-Weighted Water Use (L) / 100g",
      unit: "L/100g",
      description: "Water use weighted by local scarcity"
    },
    "Land Use": {
      animal: "animal_Land Use (m^2) / 100g",
      plant: "plant_Land Use (m^2) / 100g",
      unit: "m²/100g",
      description: "Land area required per 100g"
    }
  };

  // Normalize values between 0 and 1
  const normalizeValue = (value: number) => {
    // if (value < 1) return Math.log(1/value);
    return Math.log(value) 
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/similar_recipes.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        const recipeData = rows[parseInt(params.id) + 1].split(',');
        
        const mappedData: any = {};
        headers.forEach((header, index) => {
          const value = recipeData[index];
          mappedData[header.trim()] = isNaN(parseFloat(value)) ? value : parseFloat(value);
        });

        setData(mappedData);

        // Transform and normalize data for visualization
        const metricsData = Object.entries(metricMappings).map(([key, value]) => {
          const animalValue = mappedData[value.animal];
          const plantValue = mappedData[value.plant];

          return {
            metric: key,
            animal: animalValue,
            plant: plantValue,
            unit: value.unit,
            description: value.description,
            animalNormalized: normalizeValue(animalValue),
            plantNormalized: normalizeValue(plantValue)
          };
        });

        setRadarData(metricsData);
        
      } catch (err) {
        setError('Error loading recipe data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-white p-3 rounded shadow-lg border">
//           <p className="font-semibold">{label}</p>
//           <p className="text-red-500">
//             Animal-based: {payload[0].value.toFixed(2)} {payload[0].unit}
//           </p>
//           <p className="text-green-500">
//             Plant-based: {payload[1].value.toFixed(2)} {payload[1].unit}
//           </p>
//         </div>
//       );
//     }
//     return null;
//   };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen">{error}</div>;
  if (!data) return null;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6">
        {/* Recipe Header */}
        <Card>
          <CardHeader>
            <CardTitle>Recipe Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Animal-Based Recipe</h3>
                <p>{data.animal_recipe}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Plant-Based Alternative</h3>
                <p>{data.plant_recipe}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Normalized Metrics Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Relative Environmental Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Values are normalized to show relative impact within each metric
            </p>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 1]} />
                  <Radar
                    name="Animal-Based"
                    dataKey="animalNormalized"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Plant-Based"
                    dataKey="plantNormalized"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          {/* </CardContent>
        </Card>
        {/* <Card> */}
          {/* <CardContent> */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={radarData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="metric" type="category" />
                  {/* <Tooltip content={CustomTooltip} /> */}
                  <Legend />
                  <Bar dataKey="animalNormalized" name="Animal-Based" fill="#ef4444" />
                  <Bar dataKey="plantNormalized" name="Plant-Based" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {radarData.map((metric) => (
            <Card key={metric.metric}>
              <CardHeader>
                <CardTitle className="text-lg">{metric.metric}</CardTitle>
                <p className="text-sm text-gray-500">{metric.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-red-500">Animal-Based:</span>
                    <span className="font-mono">{metric.animal.toFixed(2)} {metric.unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-500">Plant-Based:</span>
                    <span className="font-mono">{metric.plant.toFixed(2)} {metric.unit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Reduction:</span>
                    <span className="font-mono">
                      {((metric.animal - metric.plant) / metric.animal * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipePage;