import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

const mockAreas = [
  { name: 'Area 1', value: 95, fullName: 'Area 1: Philosophy & Objectives' },
  { name: 'Area 2', value: 82, fullName: 'Area 2: Faculty' },
  { name: 'Area 3', value: 78, fullName: 'Area 3: Instruction' },
  { name: 'Area 4', value: 100, fullName: 'Area 4: Library' },
  { name: 'Area 5', value: 65, fullName: 'Area 5: Laboratories' },
  { name: 'Area 6', value: 90, fullName: 'Area 6: Physical Plant' },
  { name: 'Area 7', value: 88, fullName: 'Area 7: Student Services' },
  { name: 'Area 8', value: 92, fullName: 'Area 8: Administration' },
]

export function ComplianceOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockAreas}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
                        <p className="text-xs font-medium text-slate-700">{payload[0].payload.fullName}</p>
                        <p className="text-sm font-bold text-blue-600 mt-0.5">{payload[0].value}% complete</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {mockAreas.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.value >= 90 ? "#10B981" : entry.value >= 70 ? "#3B82F6" : entry.value >= 50 ? "#F59E0B" : "#EF4444"}
                  />
                ))}
                <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fill: "#64748B", fontWeight: 500 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

