'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import {
  Search,
  MapPin,
  Utensils,
  ThumbsUp,
  MessageSquare,
  Share2,
  Heart,
  Calendar,
  ChevronRight,
  Star,
  Award,
  Phone,
  Mail,
  Clock,
  Sparkles,
  TrendingUp,
  X,
  CheckCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';

// --- Types & Interfaces ---
interface District {
  name: string;
  postCount: number;
}

interface CulinaryEvent {
  id: number;
  title: string;
  date: string;
  time?: string;
  location: string;
  tag: string;
  imageUrl: string;
}

interface ReviewPost {
  id: number;
  author: {
    name: string;
    avatar: string;
    level: string;
  };
  rating: number;
  location: string;
  timestamp: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  commentsCount: number;
  restaurantName: string;
  tags: string[];
}

interface TrendingHashtag {
  tag: string;
  count: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  avatar: string;
  isTop?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  location: string;
  distance: string;
  categories: string[];
  imageUrl: string;
  badge?: 'Mới' | 'Ưu đãi' | 'Đặt nhiều';
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  
  // --- Search & Filter States ---
  const [searchText, setSearchText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả khu vực');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả loại hình');
  const [sortBy, setSortBy] = useState('Sắp xếp');
  
  // --- Active Tab for Reviews ---
  const [activeReviewTab, setActiveReviewTab] = useState<'latest' | 'popular'>('latest');
  const [activeHashtagFilter, setActiveHashtagFilter] = useState<string | null>(null);

  // --- Show More State for Review Cards ---
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  // --- Booking Modal State ---
  const [bookingRestaurant, setBookingRestaurant] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '18:30',
    guests: 2,
    notes: ''
  });
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  // --- Like/Wishlist States (Interactive UI) ---
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});
  const [reviewLikeCounts, setReviewLikeCounts] = useState<Record<number, number>>({});
  const [wishlistedRestaurants, setWishlistedRestaurants] = useState<Record<string, boolean>>({});

  // --- Mock Databases ---
  const districts: District[] = [
    { name: 'Quận Hoàn Kiếm', postCount: 18 },
    { name: 'Quận Cầu Giấy', postCount: 14 },
    { name: 'Quận Tây Hồ', postCount: 12 },
    { name: 'Quận Đống Đa', postCount: 9 },
    { name: 'Quận Hai Bà Trưng', postCount: 7 }
  ];

  const culinaryEvents: CulinaryEvent[] = [
    {
      id: 1,
      title: 'Lễ hội Tinh hoa Ẩm thực Đường phố',
      date: '28/06 - 30/06/2026',
      time: '16:00 - 22:00',
      location: 'Phố đi bộ Hồ Gươm, Hoàn Kiếm',
      tag: 'Festival',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 2,
      title: 'Đêm nhạc Acoustic & Fine Wine Tasting',
      date: 'Thứ 7 tuần này',
      time: '19:30 - 22:30',
      location: 'Skyline Lounge, Cầu Giấy',
      tag: 'Fine Dining',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 3,
      title: 'Masterclass: Nghệ thuật làm Sushi truyền thống',
      date: '05/07/2026',
      time: '09:00 - 12:00',
      location: 'The Én Restaurant, Hoàn Kiếm',
      tag: 'Workshop',
      imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const reviewPosts: ReviewPost[] = [
    {
      id: 1,
      author: {
        name: 'Nguyễn Minh Anh',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        level: 'Thành viên Vàng'
      },
      rating: 4.9,
      location: 'Quận Tây Hồ, Hà Nội',
      timestamp: '2 giờ trước',
      title: 'Trải nghiệm ẩm thực thuần Việt tinh tế tại Tầm Vị',
      description: 'Không gian ở Tầm Vị thực sự mang lại cảm giác hoài cổ vô cùng ấm áp, gợi nhớ về những ngôi nhà cổ Hà Nội xưa. Các món ăn được bày biện và chế biến vô cùng tỉ mỉ, chuẩn hương vị cơm nhà Bắc Bộ nhưng được nâng tầm lên đẳng cấp Fine Dining. Nhất định các bạn phải thử món thịt kho quẹt đậm đà ăn kèm rau củ luộc và canh cua mồng tơi ngọt lịm mát rượi nhé!',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
      likes: 42,
      commentsCount: 15,
      restaurantName: 'Tầm Vị Restaurant',
      tags: ['#MonVietAmCung', '#FineDiningHanoi']
    },
    {
      id: 2,
      author: {
        name: 'Trần Thanh Sơn',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        level: 'Ẩm thực Gia'
      },
      rating: 4.7,
      location: 'Quận Cầu Giấy, Hà Nội',
      timestamp: '1 ngày trước',
      title: 'Skyline Lounge - View ngắm trọn hoàng hôn Hà Nội cực chill',
      description: 'Nếu bạn đang tìm kiếm một địa điểm hẹn hò lãng mạn lộng gió vào buổi chiều tối thì đây chắc chắn là lựa chọn số một tại Cầu Giấy. Cocktails ở đây pha chế rất sáng tạo, nhạc deep house nhẹ nhàng thư giãn và view ngắm thành phố từ trên tầng cao thực sự đắt giá. Menu đồ ăn nhẹ cũng phong phú, đặc biệt món bò nướng đá nóng ăn rất mềm vị đậm đà.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
      likes: 35,
      commentsCount: 8,
      restaurantName: 'Skyline Lounge',
      tags: ['#SkylineCocktails', '#HenHoLangMan']
    },
    {
      id: 3,
      author: {
        name: 'Lê Thuỳ Trang',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
        level: 'Chuyên gia Review'
      },
      rating: 4.8,
      location: 'Quận Hoàn Kiếm, Hà Nội',
      timestamp: '3 ngày trước',
      title: 'Hương vị biển cả tươi rói giữa lòng phố cổ tại The Én',
      description: 'The Én mang đến phong cách ẩm thực Á Âu kết hợp hải sản vô cùng mới mẻ. Đĩa tôm hùm đút lò phô mai béo ngậy thơm nức mũi, thịt tôm dai giòn ngọt lịm. Nhân viên siêu thân thiện và nhiệt tình, không gian sang trọng rất thích hợp tiếp khách hoặc họp mặt gia đình cuối tuần.',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
      likes: 29,
      commentsCount: 11,
      restaurantName: 'The Én Restaurant',
      tags: ['#FineDiningHanoi', '#MonVietAmCung']
    }
  ];

  const trendingHashtags: TrendingHashtag[] = [
    { tag: '#MonVietAmCung', count: '124 bài' },
    { tag: '#SkylineCocktails', count: '89 bài' },
    { tag: '#FineDiningHanoi', count: '76 bài' },
    { tag: '#AmThucDuongPho', count: '62 bài' },
    { tag: '#HenHoLangMan', count: '45 bài' }
  ];

  const leaderboardUsers: LeaderboardUser[] = [
    { rank: 1, name: 'Lê Hải Nam', points: 1240, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', isTop: true },
    { rank: 2, name: 'Hoàng Minh Lan', points: 950, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100' },
    { rank: 3, name: 'Phạm Minh Quốc', points: 820, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
    { rank: 4, name: 'Nguyễn Kiều Trang', points: 760, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' }
  ];

  const restaurants: Restaurant[] = [
    {
      id: 'r1',
      name: 'The Én Restaurant',
      rating: 4.8,
      reviewsCount: 128,
      location: 'Hoàn Kiếm, Hà Nội',
      distance: '0.8 km',
      categories: ['Hải sản', 'Á Âu', 'Sang trọng'],
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400',
      badge: 'Mới'
    },
    {
      id: 'r2',
      name: 'Skyline Lounge',
      rating: 4.7,
      reviewsCount: 96,
      location: 'Cầu Giấy, Hà Nội',
      distance: '2.1 km',
      categories: ['Bar', 'Cocktail', 'View đẹp'],
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
      badge: 'Ưu đãi'
    },
    {
      id: 'r3',
      name: 'Cục Gạch Quán',
      rating: 4.6,
      reviewsCount: 64,
      location: 'Đống Đa, Hà Nội',
      distance: '2.3 km',
      categories: ['Món Việt', 'Mộc mạc', 'Ấm cúng'],
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
      badge: 'Mới'
    },
    {
      id: 'r4',
      name: 'Tầm Vị Restaurant',
      rating: 4.9,
      reviewsCount: 112,
      location: 'Tây Hồ, Hà Nội',
      distance: '3.4 km',
      categories: ['Fine Dining', 'Món Việt', 'Cổ điển'],
      imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=400',
      badge: 'Ưu đãi'
    }
  ];

  // --- Filtering Logic ---
  const filteredReviewPosts = useMemo(() => {
    let posts = [...reviewPosts];

    // Filter by Search text in post title or content
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.restaurantName.toLowerCase().includes(q)
      );
    }

    // Filter by District
    if (selectedDistrict !== 'Tất cả khu vực') {
      posts = posts.filter(p => p.location.includes(selectedDistrict));
    }

    // Filter by Cuisine/Category Type
    if (selectedCuisine !== 'Tất cả loại hình') {
      const typeMap: Record<string, string> = {
        'Fine Dining': 'Fine Dining',
        'Món Việt': 'Món Việt',
        'Lounge & Cocktail': 'Lounge',
        'Hải sản': 'Hải sản'
      };
      const searchTag = typeMap[selectedCuisine];
      if (searchTag) {
        posts = posts.filter(p => p.tags.some(t => t.toLowerCase().includes(searchTag.toLowerCase())) || p.restaurantName.toLowerCase().includes(searchTag.toLowerCase()));
      }
    }

    // Filter by Hashtag Clicked
    if (activeHashtagFilter) {
      posts = posts.filter(p => p.tags.includes(activeHashtagFilter));
    }

    // Sort by Likes (Popular) vs Latest
    if (activeReviewTab === 'popular') {
      posts.sort((a, b) => b.likes - a.likes);
    }

    return posts;
  }, [searchText, selectedDistrict, selectedCuisine, activeHashtagFilter, activeReviewTab]);

  // --- Toggle Show More ---
  const toggleExpand = (id: number) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // --- Handle Click Like Review ---
  const handleLikeReview = (id: number) => {
    const isLiked = likedReviews[id];
    setLikedReviews(prev => ({ ...prev, [id]: !isLiked }));
    setReviewLikeCounts(prev => ({
      ...prev,
      [id]: (prev[id] ?? reviewPosts.find(p => p.id === id)?.likes ?? 0) + (isLiked ? -1 : 1)
    }));
    if (!isLiked) {
      toast.success('Đã thêm bài viết vào danh sách yêu thích!');
    }
  };

  // --- Handle Toggle Wishlist Restaurant ---
  const handleToggleWishlist = (id: string) => {
    const isAdded = wishlistedRestaurants[id];
    setWishlistedRestaurants(prev => ({ ...prev, [id]: !isAdded }));
    toast.success(isAdded ? 'Đã xóa khỏi danh sách lưu trữ' : 'Đã thêm vào mục lưu trữ của bạn!');
  };

  // --- Open Booking Modal ---
  const handleOpenBooking = (restaurantName: string) => {
    setBookingRestaurant(restaurantName);
    setBookingForm({
      name: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      time: '18:30',
      guests: 2,
      notes: ''
    });
    setIsBookedSuccess(false);
  };

  // --- Submit Booking ---
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }
    if (!bookingForm.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    
    // Simulate API call to save booking
    setIsBookedSuccess(true);
    toast.success(`Đặt bàn thành công tại ${bookingRestaurant}!`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* 1. STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white/85 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RMS
            </span>
          </Link>

          {/* Nav Items - Pill shaped */}
          <nav className="hidden md:flex items-center gap-1.5 bg-blue-50/50 p-1 rounded-full border border-blue-100/50">
            <button 
              onClick={() => {
                setActiveHashtagFilter(null);
                const section = document.getElementById('search-section');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              Khám phá
            </button>
            <button 
              onClick={() => {
                const section = document.getElementById('review-feed-section');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              Diễn đàn Review
            </button>
            <button 
              onClick={() => {
                const section = document.getElementById('events-widget');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              Sự kiện & Ưu đãi
            </button>
            <a 
              href="#footer"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              Về chúng tôi
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {/* Nút dẫn vào phần mềm quản lý nhà hàng */}
            <Link 
              href="/dashboard" 
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/40 hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:scale-102 hover:shadow"
            >
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span>Hệ thống Quản lý</span>
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <div className="h-6.5 w-6.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-blue-800 hidden sm:inline max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <Link 
                  href="/dashboard" 
                  className="hidden sm:inline-flex items-center justify-center rounded-lg bg-slate-105 hover:bg-slate-200 text-slate-800 px-4 py-2 text-sm font-medium transition"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={logout} 
                  className="rounded-lg text-slate-500 hover:text-rose-600 p-2 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link 
                  href="/customer-portal" 
                  className="rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white px-5 py-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-102 hover:brightness-105 active:scale-98 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HEADER SEARCH SECTION */}
      <section id="search-section" className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-indigo-50/30 to-[#F8FAFC] pt-16 pb-14">
        {/* Background design accents */}
        <div className="absolute top-[-20%] left-[-10%] h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute bottom-10 right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 text-center relative z-10 space-y-8">
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
            <span>Nền tảng tìm kiếm ẩm thực hàng đầu của bạn</span>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent">
              Khám phá & Đặt bàn tại những nhà hàng tuyệt vời
            </h1>
            <p className="text-base text-slate-500 sm:text-lg max-w-2xl mx-auto">
              Tìm kiếm nhà hàng yêu thích, xem thông tin chi tiết, thực đơn và đặt bàn nhanh chóng, dễ dàng.
            </p>
          </div>

                    {/* Floating Search Container - Redesigned to be perfectly balanced with Search Input on Top */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xl p-5 max-w-4xl mx-auto transition-all duration-300 flex flex-col gap-4">
            
            {/* Input Keyword - Full width on top */}
            <div className="w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kiếm nhà hàng, món ăn, địa điểm..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-[#FDFDFD] text-slate-700 placeholder-slate-400 shadow-sm transition-all"
              />
            </div>

            {/* Filter selectors & Search button below */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center w-full">
              
              {/* Location Select */}
              <div className="relative w-full">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-550" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer text-slate-750 truncate shadow-sm"
                >
                  <option>Tất cả khu vực</option>
                  <option>Quận Hoàn Kiếm</option>
                  <option>Quận Cầu Giấy</option>
                  <option>Quận Tây Hồ</option>
                  <option>Quận Đống Đa</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Cuisine Select */}
              <div className="relative w-full">
                <Utensils className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-555" />
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer text-slate-750 truncate shadow-sm"
                >
                  <option>Tất cả loại hình</option>
                  <option>Fine Dining</option>
                  <option>Món Việt</option>
                  <option>Lounge & Cocktail</option>
                  <option>Hải sản</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort Select */}
              <div className="relative w-full">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer text-slate-755 truncate shadow-sm"
                >
                  <option>Sắp xếp</option>
                  <option>Đánh giá cao nhất</option>
                  <option>Phổ biến nhất</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Search Submit CTA */}
              <button 
                onClick={() => {
                  const section = document.getElementById('review-feed-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                  toast.info('Đã cập nhật bộ lọc hiển thị!');
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white rounded-xl py-3 px-4 text-sm font-semibold shadow-md transition-all duration-200 active:scale-98 cursor-pointer text-center"
              >
                Tìm kiếm
              </button>
            </div>
            
            {/* Active Filters Summary */}
            {(searchText || selectedDistrict !== 'Tất cả khu vực' || selectedCuisine !== 'Tất cả loại hình' || activeHashtagFilter) && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-blue-950">Bộ lọc đang áp dụng:</span>
                {searchText && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    "{searchText}"
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setSearchText('')} />
                  </span>
                )}
                {selectedDistrict !== 'Tất cả khu vực' && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    {selectedDistrict}
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedDistrict('Tất cả khu vực')} />
                  </span>
                )}
                {selectedCuisine !== 'Tất cả loại hình' && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    {selectedCuisine}
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedCuisine('Tất cả loại hình')} />
                  </span>
                )}
                {activeHashtagFilter && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    {activeHashtagFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setActiveHashtagFilter(null)} />
                  </span>
                )}
                <button 
                  onClick={() => {
                    setSearchText('');
                    setSelectedDistrict('Tất cả khu vực');
                    setSelectedCuisine('Tất cả loại hình');
                    setSortBy('Sắp xếp');
                    setActiveHashtagFilter(null);
                  }}
                  className="text-slate-405 hover:text-blue-600 transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. COMMUNITY FORUM & SOCIAL REVIEW FEED */}
      <section id="review-feed-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* A. LEFT SIDEBAR (Span 3 on Desktop) */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Widget 1: Trending Districts */}
            <div className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50">
                <MapPin className="h-4 w-4 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">Địa điểm nổi bật</h3>
              </div>
              <ul className="space-y-3">
                {districts.map((d, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        setSelectedDistrict(d.name);
                        const section = document.getElementById('review-feed-section');
                        section?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition ${selectedDistrict === d.name ? 'bg-blue-50 text-blue-700 font-bold border border-blue-105' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-500 rounded-md h-5 w-5 flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        {d.name}
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium bg-slate-100/50 px-2 py-0.5 rounded-full">
                        {d.postCount} bài viết
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Widget 2: Upcoming Culinary Events */}
            <div id="events-widget" className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50 justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-blue-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Sự kiện ẩm thực</h3>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="space-y-4">
                {culinaryEvents.map((evt) => (
                  <div key={evt.id} className="group relative rounded-xl border border-slate-100 overflow-hidden bg-slate-50/50 hover:bg-white hover:border-blue-100 transition-all duration-300">
                    <div className="h-24 w-full relative">
                      <img src={evt.imageUrl} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {evt.tag}
                      </span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {evt.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-400" />
                        {evt.date} {evt.time && `| ${evt.time}`}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-blue-400" />
                        {evt.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => toast.info('Tính năng chi tiết sự kiện sẽ ra mắt sau!')}
                className="w-full mt-4 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-center gap-1"
              >
                Xem tất cả sự kiện <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </aside>

          {/* B. MIDDLE COLUMN (Dynamic Review Feed - Span 6 on Desktop) */}
          <main className="lg:col-span-6 space-y-6">
            
            {/* Feed Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h2 className="font-extrabold text-slate-800 text-base">Bảng tin Review</h2>
                {activeHashtagFilter && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                    Lọc: {activeHashtagFilter}
                  </span>
                )}
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveReviewTab('latest');
                    toast.info('Đang hiển thị đánh giá mới nhất.');
                  }}
                  className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-1.5 rounded-lg transition ${activeReviewTab === 'latest' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Mới nhất
                </button>
                <button
                  onClick={() => {
                    setActiveReviewTab('popular');
                    toast.info('Đang hiển thị đánh giá được yêu thích nhất.');
                  }}
                  className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-1.5 rounded-lg transition ${activeReviewTab === 'popular' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Yêu thích nhất
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {filteredReviewPosts.length === 0 ? (
              <div className="bg-white/80 rounded-2xl border border-slate-100 py-12 px-6 text-center space-y-3">
                <div className="text-3xl">🍲</div>
                <h3 className="font-bold text-slate-700">Không tìm thấy bài viết review nào</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc đổi bộ lọc khu vực để xem thêm đánh giá.
                </p>
                <button 
                  onClick={() => {
                    setSearchText('');
                    setSelectedDistrict('Tất cả khu vực');
                    setSelectedCuisine('Tất cả loại hình');
                    setActiveHashtagFilter(null);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredReviewPosts.map((post) => {
                  const isExpanded = expandedReviews[post.id] || false;
                  const isLiked = likedReviews[post.id] || false;
                  const likesCount = reviewLikeCounts[post.id] ?? post.likes;

                  return (
                    <article key={post.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
                      
                      {/* Post Header */}
                      <div className="p-5 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <img src={post.author.avatar} alt={post.author.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-105" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-800">{post.author.name}</h4>
                              <span className="text-[9px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-full border border-blue-100">
                                {post.author.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {post.location}
                              </span>
                              <span>•</span>
                              <span>{post.timestamp}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-700">{post.rating}</span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-5 space-y-3 flex-1">
                        <h3 className="font-extrabold text-base text-slate-800 leading-tight">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {isExpanded ? post.description : `${post.description.slice(0, 180)}...`}
                        </p>
                        {post.description.length > 180 && (
                          <button
                            onClick={() => toggleExpand(post.id)}
                            className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center"
                          >
                            {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                          </button>
                        )}

                        {/* Large Image */}
                        <div className="relative h-60 w-full rounded-xl overflow-hidden mt-3 shadow-sm bg-slate-50">
                          <img src={post.imageUrl} alt={post.restaurantName} className="w-full h-full object-cover" />
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold">
                            📍 {post.restaurantName}
                          </div>
                        </div>

                        {/* Hashtag List */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {post.tags.map((t, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveHashtagFilter(t);
                                toast.info(`Đang lọc các bài viết gắn thẻ ${t}`);
                              }}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full transition ${activeHashtagFilter === t ? 'bg-blue-500 text-white font-bold' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Post Footer Actions */}
                      <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button 
                            onClick={() => handleLikeReview(post.id)}
                            className={`flex items-center gap-1.5 text-xs transition ${isLiked ? 'text-rose-500 font-bold' : 'text-slate-500 hover:text-rose-500'}`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                            <span>{likesCount} Thích</span>
                          </button>

                          {/* Comment Button */}
                          <button 
                            onClick={() => toast.info('Bình luận sẽ được kích hoạt sau khi liên kết BE!')}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.commentsCount} Bình luận</span>
                          </button>

                          {/* Share Button */}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success('Đã sao chép liên kết chia sẻ!');
                            }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Chia sẻ</span>
                          </button>
                        </div>

                        {/* Booking CTA */}
                        <button
                          onClick={() => handleOpenBooking(post.restaurantName)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Đặt bàn ngay</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* C. RIGHT SIDEBAR (Span 3 on Desktop) */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Widget 1: Trending Hashtags */}
            <div className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm"># Xu hướng</h3>
              </div>
              <ul className="space-y-3">
                {trendingHashtags.map((hash, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => {
                        setActiveHashtagFilter(hash.tag);
                        toast.info(`Lọc bài viết theo thẻ ${hash.tag}`);
                      }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between ${activeHashtagFilter === hash.tag ? 'bg-blue-500 text-white font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                    >
                      <span>{hash.tag}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${activeHashtagFilter === hash.tag ? 'bg-blue-650 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {hash.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Widget 2: Leaderboard (Top Contributors) */}
            <div className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50">
                <Award className="h-4 w-4 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">Thành viên tích cực</h3>
              </div>
              <div className="space-y-3.5">
                {leaderboardUsers.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-100" />
                        {user.isTop && (
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-bold border border-white">
                            👑
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-none">{user.name}</h4>
                        <span className="text-[9px] text-slate-400 mt-1 block">Hạng #{user.rank}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-55 px-2 py-0.5 rounded-full">
                      {user.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* 4. FEATURED RESTAURANTS GRID */}
      <section className="bg-gradient-to-b from-white to-blue-50/20 border-y border-blue-100/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">Nhà hàng nổi bật</h2>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                Hot nhất tuần này
              </span>
            </div>
            <button 
              onClick={() => {
                const s = document.getElementById('search-section');
                s?.scrollIntoView({behavior: 'smooth'});
                toast.info('Sử dụng bộ tìm kiếm để lọc toàn bộ nhà hàng!');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Responsive 4-Column Restaurant Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {restaurants.map((rest) => {
              const isWishlisted = wishlistedRestaurants[rest.id] || false;
              return (
                <div key={rest.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
                  
                  {/* Restaurant Image */}
                  <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                    <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* Top-Left Badge */}
                    {rest.badge && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md">
                        {rest.badge}
                      </span>
                    )}

                    {/* Top-Right Heart Wishlist */}
                    <button 
                      onClick={() => handleToggleWishlist(rest.id)}
                      className="absolute top-3 right-3 h-8.5 w-8.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <Heart className={`h-4.5 w-4.5 transition-colors ${isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'}`} />
                    </button>
                  </div>

                  {/* Information Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-sm text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {rest.name}
                      </h3>
                      
                      {/* Stars & Reviews */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-slate-800">{rest.rating}</span>
                        <span className="text-slate-400">({rest.reviewsCount} đánh giá)</span>
                      </div>

                      {/* Location & Distance */}
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{rest.location}</span>
                        <span className="text-slate-300">•</span>
                        <span className="shrink-0">{rest.distance}</span>
                      </p>

                      {/* Category Badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rest.categories.map((cat, idx) => (
                          <span key={idx} className="bg-slate-50 text-slate-500 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-slate-100">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Book Now Button */}
                    <button
                      onClick={() => handleOpenBooking(rest.name)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 group-hover:shadow-md"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Đặt bàn ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE BOOKING MODAL */}
      {bookingRestaurant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-fade-in-scale">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 p-5 text-white">
              <button 
                onClick={() => setBookingRestaurant(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/25 px-2 py-0.5 rounded">
                Phiếu Đặt Bàn
              </span>
              <h3 className="text-lg font-black mt-1">Đặt bàn tại {bookingRestaurant}</h3>
            </div>

            {/* Modal Body */}
            {isBookedSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Đặt bàn thành công!</h4>
                  <p className="text-xs text-slate-500 px-4">
                    Mã đặt bàn của bạn là <strong className="text-blue-600">#ERD-{Math.floor(1000 + Math.random() * 9000)}</strong>. Nhân viên nhà hàng sẽ liên hệ lại với bạn trong vòng 10 phút để xác nhận.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100">
                  <p><strong>Khách hàng:</strong> {bookingForm.name}</p>
                  <p><strong>Số điện thoại:</strong> {bookingForm.phone}</p>
                  <p><strong>Thời gian:</strong> {bookingForm.time} - {bookingForm.date}</p>
                  <p><strong>Số khách:</strong> {bookingForm.guests} người</p>
                </div>
                <button
                  onClick={() => setBookingRestaurant(null)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-650 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm hover:brightness-105"
                >
                  Hoàn tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chọn ngày *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giờ đặt *</label>
                    <select
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option>11:00</option>
                      <option>11:30</option>
                      <option>12:00</option>
                      <option>12:30</option>
                      <option>13:00</option>
                      <option>18:00</option>
                      <option>18:30</option>
                      <option>19:00</option>
                      <option>19:30</option>
                      <option>20:00</option>
                      <option>20:30</option>
                    </select>
                  </div>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng khách *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm({...bookingForm, guests: parseInt(e.target.value) || 2})}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú đặc biệt (nếu có)</label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    placeholder="VD: Muốn ngồi cạnh cửa sổ, kỷ niệm ngày cưới..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookingRestaurant(null)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 text-white text-xs font-bold shadow-md"
                  >
                    Xác nhận đặt
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. PLATFORM FOOTER - Fixed columns with correct integer layout & Blue icons */}
      <footer id="footer" className="bg-[#111827] text-slate-400 border-t border-slate-900 pt-16 pb-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Spaced properly using flex row layout to distribute columns evenly */}
          <div className="flex flex-col md:flex-row justify-between gap-8 pb-12 border-b border-slate-800">
            
            {/* Col 1: Platform Info */}
            <div className="space-y-4 max-w-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-md">
                  <Utensils className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-wider">RMS</span>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed">
                Kết nối những tâm hồn ẩm thực với các nhà hàng sang trọng và uy tín. Tìm kiếm, đánh giá và đặt bàn trực tuyến dễ dàng.
              </p>
            </div>

            {/* Col 2: Explore */}
            <div className="space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Khám phá</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => { setSearchText(''); setSelectedDistrict('Tất cả khu vực'); }} className="hover:text-white transition">Tìm kiếm nhà hàng</button></li>
                <li><button onClick={() => toast.info('Tính năng bộ sưu tập sẽ sớm ra mắt!')} className="hover:text-white transition">Bộ sưu tập món ăn</button></li>
                <li><button onClick={() => { const s = document.getElementById('review-feed-section'); s?.scrollIntoView({behavior: 'smooth'}); }} className="hover:text-white transition">Đánh giá mới nhất</button></li>
                <li><button onClick={() => toast.info('Khuyến mãi sẽ được hiển thị khi BE sẵn sàng!')} className="hover:text-white transition">Ưu đãi tuần này</button></li>
              </ul>
            </div>

            {/* Col 3: Partnerships (Span 2) */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Hợp tác</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/login" className="hover:text-white transition">Đăng ký chủ nhà hàng</a></li>
                <li><button onClick={() => toast.info('Các gói dịch vụ tiếp thị liên kết!')} className="hover:text-white transition">Gói dịch vụ quảng bá</button></li>
                <li><a href="#search-section" className="hover:text-white transition">Hướng dẫn đặt bàn</a></li>
              </ul>
            </div>

            {/* Col 4: Contact & Socials (Span 4) */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Liên hệ & Kết nối</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                  <span>+84 987 654 321</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span>support@rms.com</span>
                </li>
              </ul>
              
              {/* Social Icons with elegant blue transitions */}
              <div className="flex gap-3 pt-2">
                <a href="#" className="h-8.5 w-8.5 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition flex items-center justify-center" title="Facebook">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                </a>
                <a href="#" className="h-8.5 w-8.5 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition flex items-center justify-center" title="Instagram">
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="#" className="h-8.5 w-8.5 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition flex items-center justify-center" title="Youtube">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.524 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.864.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.003 3.003 0 0 0 2.11-2.108c.502-1.866.502-5.837.502-5.837s0-3.971-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom copyright bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-slate-500 text-[10px]">
            <p>© {new Date().getFullYear()} RMS. Bảo lưu mọi quyền.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:underline hover:text-slate-400">Điều khoản dịch vụ</a>
              <a href="#" className="hover:underline hover:text-slate-400">Chính sách bảo mật</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
