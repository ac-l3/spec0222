export default function MetricBar({ label, value }) {
  // value is now an object with { score, analysis }
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-[#C0C2C5]">{label}</span>
        <span className="text-[#C0C2C5]">{value.score}/5</span>
      </div>
      <div className="h-2 bg-[#333333] relative">
        <div 
          className="h-full bg-[#C8FA1A]" 
          style={{ width: `${(value.score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
} 