'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

const LIFT_CONFIG = {
  squat: { name: 'Squat', color: '#3b82f6' },
  bench: { name: 'Bench Press', color: '#ef4444' },
  deadlift: { name: 'Deadlift', color: '#22c55e' },
} as const;

type ChartDataPoint = {
  week: number;
  squat: number | null;
  bench: number | null;
  deadlift: number | null;
  squatPR: boolean;
  benchPR: boolean;
  deadliftPR: boolean;
};

type LiftChartProps = {
  data: ChartDataPoint[];
  liftKey: 'squat' | 'bench' | 'deadlift';
};

export function LiftChart({ data, liftKey }: LiftChartProps) {
  const config = LIFT_CONFIG[liftKey];

  const chartDataWithIndex = data.map((d) => ({
    ...d,
    index: d.week,
    [`${liftKey}PR`]: d[`${liftKey}PR` as 'squatPR' | 'benchPR' | 'deadliftPR'],
  }));

  const prPoints = chartDataWithIndex
    .filter((d) => d[`${liftKey}PR` as 'squatPR' | 'benchPR' | 'deadliftPR'])
    .map((d) => ({
      x: d.index,
      y: d[liftKey],
    }))
    .filter((p) => p.y !== null) as { x: number; y: number }[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: config.color }} />
          {config.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartDataWithIndex}
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
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Est. 1RM']}
                labelFormatter={(label) => `Week ${label}`}
              />
              <Line
                type="monotone"
                dataKey={liftKey}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls
              />
              {prPoints.map((point, i) => (
                <ReferenceDot
                  key={i}
                  x={point.x}
                  y={point.y}
                  r={6}
                  fill={config.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
