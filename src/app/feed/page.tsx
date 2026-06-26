'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import {
  Search,
  MapPin,
  Utensils,
  ThumbsUp,
  MessageSquare,
  Share2,
  Calendar,
  ChevronRight,
  Star,
  Award,
  Phone,
  Mail,
  Clock,
  X,
  CheckCircle,
  LogOut,
  ChevronDown,
  TrendingUp
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

export default function ForumFeedPage() {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLanguage();
  
  // --- States ---
  const [searchText, setSearchText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả khu vực');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả loại hình');
  const [activeReviewTab, setActiveReviewTab] = useState<'latest' | 'popular'>('latest');
  const [activeHashtagFilter, setActiveHashtagFilter] = useState<string | null>(null);
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

  // --- Like States ---
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});
  const [reviewLikeCounts, setReviewLikeCounts] = useState<Record<number, number>>({});

  const t = useMemo(() => {
    return locale === 'vi' ? {
      // Nav
      navExplore: 'Khám phá',
      navFeed: 'Diễn đàn Review',
      navEvents: 'Sự kiện & Ưu đãi',
      navAbout: 'Về chúng tôi',
      navSys: 'Hệ thống Quản lý',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navDashboard: 'Dashboard',
      navLogout: 'Đăng xuất',
      
      // Feed Headers & Search
      feedSearchPlaceholder: 'Tìm kiếm bài viết review, món ăn, địa điểm...',
      feedHeading: 'Bảng tin Review',
      feedTabLatest: 'Mới nhất',
      feedTabPopular: 'Yêu thích nhất',
      toastFeedLatest: 'Đang hiển thị đánh giá mới nhất.',
      toastFeedPopular: 'Đang hiển thị đánh giá được yêu thích nhất.',
      toastResetFilters: 'Đặt lại bộ lọc',
      toastFilterResetMsg: 'Đặt lại bộ lọc X',
      noFeedResults: 'Không tìm thấy bài viết review nào',
      noFeedResultsDesc: 'Hãy thử thay đổi từ khóa tìm kiếm hoặc đổi bộ lọc khu vực để xem thêm đánh giá.',
      
      // District sidebar
      sidebarDistTitle: 'Địa điểm nổi bật',
      toastDistrictFilter: 'Đang lọc bài viết ở',
      postCountText: 'bài',
      
      // Event sidebar
      sidebarEventTitle: 'Sự kiện ẩm thực',
      sidebarEventBtnViewAll: 'Xem tất cả sự kiện',
      
      // Post template translations
      postLikes: 'Thích',
      postComments: 'Bình luận',
      postShare: 'Chia sẻ',
      postBookCTA: 'Đặt bàn ngay',
      toastCommentDisabled: 'Bình luận sẽ được kích hoạt sau khi liên kết BE!',
      toastShareCopied: 'Đã sao chép liên kết chia sẻ!',
      toastLikedPost: 'Đã thêm bài viết vào danh sách yêu thích!',
      
      // Right sidebar
      sidebarTrending: 'Xu hướng',
      toastHashtagFilter: 'Lọc bài viết theo thẻ',
      sidebarActiveMembers: 'Thành viên tích cực',
      rankText: 'Hạng',
      
      // Dialogs / Booking Modal
      bookingTitle: 'Phiếu Đặt Bàn',
      bookingSubtitle: 'Đặt bàn tại',
      bookingSuccess: 'Đặt bàn thành công!',
      bookingCodeText: 'Mã đặt bàn của bạn là',
      bookingConfirmContact: 'Nhân viên nhà hàng sẽ liên hệ lại với bạn trong vòng 10 phút để xác nhận.',
      bookingLabelName: 'Họ và tên *',
      bookingLabelPhone: 'Số điện thoại *',
      bookingLabelDate: 'Chọn ngày *',
      bookingLabelTime: 'Giờ đặt *',
      bookingLabelGuests: 'Số lượng khách *',
      bookingLabelNotes: 'Ghi chú đặc biệt (nếu có)',
      bookingPlaceholderName: 'VD: Nguyễn Văn A',
      bookingPlaceholderPhone: 'VD: 0912345678',
      bookingPlaceholderNotes: 'VD: Muốn ngồi cạnh cửa sổ, kỷ niệm ngày cưới...',
      bookingBtnCancel: 'Hủy bỏ',
      bookingBtnConfirm: 'Xác nhận đặt',
      bookingBtnComplete: 'Hoàn tất',
      bookingCustomer: 'Khách hàng',
      bookingPhone: 'Số điện thoại',
      bookingTime: 'Thời gian',
      bookingGuests: 'Số khách',
      toastEnterName: 'Vui lòng nhập họ và tên',
      toastEnterPhone: 'Vui lòng nhập số điện thoại',
      toastBookingSuccess: 'Đặt bàn thành công tại',
      
      // Footer
      footerDesc: 'Kết nối những tâm hồn ẩm thực với các nhà hàng sang trọng và uy tín. Tìm kiếm, đánh giá và đặt bàn trực tuyến dễ dàng.',
      footerExplore: 'Khám phá',
      footerSearch: 'Tìm kiếm nhà hàng',
      footerCuisineCol: 'Bộ sưu tập món ăn',
      footerLatestRev: 'Đánh giá mới nhất',
      footerWeeklyOffers: 'Ưu đãi tuần này',
      footerPartner: 'Hợp tác',
      footerRegOwner: 'Đăng ký chủ nhà hàng',
      footerAdPacks: 'Gói dịch vụ quảng bá',
      footerGuide: 'Hướng dẫn đặt bàn',
      footerContact: 'Liên hệ & Kết nối',
      footerTerms: 'Điều khoản dịch vụ',
      footerPrivacy: 'Chính sách bảo mật',
      footerAllRights: 'Bảo lưu mọi quyền.'
    } : {
      // Nav
      navExplore: 'Explore',
      navFeed: 'Review Feed',
      navEvents: 'Events & Offers',
      navAbout: 'About Us',
      navSys: 'Management System',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navDashboard: 'Dashboard',
      navLogout: 'Log Out',
      
      // Feed Headers & Search
      feedSearchPlaceholder: 'Search review posts, dishes, locations...',
      feedHeading: 'Review Feed',
      feedTabLatest: 'Latest',
      feedTabPopular: 'Most Liked',
      toastFeedLatest: 'Displaying latest reviews.',
      toastFeedPopular: 'Displaying most liked reviews.',
      toastResetFilters: 'Reset filters',
      toastFilterResetMsg: 'Reset filters X',
      noFeedResults: 'No review posts found',
      noFeedResultsDesc: 'Try adjusting your search query or changing the district filter to see more reviews.',
      
      // District sidebar
      sidebarDistTitle: 'Trending Districts',
      toastDistrictFilter: 'Filtering posts in',
      postCountText: 'posts',
      
      // Event sidebar
      sidebarEventTitle: 'Culinary Events',
      sidebarEventBtnViewAll: 'View all events',
      
      // Post template translations
      postLikes: 'Likes',
      postComments: 'Comments',
      postShare: 'Share',
      postBookCTA: 'Book Table',
      toastCommentDisabled: 'Comments feature will be enabled once backend is active!',
      toastShareCopied: 'Share link copied to clipboard!',
      toastLikedPost: 'Added review to your favorites list!',
      
      // Right sidebar
      sidebarTrending: 'Trending',
      toastHashtagFilter: 'Filtering posts by tag',
      sidebarActiveMembers: 'Top Contributors',
      rankText: 'Rank',
      
      // Dialogs / Booking Modal
      bookingTitle: 'Booking Voucher',
      bookingSubtitle: 'Book table at',
      bookingSuccess: 'Booking Successful!',
      bookingCodeText: 'Your booking code is',
      bookingConfirmContact: 'Restaurant staff will contact you within 10 minutes to confirm.',
      bookingLabelName: 'Full name *',
      bookingLabelPhone: 'Phone number *',
      bookingLabelDate: 'Select date *',
      bookingLabelTime: 'Select time *',
      bookingLabelGuests: 'Guest count *',
      bookingLabelNotes: 'Special notes (if any)',
      bookingPlaceholderName: 'E.g., John Doe',
      bookingPlaceholderPhone: 'E.g., 0912345678',
      bookingPlaceholderNotes: 'E.g., Window seat, anniversary dinner...',
      bookingBtnCancel: 'Cancel',
      bookingBtnConfirm: 'Confirm Booking',
      bookingBtnComplete: 'Complete',
      bookingCustomer: 'Customer',
      bookingPhone: 'Phone',
      bookingTime: 'Time',
      bookingGuests: 'Guests',
      toastEnterName: 'Please enter your full name',
      toastEnterPhone: 'Please enter your phone number',
      toastBookingSuccess: 'Booking successful at',
      
      // Footer
      footerDesc: 'Connecting food lovers with prestigious and luxurious restaurants. Search, review, and book tables online with ease.',
      footerExplore: 'Explore',
      footerSearch: 'Search Restaurants',
      footerCuisineCol: 'Food Collections',
      footerLatestRev: 'Latest Reviews',
      footerWeeklyOffers: 'Weekly Offers',
      footerPartner: 'Partnerships',
      footerRegOwner: 'Register Restaurant Owner',
      footerAdPacks: 'Promotional Packages',
      footerGuide: 'Booking Guide',
      footerContact: 'Contact & Connect',
      footerTerms: 'Terms of Service',
      footerPrivacy: 'Privacy Policy',
      footerAllRights: 'All rights reserved.'
    };
  }, [locale]);

  const translateDistrict = (name: string) => {
    if (locale === 'vi') return name;
    let translated = name;
    const dict: Record<string, string> = {
      'Quận Hoàn Kiếm': 'Hoan Kiem District',
      'Quận Cầu Giấy': 'Cau Giay District',
      'Quận Tây Hồ': 'Tay Ho District',
      'Quận Đống Đa': 'Dong Da District',
      'Quận Hai Bà Trưng': 'Hai Ba Trung District'
    };
    for (const [key, val] of Object.entries(dict)) {
      if (translated.includes(key)) {
        translated = translated.replace(key, val);
      }
    }
    return translated.replace('Hà Nội', 'Hanoi');
  };

  const translateLevel = (level: string) => {
    if (locale === 'vi') return level;
    const dict: Record<string, string> = {
      'Thành viên Vàng': 'Gold Member',
      'Ẩm thực Gia': 'Food Expert',
      'Chuyên gia Review': 'Review Expert'
    };
    return dict[level] || level;
  };

  const translateTimestamp = (time: string) => {
    if (locale === 'vi') return time;
    return time
      .replace('giờ trước', 'hours ago')
      .replace('ngày trước', 'days ago')
      .replace('vừa xong', 'just now');
  };

  const translateHashtagCount = (countStr: string) => {
    if (locale === 'vi') return countStr;
    return countStr.replace('bài', 'posts');
  };

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

  const translatedEvents = useMemo(() => {
    return culinaryEvents.map(evt => {
      if (locale === 'vi') return evt;
      const dict: Record<number, Partial<CulinaryEvent>> = {
        1: {
          title: 'Street Food Essence Festival',
          date: '28/06 - 30/06/2026',
          location: 'Hoan Kiem Lake Walking Street, Hoan Kiem'
        },
        2: {
          title: 'Acoustic Night & Fine Wine Tasting',
          date: 'This Saturday',
          location: 'Skyline Lounge, Cau Giay'
        },
        3: {
          title: 'Masterclass: Traditional Sushi Making Art',
          location: 'The En Restaurant, Hoan Kiem'
        }
      };
      return { ...evt, ...dict[evt.id] };
    });
  }, [locale]);

  const translatedReviewPosts = useMemo(() => {
    return filteredReviewPosts.map(post => {
      if (locale === 'vi') return post;
      const dict: Record<number, Partial<ReviewPost>> = {
        1: {
          title: 'Exquisite Vietnamese Cuisine Experience at Tam Vi',
          description: 'The atmosphere at Tam Vi truly brings a very warm, nostalgic feeling, reminiscent of old Hanoi houses. The dishes are prepared and presented meticulously, matching Northern family-style cooking but elevated to Fine Dining level. You must try the rich caramelized braised pork belly served with boiled vegetables and sweet, refreshing crab soup!',
          restaurantName: 'Tam Vi Restaurant'
        },
        2: {
          title: 'Skyline Lounge - Extremely Chill Sunset View Over Hanoi',
          description: 'If you are looking for a romantic, breezy date spot in the late afternoon, this is definitely the number one choice in Cau Giay. Cocktails here are very creative, with relaxing deep house music and a city view from high up that is truly precious. The light food menu is also rich, especially the stone-grilled beef which is very tender and flavorful.',
          restaurantName: 'Skyline Lounge'
        },
        3: {
          title: 'Fresh Ocean Flavors in the Heart of the Old Quarter at The En',
          description: 'The En brings a very fresh style combining Asian-Western cuisine and seafood. The baked lobster with rich and fragrant cheese has firm, sweet lobster meat. Super friendly and enthusiastic staff, luxurious space, very suitable for hosting guests or family gatherings on the weekend.',
          restaurantName: 'The En Restaurant'
        }
      };
      return { ...post, ...dict[post.id] };
    });
  }, [filteredReviewPosts, locale]);

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

          {/* Nav Items - Pill shaped (Diễn đàn Review is active) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-blue-50/50 p-1 rounded-full border border-blue-100/50">
            <Link 
              href="/"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navExplore}
            </Link>
            <Link 
              href="/feed"
              className="rounded-full bg-white shadow-sm px-4 py-1.5 text-sm font-bold text-blue-600 transition-all"
            >
              {t.navFeed}
            </Link>
            <Link 
              href="/events"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navEvents}
            </Link>
            <Link 
              href="/#about-us-section"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navAbout}
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 bg-blue-50/75 p-0.5 rounded-full border border-blue-100 shadow-inner mr-1 shrink-0">
              <button 
                onClick={() => {
                  setLocale('vi');
                  toast.success('Đã chuyển sang Tiếng Việt');
                }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-all ${locale === 'vi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button 
                onClick={() => {
                  setLocale('en');
                  toast.success('Switched to English');
                }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-all ${locale === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Nút dẫn vào phần mềm quản lý nhà hàng */}
            <Link 
              href="/dashboard" 
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/40 hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:scale-102 hover:shadow"
            >
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span>{t.navSys}</span>
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
                  {t.navDashboard}
                </Link>
                <button 
                  onClick={logout} 
                  className="rounded-lg text-slate-500 hover:text-rose-600 p-2 transition"
                  title={t.navLogout}
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
                  {t.navSignIn}
                </Link>
                <Link 
                  href="/customer-portal" 
                  className="rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white px-5 py-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-102 hover:brightness-105 active:scale-98 transition-all duration-200"
                >
                  {t.navSignUp}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. THREE COLUMN COMMUNITY FEED & SOCIAL LAYOUT */}
      <section id="review-feed-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-4">
        
        {/* Search bar inside the feed */}
        <div className="mb-6 max-w-3xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text"
            placeholder={t.feedSearchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-250 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-700 placeholder-slate-400 shadow-sm transition-all"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* A. LEFT SIDEBAR (Span 3 on Desktop) */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Widget 1: Trending Districts */}
            <div className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50">
                <MapPin className="h-4 w-4 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">{t.sidebarDistTitle}</h3>
              </div>
              <ul className="space-y-3">
                {districts.map((d, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        setSelectedDistrict(d.name);
                        toast.info(`${t.toastDistrictFilter} ${translateDistrict(d.name)}`);
                      }}
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition ${selectedDistrict === d.name ? 'bg-blue-50 text-blue-700 font-bold border border-blue-105' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2 text-left">
                        <span className="text-[10px] bg-slate-100 text-slate-500 rounded-md h-5 w-5 flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        {translateDistrict(d.name)}
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium bg-slate-100/50 px-2 py-0.5 rounded-full shrink-0">
                        {d.postCount} {t.postCountText}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Widget 2: Upcoming Culinary Events */}
            <div id="events-widget" className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm scroll-mt-20">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50 justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-blue-500" />
                  <h3 className="font-bold text-slate-800 text-sm">{t.sidebarEventTitle}</h3>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="space-y-4">
                {translatedEvents.map((evt) => (
                  <Link href={`/events?id=${evt.id}`} key={evt.id} className="group block relative rounded-xl border border-slate-100 overflow-hidden bg-slate-50/50 hover:bg-white hover:border-blue-100 transition-all duration-300">
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
                  </Link>
                ))}
              </div>
              <Link 
                href="/events"
                className="w-full mt-4 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-center gap-1"
              >
                {t.sidebarEventBtnViewAll} <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          {/* B. MIDDLE COLUMN (Dynamic Review Feed - Span 6 on Desktop) */}
          <main className="lg:col-span-6 space-y-6">
            
            {/* Feed Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h2 className="font-extrabold text-slate-800 text-base">{t.feedHeading}</h2>
                {(activeHashtagFilter || selectedDistrict !== 'Tất cả khu vực') && (
                  <button 
                    onClick={() => {
                      setActiveHashtagFilter(null);
                      setSelectedDistrict('Tất cả khu vực');
                    }}
                    className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition"
                  >
                    {t.toastFilterResetMsg}
                  </button>
                )}
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveReviewTab('latest');
                    toast.info(t.toastFeedLatest);
                  }}
                  className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-1.5 rounded-lg transition ${activeReviewTab === 'latest' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t.feedTabLatest}
                </button>
                <button
                  onClick={() => {
                    setActiveReviewTab('popular');
                    toast.info(t.toastFeedPopular);
                  }}
                  className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-1.5 rounded-lg transition ${activeReviewTab === 'popular' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t.feedTabPopular}
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {translatedReviewPosts.length === 0 ? (
              <div className="bg-white/80 rounded-2xl border border-slate-100 py-12 px-6 text-center space-y-3">
                <div className="text-3xl">🍲</div>
                <h3 className="font-bold text-slate-700">{t.noFeedResults}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t.noFeedResultsDesc}
                </p>
                <button 
                  onClick={() => {
                    setSearchText('');
                    setSelectedDistrict('Tất cả khu vực');
                    setActiveHashtagFilter(null);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  {t.toastResetFilters}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {translatedReviewPosts.map((post) => {
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
                                {translateLevel(post.author.level)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {translateDistrict(post.location)}
                              </span>
                              <span>•</span>
                              <span>{translateTimestamp(post.timestamp)}</span>
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
                            {isExpanded ? (locale === 'vi' ? 'Thu gọn' : 'Show less') : (locale === 'vi' ? 'Xem thêm' : 'Read more')}
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
                                toast.info(`${locale === 'vi' ? 'Đang lọc các bài viết gắn thẻ' : 'Filtering posts with tag'} ${t}`);
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
                            <span>{likesCount} {locale === 'vi' ? 'Thích' : 'Likes'}</span>
                          </button>

                          {/* Comment Button */}
                          <button 
                            onClick={() => toast.info(t.toastCommentDisabled)}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.commentsCount} {locale === 'vi' ? 'Bình luận' : 'Comments'}</span>
                          </button>

                          {/* Share Button */}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success(t.toastShareCopied);
                            }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>{locale === 'vi' ? 'Chia sẻ' : 'Share'}</span>
                          </button>
                        </div>

                        {/* Booking CTA */}
                        <button
                          onClick={() => handleOpenBooking(post.restaurantName)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{t.postBookCTA}</span>
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
                <h3 className="font-bold text-slate-800 text-sm">{t.sidebarTrending}</h3>
              </div>
              <ul className="space-y-3">
                {trendingHashtags.map((hash, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => {
                        setActiveHashtagFilter(hash.tag);
                        toast.info(`${t.toastHashtagFilter} ${hash.tag}`);
                      }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between ${activeHashtagFilter === hash.tag ? 'bg-blue-500 text-white font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                    >
                      <span>{hash.tag}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${activeHashtagFilter === hash.tag ? 'bg-blue-650 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {translateHashtagCount(hash.count)}
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
                <h3 className="font-bold text-slate-800 text-sm">{t.sidebarActiveMembers}</h3>
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
                        <span className="text-[9px] text-slate-400 mt-1 block">{t.rankText} #{user.rank}</span>
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

      {/* 3. INTERACTIVE BOOKING MODAL */}
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
                {t.bookingTitle}
              </span>
              <h3 className="text-lg font-black mt-1">{t.bookingSubtitle} {bookingRestaurant}</h3>
            </div>

            {/* Modal Body */}
            {isBookedSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">{t.bookingSuccess}</h4>
                  <p className="text-xs text-slate-500 px-4">
                    {t.bookingCodeText} <strong className="text-blue-600">#ERD-{Math.floor(1000 + Math.random() * 9000)}</strong>. {t.bookingConfirmContact}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100">
                  <p><strong>{t.bookingCustomer}:</strong> {bookingForm.name}</p>
                  <p><strong>{t.bookingPhone}:</strong> {bookingForm.phone}</p>
                  <p><strong>{t.bookingTime}:</strong> {bookingForm.time} - {bookingForm.date}</p>
                  <p><strong>{t.bookingGuests}:</strong> {bookingForm.guests} {locale === 'vi' ? 'người' : 'guests'}</p>
                </div>
                <button
                  onClick={() => setBookingRestaurant(null)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-650 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm hover:brightness-105"
                >
                  {t.bookingBtnComplete}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelName}</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                    placeholder={t.bookingPlaceholderName}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelPhone}</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                    placeholder={t.bookingPlaceholderPhone}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelDate}</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelTime}</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelGuests}</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelNotes}</label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    placeholder={t.bookingPlaceholderNotes}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookingRestaurant(null)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold"
                  >
                    {t.bookingBtnCancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 text-white text-xs font-bold shadow-md"
                  >
                    {t.bookingBtnConfirm}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. PLATFORM FOOTER */}
      <footer id="footer" className="bg-[#111827] text-slate-400 border-t border-slate-900 pt-16 pb-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
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
                {t.footerDesc}
              </p>
            </div>

            {/* Col 2: Explore */}
            <div className="space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerExplore}</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-white transition">{t.footerSearch}</Link></li>
                <li><button onClick={() => toast.info(locale === 'vi' ? 'Tính năng bộ sưu tập sẽ sớm ra mắt!' : 'Food collections feature coming soon!')} className="hover:text-white transition">{t.footerCuisineCol}</button></li>
                <li><Link href="/feed" className="hover:text-white transition">{t.footerLatestRev}</Link></li>
                <li><button onClick={() => toast.info(locale === 'vi' ? 'Khuyến mãi sẽ được hiển thị khi BE sẵn sàng!' : 'Offers will be displayed when Backend is ready!')} className="hover:text-white transition">{t.footerWeeklyOffers}</button></li>
              </ul>
            </div>

            {/* Col 3: Partnerships */}
            <div className="space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerPartner}</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/login" className="hover:text-white transition">{t.footerRegOwner}</a></li>
                <li><button onClick={() => toast.info(locale === 'vi' ? 'Các gói dịch vụ tiếp thị liên kết!' : 'Affiliate marketing packages!')} className="hover:text-white transition">{t.footerAdPacks}</button></li>
                <li><Link href="/" className="hover:text-white transition">{t.footerGuide}</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact & Socials */}
            <div className="space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerContact}</h4>
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
            <p>© {new Date().getFullYear()} RMS. {t.footerAllRights}</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:underline hover:text-slate-400">{t.footerTerms}</a>
              <a href="#" className="hover:underline hover:text-slate-400">{t.footerPrivacy}</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
