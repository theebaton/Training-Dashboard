import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { rawCsvData } from './data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  BookOpen, Users, MonitorPlay, MapPin, Calendar, Search, Filter 
} from 'lucide-react';

interface Course {
  category: string;
  code: string;
  name: string;
  instructor: string;
  assistant: string;
  dateStr: string;
  time: string;
  mode: string;
  date: Date | null;
  monthYear: string;
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  // Parse and process data
  const data = useMemo(() => {
    const parsed = Papa.parse(rawCsvData, { header: true, skipEmptyLines: true });
    
    return parsed.data.map((row: any) => {
      const dateStr = row['ว ด ป'] || '';
      let date = null;
      let monthYear = 'Unknown';
      
      if (dateStr) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Format is DD/MM/YYYY
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          date = new Date(year, month, day);
          
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          monthYear = `${monthNames[month]} ${year}`;
        }
      }

      return {
        category: row['ประเ-ภทหลักสูตร'] || 'ทั่วไป',
        code: row['รหัสหลักสูตร'] || '',
        name: row['ชื่อหลักสูตร'] || '',
        instructor: row['วิทยากร'] || '',
        assistant: row['ผู้ช่วยวิทยากร'] || '',
        dateStr: dateStr,
        time: row['เวลา '] || '',
        mode: row['ออนไลน์/ออนไซต์'] || 'ไม่ระบุ',
        date,
        monthYear
      } as Course;
    }).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = filterMode === 'All' || course.mode.includes(filterMode);
      return matchesSearch && matchesMode;
    });
  }, [data, searchTerm, filterMode]);

  // Summary Statistics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const online = filteredData.filter(c => c.mode.includes('ออนไลน์')).length;
    const onsite = filteredData.filter(c => c.mode.includes('ออนไซต์')).length;
    
    const uniqueInstructors = new Set(filteredData.map(c => c.instructor).filter(Boolean)).size;

    return { total, online, onsite, uniqueInstructors };
  }, [filteredData]);

  // Chart Data: Courses by Month
  const coursesByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(course => {
      if (course.monthYear !== 'Unknown') {
        counts[course.monthYear] = (counts[course.monthYear] || 0) + 1;
      }
    });
    
    // Sort chronologically based on the first occurrence in the sorted data
    const uniqueMonths = Array.from(new Set(filteredData.filter(c => c.monthYear !== 'Unknown').map(c => c.monthYear)));
    
    return uniqueMonths.map((month: string) => ({
      name: month,
      Courses: counts[month]
    }));
  }, [filteredData]);

  // Chart Data: Online vs Onsite
  const modeData = useMemo(() => {
    return [
      { name: 'Online', value: stats.online },
      { name: 'Onsite', value: stats.onsite },
      { name: 'Unspecified', value: stats.total - stats.online - stats.onsite }
    ].filter(d => d.value > 0);
  }, [stats]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Training Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of upcoming courses and workshops</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select 
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none w-full sm:w-auto"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="All">All Modes</option>
                <option value="ออนไลน์">Online</option>
                <option value="ออนไซต์">Onsite</option>
              </select>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Courses" 
            value={stats.total} 
            icon={<BookOpen className="w-5 h-5 text-indigo-600" />} 
            trend="+12% from last year"
          />
          <StatCard 
            title="Online Sessions" 
            value={stats.online} 
            icon={<MonitorPlay className="w-5 h-5 text-emerald-600" />} 
            trend="Most popular format"
          />
          <StatCard 
            title="Onsite Sessions" 
            value={stats.onsite} 
            icon={<MapPin className="w-5 h-5 text-amber-600" />} 
            trend="In-person training"
          />
          <StatCard 
            title="Unique Instructors" 
            value={stats.uniqueInstructors} 
            icon={<Users className="w-5 h-5 text-sky-600" />} 
            trend="Expert speakers"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6">Courses by Month</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coursesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Courses" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Delivery Mode</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold">Course Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Course Name</th>
                  <th className="px-6 py-4 font-medium">Instructor</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((course, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 line-clamp-2">{course.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{course.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700">{course.instructor.split('/')[0].trim() || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course.dateStr || '-'}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 ml-5">{course.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.mode.includes('ออนไลน์') 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : course.mode.includes('ออนไซต์')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/50'
                        }`}>
                          {course.mode || 'ไม่ระบุ'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{course.category}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No courses found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number | string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-500">{trend}</div>
    </div>
  );
}
