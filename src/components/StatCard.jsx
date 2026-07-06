export default function StatCard({ title, value, subtitle, icon: Icon, accentColor = '#0A2342', trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900" style={{ color: accentColor }}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '12' }}>
            <Icon size={20} style={{ color: accentColor }} />
          </div>
        )}
      </div>
      {trend != null && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400">vs. mes anterior</span>
        </div>
      )}
    </div>
  );
}