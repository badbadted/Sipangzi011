import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import {
  Palmtree,
  MapPin,
  Calendar,
  Utensils,
  Bus,
  Home,
  Camera,
  Trash2,
  BarChart3,
  Plus,
  X,
  Check,
  User,
  Heart,
  Pencil,
  ImageIcon,
  ExternalLink
} from 'lucide-react';

// --- 和風裝飾組件 ---
const JapanesePattern = () => (
  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' fill='%23b91c1c' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  }} />
);

const CategoryIcon = ({ type }: { type: string }) => {
  switch (type) {
    case '住宿': return <Home className="w-4 h-4" />;
    case '交通': return <Bus className="w-4 h-4" />;
    case '飲食': return <Utensils className="w-4 h-4" />;
    case '景點': return <Camera className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

interface Trip {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
}

interface PostItem {
  id: string;
  tripId: string;
  category: string;
  title: string;
  location: string;
  description: string;
  imgUrl: string;
  linkUrl: string;
  votes: string[];
}

const App = () => {
  // --- 資料狀態 (Firestore 同步) ---
  const [trips, setTrips] = useState<Trip[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);

  // --- UI 狀態 ---
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [votingPostId, setVotingPostId] = useState<string | null>(null);
  const [voterName, setVoterName] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 新行程表單
  const [newTrip, setNewTrip] = useState({ name: '', location: '', startDate: '', endDate: '' });
  // 新項目表單
  const [newPost, setNewPost] = useState({ category: '住宿', title: '', location: '', description: '', imgUrl: '', linkUrl: '' });

  // --- Firestore 即時監聽 ---
  useEffect(() => {
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
      setTrips(data);
      if (data.length > 0 && !selectedTripId) {
        setSelectedTripId(data[0].id);
      }
    });
    return () => unsubTrips();
  }, []);

  useEffect(() => {
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PostItem));
      setPosts(data);
    });
    return () => unsubPosts();
  }, []);

  const currentTrip = trips.find(t => t.id === selectedTripId);
  const currentPosts = posts.filter(p => p.tripId === selectedTripId);

  // --- 排序邏輯 (依票數排序) ---
  const sortedPosts = useMemo(() => {
    return [...currentPosts].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
  }, [currentPosts]);

  // --- 邏輯操作 ---
  const handleAddTrip = async () => {
    if (!newTrip.name || !newTrip.location) return;
    try {
      const docRef = await addDoc(collection(db, 'trips'), {
        name: newTrip.name,
        location: newTrip.location,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
      });
      setSelectedTripId(docRef.id);
    } catch (err) {
      console.error('Firestore 寫入錯誤:', err);
      alert('寫入失敗，請檢查 Firestore 安全規則是否已設為允許讀寫。\n\n錯誤: ' + (err as Error).message);
    }
    setIsTripModalOpen(false);
    setNewTrip({ name: '', location: '', startDate: '', endDate: '' });
  };

  const handleDeleteTrip = async (id: string) => {
    await deleteDoc(doc(db, 'trips', id));
    // 刪除該行程下的所有討論
    const q = query(collection(db, 'posts'), where('tripId', '==', id));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => deleteDoc(doc(db, 'posts', d.id)));
    if (selectedTripId === id) setSelectedTripId(null);
  };

  const handleOpenPostModal = (postId?: string) => {
    if (postId) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setEditingPostId(postId);
        setNewPost({ category: post.category, title: post.title, location: post.location, description: post.description, imgUrl: post.imgUrl, linkUrl: post.linkUrl });
      }
    } else {
      setEditingPostId(null);
      setNewPost({ category: '住宿', title: '', location: '', description: '', imgUrl: '', linkUrl: '' });
    }
    setIsPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setEditingPostId(null);
    setNewPost({ category: '住宿', title: '', location: '', description: '', imgUrl: '', linkUrl: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    reader.onloadend = () => {
      setUploadProgress(100);
      setNewPost(prev => ({ ...prev, imgUrl: reader.result as string }));
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePost = async () => {
    if (!newPost.title) return;
    if (editingPostId) {
      await updateDoc(doc(db, 'posts', editingPostId), {
        category: newPost.category,
        title: newPost.title,
        location: newPost.location,
        description: newPost.description,
        imgUrl: newPost.imgUrl,
        linkUrl: newPost.linkUrl,
      });
    } else {
      await addDoc(collection(db, 'posts'), {
        tripId: selectedTripId,
        category: newPost.category,
        title: newPost.title,
        location: newPost.location,
        description: newPost.description,
        imgUrl: newPost.imgUrl,
        linkUrl: newPost.linkUrl,
        votes: [],
      });
    }
    handleClosePostModal();
  };

  const handleDeletePost = async (id: string) => {
    await deleteDoc(doc(db, 'posts', id));
  };

  const handleVote = async () => {
    if (!voterName || !votingPostId) return;
    const post = posts.find(p => p.id === votingPostId);
    if (post && !post.votes.includes(voterName)) {
      await updateDoc(doc(db, 'posts', votingPostId), {
        votes: arrayUnion(voterName),
      });
    }
    setIsVoteModalOpen(false);
    setVoterName('');
  };

  return (
    <div className="min-h-screen bg-[#FDF6F0] text-gray-800 font-sans relative overflow-hidden flex flex-col md:flex-row">
      <JapanesePattern />

      {/* Sidebar: 行程導航 */}
      <aside className="w-full md:w-72 bg-[#FFFBF7] border-r border-[#E8D5C4] z-10 flex flex-col shadow-sm">
        <div className="p-6 border-b border-[#E8D5C4] bg-white text-center">
          <h1 className="text-xl font-bold text-[#B91C1C] flex items-center justify-center gap-2">
            <span className="text-2xl">⛩️</span> 來去走走一下
          </h1>
          <p className="text-[10px] text-[#A19183] mt-1 tracking-widest uppercase">Travel Planner</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest">我的行程</span>
            <button onClick={() => setIsTripModalOpen(true)} className="p-1 hover:bg-[#F5EFE6] rounded-full text-[#B91C1C] transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {trips.map(trip => (
            <div key={trip.id} className="relative group">
                <button
                onClick={() => setSelectedTripId(trip.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 ${
                    selectedTripId === trip.id
                    ? 'bg-[#FFEDED] text-[#B91C1C] shadow-sm ring-1 ring-[#FFD1D1]'
                    : 'hover:bg-[#F5EFE6] text-gray-600'
                }`}
                >
                <div className={`p-2 rounded-xl ${selectedTripId === trip.id ? 'bg-white shadow-inner' : 'bg-gray-100'}`}>
                    <Palmtree className="w-4 h-4" />
                </div>
                <div className="truncate flex-1">
                    <div className="text-sm font-bold">{trip.name}</div>
                    <div className="text-[10px] opacity-60 flex items-center gap-1 mt-0.5"><MapPin className="w-2 h-2"/>{trip.location}</div>
                </div>
                </button>
                <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#F5EFE6] m-4 rounded-3xl">
          <div className="grid grid-cols-4 gap-2 text-xl justify-items-center opacity-60">
            <span>🍣</span><span>🍡</span><span>🍵</span><span>🦊</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden">
        {currentTrip ? (
          <>
            <header className="bg-white/80 backdrop-blur-md p-4 md:p-6 border-b border-[#E8D5C4] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-[#4A3E3E] flex items-center gap-2">
                  {currentTrip.name}
                  <span className="text-[10px] bg-[#E8F3E8] text-[#2D5A27] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Active</span>
                </h2>
                <div className="flex items-center gap-4 mt-1 text-xs text-[#8C7A6B] font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {currentTrip.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {currentTrip.startDate} ~ {currentTrip.endDate}</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenPostModal()}
                className="bg-[#B91C1C] text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> 新增討論
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 pb-24">
              {['住宿', '飲食', '交通', '景點'].map(cat => {
                const items = sortedPosts.filter(p => p.category === cat);
                return (
                  <section key={cat}>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-9 h-9 rounded-full bg-[#FFEDED] text-[#B91C1C] flex items-center justify-center shadow-sm border border-white">
                        <CategoryIcon type={cat} />
                      </div>
                      <h3 className="text-lg font-black text-[#4A3E3E] tracking-tight">{cat}</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#E8D5C4] to-transparent ml-2"></div>
                    </div>

                    {items.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map(post => (
                          <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[#E8D5C4] group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="h-40 bg-[#F5EFE6] relative overflow-hidden">
                              <img
                                src={post.imgUrl || `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400`}
                                alt={post.title}
                                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                              />
                              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-sm flex items-center gap-1.5 text-[#B91C1C]">
                                <Heart className="w-3 h-3 fill-current" /> {post.votes.length} 票
                              </div>
                            </div>
                            <div className="p-5">
                              <h4 className="font-bold text-lg text-[#2D2424] mb-1">{post.title}</h4>
                              <p className="text-[11px] text-[#A19183] flex items-center gap-1 mb-3">
                                <MapPin className="w-3 h-3" /> {post.location || '尚未設定地點'}
                              </p>
                              <div className="bg-[#FFFBF7] p-3 rounded-2xl border border-[#F5EFE6] mb-5 min-h-[60px]">
                                <p className="text-sm text-[#6D5D5D] leading-relaxed italic line-clamp-2">「{post.description || '暫無說明內容'}」</p>
                              </div>

                              {post.linkUrl && (
                                <a
                                  href={post.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#B91C1C] bg-[#FFEDED] px-3 py-1.5 rounded-full hover:bg-[#B91C1C] hover:text-white transition-all mb-4 w-fit"
                                >
                                  <ExternalLink className="w-3 h-3" /> 開啟連結
                                </a>
                              )}

                              <div className="flex items-center justify-between pt-4 border-t border-[#F5EFE6]">
                                <div className="flex -space-x-2">
                                  {post.votes.length > 0 ? (
                                    post.votes.slice(0, 3).map((v, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#FFEDED] flex items-center justify-center text-[10px] font-black text-[#B91C1C] shadow-sm" title={v}>
                                            {v[0]}
                                        </div>
                                    ))
                                  ) : <span className="text-[10px] text-[#A19183] italic">尚無人投票</span>}
                                  {post.votes.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-[#F5EFE6] border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                                      +{post.votes.length - 3}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenPostModal(post.id)}
                                    className="p-2 text-[#A19183] hover:text-[#B91C1C] hover:bg-[#FFEDED] rounded-full transition-all active:scale-90"
                                    title="編輯"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="p-2 text-[#A19183] hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
                                    title="刪除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setVotingPostId(post.id); setIsVoteModalOpen(true); }}
                                    className="text-[11px] font-black text-[#B91C1C] px-4 py-2 bg-[#FFEDED] rounded-full hover:bg-[#B91C1C] hover:text-white transition-all shadow-sm active:scale-90"
                                  >
                                    點我投票
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed border-[#E8D5C4] rounded-[2.5rem] text-[#A19183] text-sm bg-white/50">
                         快點擊右上角新增第一個{cat}吧！🌸
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#A19183] p-8 text-center">
            <div className="text-9xl mb-8 opacity-10 animate-pulse">💮</div>
            <h2 className="text-2xl font-black text-[#4A3E3E] mb-3 tracking-tighter">開始規劃你的日本冒險</h2>
            <p className="max-w-xs text-sm leading-relaxed mb-8">請在左側選擇一個旅程，或點擊上方「+」號建立新的探索計畫。</p>
            <button
                onClick={() => setIsTripModalOpen(true)}
                className="px-8 py-4 bg-[#B91C1C] text-white rounded-full font-black shadow-2xl shadow-red-200 flex items-center gap-3 hover:scale-105 transition-all"
            >
                <Plus className="w-6 h-6" /> 立即建立新行程
            </button>
          </div>
        )}
      </main>

      {/* --- Modal: 新增行程 --- */}
      {isTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#FFFBF7]">
              <h3 className="text-xl font-black text-[#B91C1C] flex items-center gap-2">🌸 建立新旅程</h3>
              <button onClick={() => setIsTripModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">行程名稱</label>
                <input
                  type="text"
                  className="w-full p-4 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl focus:ring-[#B91C1C] focus:border-[#B91C1C] text-sm font-bold"
                  placeholder="例如：2025 東京賞櫻趣"
                  value={newTrip.name}
                  onChange={e => setNewTrip({...newTrip, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">主要地點</label>
                <input
                  type="text"
                  className="w-full p-4 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl focus:ring-[#B91C1C] focus:border-[#B91C1C] text-sm font-bold"
                  placeholder="例如：京都 / 大阪"
                  value={newTrip.location}
                  onChange={e => setNewTrip({...newTrip, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">開始日期</label>
                  <input type="date" className="w-full p-3 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl text-xs font-bold" value={newTrip.startDate} onChange={e => setNewTrip({...newTrip, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">結束日期</label>
                  <input type="date" className="w-full p-3 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl text-xs font-bold" value={newTrip.endDate} onChange={e => setNewTrip({...newTrip, endDate: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50 flex gap-4">
              <button onClick={() => setIsTripModalOpen(false)} className="flex-1 py-4 text-[#A19183] font-bold text-sm">取消</button>
              <button onClick={handleAddTrip} className="flex-1 py-4 bg-[#B91C1C] text-white rounded-2xl font-black shadow-xl shadow-red-100">確認建立</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal: 新增 / 編輯討論項目 --- */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#FFFBF7]">
              <h3 className="text-xl font-black text-[#B91C1C] flex items-center gap-2">
                {editingPostId ? '✏️ 編輯建議項目' : '🎐 新增建議項目'}
              </h3>
              <button onClick={handleClosePostModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">分類</label>
                <div className="grid grid-cols-4 gap-3">
                  {['住宿', '飲食', '交通', '景點'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewPost({...newPost, category: cat})}
                      className={`py-3 rounded-2xl text-[11px] font-black border-2 transition-all ${newPost.category === cat ? 'bg-[#B91C1C] text-white border-[#B91C1C] shadow-lg shadow-red-100' : 'bg-white text-[#A19183] border-[#F5EFE6]'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">項目名稱</label>
                <input type="text" className="w-full p-4 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl text-sm font-bold" placeholder="輸入景點或餐廳名稱" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">具體地點</label>
                <input type="text" className="w-full p-4 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl text-sm font-bold" placeholder="地標或街道地址" value={newPost.location} onChange={e => setNewPost({...newPost, location: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">推薦說明</label>
                <textarea className="w-full p-4 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl text-sm font-bold" rows={3} placeholder="為什麼推薦這裡？" value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-3">上傳圖片 (可選)</label>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E8D5C4] rounded-2xl bg-[#FFFBF7] hover:bg-[#F5EFE6] transition-colors overflow-hidden ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-[#A19183] w-full px-6">
                      <div className="w-8 h-8 border-3 border-[#E8D5C4] border-t-[#B91C1C] rounded-full animate-spin"></div>
                      <span className="text-xs font-bold">上傳中 {uploadProgress}%</span>
                      <div className="w-full bg-[#E8D5C4] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#B91C1C] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : newPost.imgUrl ? (
                    <img src={newPost.imgUrl} alt="預覽" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#A19183]">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-bold">點擊選擇圖片</span>
                      <span className="text-[10px]">支援 JPG、PNG、WebP</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                {newPost.imgUrl && (
                  <button onClick={() => setNewPost({...newPost, imgUrl: ''})} className="mt-2 text-[10px] text-red-400 hover:text-red-600 font-bold">移除圖片</button>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-[#A19183] uppercase tracking-widest block mb-2">相關連結 (可選)</label>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#A19183] flex-shrink-0" />
                  <input type="text" className="w-full p-4 border-[#E8D5C4] bg-[#FFFBF7] rounded-2xl text-sm font-bold" placeholder="https://... 貼上官網或地圖連結" value={newPost.linkUrl} onChange={e => setNewPost({...newPost, linkUrl: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50 flex gap-4">
              <button onClick={handleClosePostModal} className="flex-1 py-4 text-[#A19183] font-bold text-sm">取消</button>
              <button onClick={handleSavePost} className="flex-1 py-4 bg-[#B91C1C] text-white rounded-2xl font-black shadow-xl shadow-red-100">
                {editingPostId ? '儲存變更' : '發布建議'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal: 記名投票 --- */}
      {isVoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xs shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-center font-black text-xl mb-4 text-[#2D2424]">🗳️ 誰在投票？</h3>
            <p className="text-center text-xs text-[#A19183] mb-8 font-medium italic">請輸入您的姓名以進行記名投票</p>
            <input
              autoFocus
              type="text"
              className="w-full border-2 border-[#FFEDED] bg-[#FFFBF7] rounded-2xl text-center font-black text-xl focus:ring-[#B91C1C] focus:border-[#B91C1C] mb-8 p-4"
              placeholder="您的稱呼"
              value={voterName}
              onChange={e => setVoterName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVote()}
            />
            <div className="flex flex-col gap-3">
              <button onClick={handleVote} className="w-full py-4 bg-[#B91C1C] text-white rounded-2xl font-black text-sm shadow-xl shadow-red-100 active:scale-95 transition-all">投下神聖一票</button>
              <button onClick={() => { setIsVoteModalOpen(false); setVoterName(''); }} className="w-full py-2 text-[#A19183] font-bold text-xs">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 底部裝飾 */}
      <div className="fixed bottom-6 right-6 pointer-events-none hidden md:block">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur px-4 py-2 rounded-full border border-[#E8D5C4] shadow-lg">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-sm shadow-red-400"></div>
          <span className="text-[10px] font-black text-[#4A3E3E] tracking-widest uppercase">Traveler Edition v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default App;
