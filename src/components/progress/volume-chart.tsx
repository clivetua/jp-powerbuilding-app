'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { VolumeChartData } from '@/lib/progress';

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#ef4444',
  Back: '#3b82f6',
  Legs: '#22c55e',
  Shoulders: '#f59e0b',
  Arms: '#8b5cf6',
  Core: '#ec4899',
  Uncategorized: '#6b7280',
};

function formatTonnage(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}t`;
  }
  return `${value}kg`;
}

function formatTonnageWithLocale(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}t`;
  }
  return `${value.toLocaleString()}kg`;
}

type VolumeChartProps = {
  data: VolumeChartData[];
};

export function VolumeChart({ data }: VolumeChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    index: d.week,
  }));

  const allMuscleGroups = new Set<string>();
  for (const d of data) {
    for (const mg of Object.keys(d.muscleGroups)) {
      allMuscleGroups.add(mg);
    }
  }
  const sortedMuscleGroups = Array.from(allMuscleGroups).sort();

  const formatTooltipTonnage = (value: number) => {
    return `${value.toLocaleString()} kg`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Weekly Tonnage by Muscle Group
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="index"
                tickFormatter={(v) => `W${v}`}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={formatTonnage}
              />
              <Tooltip
                formatter={(value) => [formatTooltipTonnage(Number(value)), 'Volume']}
                labelFormatter={(label) => `Week ${label}`}
              />
              <Legend />
              {sortedMuscleGroups.map((mg) => (
                <Bar
                  key={mg}
                  dataKey={`muscleGroups.${mg}`}
                  name={mg === 'Uncategorized' ? 'Uncategorized' : mg}
                  fill={MUSCLE_GROUP_COLORS[mg] ?? '#6b7280'}
                  stackId="volume"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

type VolumeSummaryProps = {
  data: VolumeChartData[];
};

export function VolumeSummary({ data }: VolumeSummaryProps) {
  if (data.length === 0) {
    return null;
  }

  const currentWeek = data[data.length - 1];
  const previousWeek = data.length > 1 ? data[data.length - 2] : null;

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Week Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTonnage(currentWeek.totalVolume)}</div>
          <p className="text-xs text-muted-foreground">Week {currentWeek.week}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Week-over-Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentWeek.weekOverWeek !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatPercent(currentWeek.weekOverWeek)}
              </span>
              {currentWeek.weekOverWeek >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          )}
          {previousWeek && (
            <p className="text-xs text-muted-foreground">
              vs {formatTonnage(previousWeek.totalVolume)} (W{previousWeek.week})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type MuscleGroupBreakdownProps = {
  data: VolumeChartData[];
};

export function MuscleGroupBreakdown({ data }: MuscleGroupBreakdownProps) {
  if (data.length === 0) {
    return null;
  }

  const currentWeek = data[data.length - 1];
  const muscleGroups = Object.entries(currentWeek.muscleGroups)
    .filter(([key]) => key !== 'Uncategorized')
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Muscle Group Breakdown — Week {currentWeek.week}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {muscleGroups.map(([group, volume]) => (
            <div key={group} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MUSCLE_GROUP_COLORS[group] ?? '#6b7280' }}
                />
                <span className="text-sm">{group}</span>
              </div>
              <div className="text-sm font-medium">
                {formatTonnageWithLocale(volume)}
                <span className="text-xs text-muted-foreground ml-2">
                  ({((volume / currentWeek.totalVolume) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
