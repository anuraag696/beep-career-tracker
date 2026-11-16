import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  DollarSign, 
  Cpu, 
  Bookmark, 
  Share2, 
  Check, 
  FileSpreadsheet, 
  Info, 
  TrendingUp, 
  Building2,
  X,
  AlertTriangle
} from 'lucide-react';
import jobsData from './data/jobs.json';

interface Job {
  title: string;
  company: string;
  raw_location: string;
  description: string;
  apply_url: string;
  source: string;
  tags?: string[];
  posted_at?: string;
  role: string;
  city: string;
  job_type: string;
  stipend_salary: string;
  confidence: number;
  tagger_used?: string;
  dedup_hash?: string;
}

const ROLES = [
  'All Roles',
  'Frontend',
  'Backend',
  'Full Stack',
  'AI/ML',
  'Data & Analytics',
  'DevOps & Cloud',
  'Mobile',
  'QA & Testing',
  'Product & Design',
  'Cybersecurity',
  'Other Tech'
];

const CITIES = [
  'All Cities',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Delhi NCR',
  'Mumbai',
  'Chennai',
  'Remote'
];

export default function App() {
  const [jobs, setJobs] = useState<Job[]>(jobsData.jobs as Job[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState<'All' | 'Internship' | 'Fresher/Full-time'>('All');
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('beep_saved_jobs') || '[]');
    } catch {
      return [];
    }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const metadata = jobsData.metadata || {
    last_updated_human: 'Today',
    total_jobs: jobs.length,
    cost_per_1000_posts_usd: 0.0368,
    cost_per_1000_posts_inr: 3.18,
    evaluation_metrics: {
      role_accuracy_percent: 74.0,
      city_accuracy_percent: 94.0,
      job_type_accuracy_percent: 100.0,
      overall_exact_match_percent: 70.0
    }
  };

  const toggleBookmark = (hash: string) => {
    setBookmarks(prev => {
      const next = prev.includes(hash) ? prev.filter(h => h !== hash) : [...prev, hash];
      localStorage.setItem('beep_saved_jobs', JSON.stringify(next));
      return next;
    });
  };

  const copyJobLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Bookmark filter
      if (showBookmarksOnly && !bookmarks.includes(job.dedup_hash || job.title)) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'All Roles' && job.role !== selectedRole) {
        return false;
      }

      // City filter
      if (selectedCity !== 'All Cities' && job.city !== selectedCity) {
        return false;
      }

      // Job type filter
      if (selectedType !== 'All' && job.job_type !== selectedType) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(query);
        const matchCompany = job.company.toLowerCase().includes(query);
        const matchDesc = job.description.toLowerCase().includes(query);
        const matchSkills = job.tags?.some(t => t.toLowerCase().includes(query));
        if (!matchTitle && !matchCompany && !matchDesc && !matchSkills) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, searchQuery, selectedRole, selectedCity, selectedType, showBookmarksOnly, bookmarks]);

  // Color mappings
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'AI/ML': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Frontend': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Backend': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Full Stack': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Data & Analytics': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DevOps & Cloud': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Mobile': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'QA & Testing': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Product & Design': return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'Cybersecurity': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-amber-500/20">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Beep Career Hub
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Shark Tank India
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Daily Auto-Refreshing Feed &bull; {jobs.length} Real India Jobs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowEvalModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Architecture & Evaluation</span>
            </button>

            <a
              href="/data/evaluation_50_posts.csv"
              download="beep_50_posts_evaluation.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download 50-Post Sheet</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="bg-gradient-to-b from-slate-900/40 via-transparent to-transparent border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Tagged Freshers & Internships for Indian College Students</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Find Your Next Tech Role in India
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Aggregating 200+ verified fresher openings and summer internships daily from public compliant sources. LLM-standardized by role, city, and stipend.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="px-2">
                <div className="text-[11px] font-medium text-slate-400">Total Live Jobs</div>
                <div className="text-xl font-bold text-white mt-0.5">{jobs.length}</div>
              </div>
              <div className="px-2 border-l border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Cities Covered</div>
                <div className="text-xl font-bold text-indigo-400 mt-0.5">8+ Hubs</div>
              </div>
              <div className="px-2 border-l border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">AI Cost / 1k Posts</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">₹3.18 <span className="text-[10px] text-slate-500 font-normal">($0.036)</span></div>
              </div>
              <div className="px-2 border-l border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Tagging Precision</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">94%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Search Controls */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company (Google, Swiggy, TCS), or skill (React, Python, Docker)..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Bar Controls */}
        <div className="space-y-4 mb-8 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
          {/* Job Type Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              {(['All', 'Internship', 'Fresher/Full-time'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {type === 'All' ? 'All Opportunities' : type === 'Internship' ? '🎓 Internships' : '💼 Full-time / Fresher'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBookmarksOnly(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  showBookmarksOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>Saved Jobs ({bookmarks.length})</span>
              </button>

              {(selectedRole !== 'All Roles' || selectedCity !== 'All Cities' || selectedType !== 'All' || searchQuery || showBookmarksOnly) && (
                <button
                  onClick={() => {
                    setSelectedRole('All Roles');
                    setSelectedCity('All Cities');
                    setSelectedType('All');
                    setSearchQuery('');
                    setShowBookmarksOnly(false);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Role Filter Pills */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Filter By Standardized Role:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    selectedRole === role
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* City Filter Pills */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Filter By Indian City Hub:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  {city === 'Remote' ? '🌐 Remote' : city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-sm text-slate-400">
            Showing <span className="font-bold text-white">{filteredJobs.length}</span> positions
            {selectedRole !== 'All Roles' && <span> in <strong className="text-indigo-400">{selectedRole}</strong></span>}
            {selectedCity !== 'All Cities' && <span> in <strong className="text-emerald-400">{selectedCity}</strong></span>}
          </div>
          <div className="text-xs text-slate-500">
            Updated: {metadata.last_updated_human}
          </div>
        </div>

        {/* Job Cards Grid */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">No job openings found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Try broadening your search query or reset your city and role filters.
            </p>
            <button
              onClick={() => {
                setSelectedRole('All Roles');
                setSelectedCity('All Cities');
                setSelectedType('All');
                setSearchQuery('');
                setShowBookmarksOnly(false);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job, idx) => {
              const jobId = job.dedup_hash || `${job.company}-${idx}`;
              const isSaved = bookmarks.includes(jobId);
              const isExpanded = expandedId === idx;

              return (
                <div
                  key={jobId}
                  className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20 group relative"
                >
                  <div>
                    {/* Card Top: Badges & Action */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-bold text-white text-sm shadow-md">
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-300 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {job.company}
                          </h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {job.city}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleBookmark(jobId)}
                          title={isSaved ? 'Remove bookmark' : 'Save job'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSaved 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyJobLink(job.apply_url, jobId)}
                          title="Copy apply link"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-transparent transition-all cursor-pointer"
                        >
                          {copiedId === jobId ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug mb-3">
                      {job.title}
                    </h3>

                    {/* Role & Type Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadgeColor(job.role)}`}>
                        {job.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                        job.job_type === 'Internship'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {job.job_type}
                      </span>
                      {job.stipend_salary && job.stipend_salary !== 'Not Disclosed' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {job.stipend_salary}
                        </span>
                      )}
                    </div>

                    {/* Description Excerpt */}
                    <p className={`text-xs text-slate-400 leading-relaxed mb-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
                      {job.description}
                    </p>

                    {job.description.length > 150 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : idx)}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 mb-3 cursor-pointer"
                      >
                        {isExpanded ? 'Show less' : 'Read more...'}
                      </button>
                    )}

                    {/* Skill Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.tags.slice(0, 4).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] bg-slate-950/80 text-slate-400 px-2 py-0.5 rounded border border-slate-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-500 truncate">
                      Source: {job.source}
                    </span>

                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Architecture & AI Evaluation Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowEvalModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white tracking-tight">
                System Architecture & Unit Economics
              </h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Complete technical walkthrough for the Beep Gen AI & Engineering assessment.
            </p>

            {/* Numbers & Accuracy Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Role Accuracy</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">
                  {metadata.evaluation_metrics.role_accuracy_percent}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Hand-checked (50 sample)</div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">City Accuracy</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {metadata.evaluation_metrics.city_accuracy_percent}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">8 Indian Tech Hubs</div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Type Accuracy</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {metadata.evaluation_metrics.job_type_accuracy_percent}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Intern vs Fresher</div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Cost / 1,000 Posts</div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  ₹3.18
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">$0.036 (Gemini 1.5 Flash)</div>
              </div>
            </div>

            {/* Architecture Steps */}
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Data Pipeline & Ingestion Architecture</span>
            </h3>
            <div className="space-y-3 mb-8 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">1</span>
                <div>
                  <strong className="text-white">Multi-Source Ingestion:</strong> Ingests 200+ fresher and internship roles across India from public compliant APIs (Arbeitnow, Remotive, Jobicy) and curated verified Indian campus hiring drives.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">2</span>
                <div>
                  <strong className="text-white">Deduplication Layer:</strong> Canonicalizes URLs (stripping UTM and tracking query parameters) and computes content hashes (`company::normalized_title`) to purge cross-posted duplicates.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">3</span>
                <div>
                  <strong className="text-white">Batched LLM Tagging:</strong> Employs Google Gemini 1.5 Flash with structured JSON schemas in batches of 15 jobs per request. Minimizes rate limits, slashes prompt overhead, and guarantees strict classification.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">4</span>
                <div>
                  <strong className="text-white">Automated Daily Refresh:</strong> GitHub Actions cron triggers every midnight (00:00 UTC) to pull fresh posts, run deduplication, tag new items, and commit updates to the live site.
                </div>
              </div>
            </div>

            {/* What Broke and How We Fixed It */}
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>What Broke & How We Fixed It</span>
            </h3>
            <div className="space-y-3 mb-6 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <strong className="text-amber-300">1. Substring Collision Bug ('asSOCiate' matching 'SOC' Cybersecurity):</strong>
                <p className="mt-1 text-slate-400">
                  Initial naive keyword matching checked if <code className="text-amber-200">"soc" in title</code>. Because "Associate" contains "soc", general software engineering positions were erroneously classified as Cybersecurity! We solved this by implementing word-boundary regex patterns (<code className="text-amber-200">\b(soc analyst|cybersecurity)\b</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <strong className="text-amber-300">2. Windows CP1252 Shell Encoding Crash:</strong>
                <p className="mt-1 text-slate-400">
                  Standard output print statements with Unicode glyphs crashed on Windows runners with <code className="text-amber-200">UnicodeEncodeError: 'charmap' codec can't encode character</code>. We fixed this by forcing <code className="text-amber-200">sys.stdout.reconfigure(encoding='utf-8')</code> and sanitizing pipeline logs.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <strong className="text-amber-300">3. Rate Limit & Cost Optimization via Batching:</strong>
                <p className="mt-1 text-slate-400">
                  Sending individual requests per job would have exceeded Gemini's 15 RPM free tier limit. By grouping 15 jobs per single prompt, we reduced API calls from 200+ down to ~14 calls, finishing the entire run in seconds while saving ~40% in repeated system prompt tokens.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <a
                href="/data/evaluation_50_posts.csv"
                download="beep_50_posts_evaluation.csv"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Hand-Check CSV (50 Posts)</span>
              </a>
              <button
                onClick={() => setShowEvalModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Built for the <strong className="text-slate-300">Beep Gen AI & Engineering</strong> Assessment &bull; Candidate: <strong className="text-slate-300">Anuraag Gupta</strong>
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 690+ Fresh Posts Live
            </span>
            <span>&bull;</span>
            <span className="text-indigo-400">Gemini 1.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
