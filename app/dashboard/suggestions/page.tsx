'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Plus, 
  X, 
  Lightbulb, 
  Bug, 
  Sparkles, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  User, 
  Calendar,
  MessageCircle,
  TrendingUp,
  Zap,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import Select from '@/components/Select';

interface Suggestion {
  _id: string;
  title: string;
  content: string;
  category: 'improvement' | 'bug' | 'feature' | 'other';
  submittedByName: string;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'implemented';
  likesCount: number;
  isAnonymous: boolean;
  createdAt: string;
}

const CATEGORY_CONFIG = {
  improvement: { 
    label: 'การปรับปรุง', 
    icon: Lightbulb, 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    gradient: 'from-blue-400 to-cyan-500'
  },
  bug: { 
    label: 'บั๊ก/ข้อผิดพลาด', 
    icon: Bug, 
    color: 'bg-red-100 text-red-700 border-red-200',
    gradient: 'from-red-400 to-rose-500'
  },
  feature: { 
    label: 'ฟีเจอร์ใหม่', 
    icon: Sparkles, 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    gradient: 'from-purple-400 to-pink-500'
  },
  other: { 
    label: 'อื่นๆ', 
    icon: MoreHorizontal, 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    gradient: 'from-gray-400 to-slate-500'
  },
};

const STATUS_CONFIG = {
  pending: { 
    label: 'รอตรวจสอบ', 
    icon: AlertCircle, 
    color: 'bg-gray-100 text-gray-700 border-gray-200' 
  },
  'under-review': { 
    label: 'กำลังตรวจสอบ', 
    icon: Clock, 
    color: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  approved: { 
    label: 'อนุมัติ', 
    icon: CheckCircle2, 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  rejected: { 
    label: 'ปฏิเสธ', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-700 border-red-200' 
  },
  implemented: { 
    label: 'ดำเนินการแล้ว', 
    icon: CheckCircle2, 
    color: 'bg-purple-100 text-purple-700 border-purple-200' 
  },
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as 'improvement' | 'bug' | 'feature' | 'other',
    isAnonymous: false,
  });

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/suggestions',
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          isAnonymous: formData.isAnonymous,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('ส่งความคิดเห็นสำเร็จ');
      setFormData({
        title: '',
        content: '',
        category: 'other',
        isAnonymous: false,
      });
      setShowForm(false);
      fetchSuggestions();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถส่งความคิดเห็นได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: 'improvement', label: '💡 การปรับปรุง' },
    { value: 'bug', label: '🐛 บั๊ก/ข้อผิดพลาด' },
    { value: 'feature', label: '✨ ฟีเจอร์ใหม่' },
    { value: 'other', label: '📝 อื่นๆ' },
  ];

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-50 via-pink-50/50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-purple-600">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Feedback & Suggestions</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                ความคิดเห็น
              </h1>
              <p className="text-gray-500 mt-2">
                แบ่งปันความคิดเห็นและข้อเสนอแนะเพื่อพัฒนาระบบ
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>เสนอความคิดเห็น</span>
            </button>
          </div>

          {/* List Header */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">รายการความคิดเห็น</h2>
              {suggestions.length > 0 && (
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  {suggestions.length}
                </span>
              )}
            </div>
          </div>

          {/* Suggestions List */}
          <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden">
            {fetching ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีความคิดเห็น</h3>
                <p className="text-gray-500 mb-6">เริ่มต้นด้วยการเสนอความคิดเห็นแรก</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>เสนอความคิดเห็นแรก</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {suggestions.map((suggestion) => {
                  const categoryConfig = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.other;
                  const statusConfig = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG.pending;
                  const CategoryIcon = categoryConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={suggestion._id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Category Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-br ${categoryConfig.gradient} rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
                          <CategoryIcon className="w-6 h-6" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            {/* Left: Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{suggestion.title}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 ${categoryConfig.color}`}>
                                  {categoryConfig.label}
                                </span>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 ${statusConfig.color}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {statusConfig.label}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{suggestion.content}</p>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  {suggestion.isAnonymous ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <User className="w-4 h-4" />
                                  )}
                                  <span>{suggestion.isAnonymous ? 'ไม่ระบุชื่อ' : suggestion.submittedByName}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(suggestion.createdAt).toLocaleDateString('th-TH', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right: Likes */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                              <ThumbsUp className="w-5 h-5 text-purple-600" />
                              <span className="text-lg font-bold text-purple-700">{suggestion.likesCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setShowForm(false)}
            />
            
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-6 h-6" />
                    เสนอความคิดเห็น
                  </h2>
                  <p className="text-purple-100 text-sm mt-1">แบ่งปันไอเดียของคุณเพื่อพัฒนาระบบ</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-8 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">หัวข้อ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="กรอกหัวข้อความคิดเห็น"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">หมวดหมู่ <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: key as any })}
                            className={`px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                              formData.category === key
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">เนื้อหา <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                      rows={6}
                      placeholder="อธิบายรายละเอียดความคิดเห็นของคุณ..."
                    />
                  </div>

                  {/* Anonymous Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        formData.isAnonymous ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <span 
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          formData.isAnonymous ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-700">ไม่ระบุชื่อ</p>
                      <p className="text-xs text-gray-500">ซ่อนชื่อของคุณจากความคิดเห็นนี้</p>
                    </div>
                    {formData.isAnonymous ? (
                      <EyeOff className="w-5 h-5 text-purple-500 ml-auto" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 ml-auto" />
                    )}
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          title: '',
                          content: '',
                          category: 'other',
                          isAnonymous: false,
                        });
                      }}
                      className="flex-1 py-3"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      isLoading={loading}
                      className="flex-[2] py-3 shadow-lg shadow-purple-200"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        ส่งความคิดเห็น
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
