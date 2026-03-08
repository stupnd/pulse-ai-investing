import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Technology", value: 45, color: "hsl(270 40% 65%)" },
  { name: "Healthcare", value: 20, color: "hsl(45 70% 60%)" },
  { name: "Finance", value: 15, color: "hsl(0 0% 70%)" },
  { name: "Energy", value: 12, color: "hsl(80 40% 55%)" },
  { name: "Other", value: 8, color: "hsl(0 0% 85%)" },
];

export function SectorDonut() {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Sector Allocation</h3>
      <div className="flex items-center gap-6">
        <div className="w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="hsl(38 30% 97%)">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-semibold ml-auto">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
