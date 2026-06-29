'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api, connectWebSocket } from '@/lib/api';
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
  ChevronDown,
  TrendingUp,
  User as UserIcon,
  Image as ImageIcon,
  Send,
  Flag,
  Upload,
  Trash2
} from 'lucide-react';

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
  const { user } = useAuth();
  const { locale } = useLanguage();

  // --- Real API States ---
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả khu vực');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả loại hình');
  const [activeReviewTab, setActiveReviewTab] = useState<'latest' | 'popular'>('latest');
  const [activeHashtagFilter, setActiveHashtagFilter] = useState<string | null>(null);

  // --- Create Post States ---
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [tableCheckIn, setTableCheckIn] = useState('');
  const [selectedCreateBranchId, setSelectedCreateBranchId] = useState('b1');
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [taggedProducts, setTaggedProducts] = useState<any[]>([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // --- Comment list by Post ID ---
  const [commentsByPost, setCommentsByPost] = useState<Record<number, any[]>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // --- Report Dialog ---
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [activeStarFilter, setActiveStarFilter] = useState<string>('Tất cả');
  const [lightboxMedia, setLightboxMedia] = useState<{ urls: string[], index: number } | null>(null);
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);

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

  // --- Static/Mock Databases for Sidebar ---
  const districts: District[] = useMemo(() => {
    const namesSet = new Set<string>();
    branchesList.forEach((b: any) => {
      if (!b.address) return;
      const parts = b.address.split(',').map((p: string) => p.trim());
      if (parts.length >= 2) {
        // District/Ward (second to last element)
        const districtName = parts[parts.length - 2];
        if (districtName) namesSet.add(districtName);
        // City (last element)
        const cityName = parts[parts.length - 1];
        if (cityName) namesSet.add(cityName);
      }
    });

    const names = namesSet.size > 0 ? Array.from(namesSet) : ['Hải Châu', 'Thạch Thang', 'Đà Nẵng'];
    return names.map(name => {
      const matchingBranchIds = branchesList
        .filter(b => b.address && b.address.toLowerCase().includes(name.toLowerCase()))
        .map(b => b.branchId);
      const postCount = posts.filter(p => p.status === 'PUBLIC' && matchingBranchIds.includes(p.branchId)).length;
      return { name, postCount };
    });
  }, [posts, branchesList]);

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

  const trendingHashtags: TrendingHashtag[] = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(post => {
      if (!post.content) return;
      const matches = post.content.match(/#[a-zA-Z0-9_\u00C0-\u1EF9]+/gu);
      if (matches) {
        matches.forEach((tag: string) => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count: `${count} bài` }));
    
    if (sorted.length === 0) {
      return [
        { tag: '#AmThucDaNang', count: '10 bài' },
        { tag: '#ComNieuDaNang', count: '8 bài' },
        { tag: '#RMSReview', count: '5 bài' }
      ];
    }
    return sorted;
  }, [posts]);

  const leaderboardUsers: LeaderboardUser[] = [
    { rank: 1, name: 'Lê Hải Nam', points: 1240, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', isTop: true },
    { rank: 2, name: 'Hoàng Minh Lan', points: 950, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100' },
    { rank: 3, name: 'Phạm Minh Quốc', points: 820, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
    { rank: 4, name: 'Nguyễn Kiều Trang', points: 760, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' }
  ];

  // --- Translation Helpers ---
  const t = useMemo(() => {
    return locale === 'vi' ? {
      navExplore: 'Khám phá',
      navFeed: 'Diễn đàn Review',
      navEvents: 'Sự kiện & Ưu đãi',
      navAbout: 'Về chúng tôi',
      navSys: 'Hệ thống Quản lý',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navDashboard: 'Dashboard',
      navLogout: 'Đăng xuất',
      
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
      
      sidebarDistTitle: 'Địa điểm nổi bật',
      toastDistrictFilter: 'Đang lọc bài viết ở',
      postCountText: 'bài',
      sidebarEventTitle: 'Sự kiện ẩm thực',
      sidebarEventBtnViewAll: 'Xem tất cả sự kiện',
      postLikes: 'Thích',
      postComments: 'Bình luận',
      postShare: 'Chia sẻ',
      postBookCTA: 'Đặt bàn ngay',
      toastCommentDisabled: 'Bình luận sẽ được kích hoạt sau khi liên kết BE!',
      toastShareCopied: 'Đã sao chép liên kết chia sẻ!',
      toastLikedPost: 'Đã thêm bài viết vào danh sách yêu thích!',
      
      sidebarTrending: 'Xu hướng',
      toastHashtagFilter: 'Lọc bài viết theo thẻ',
      sidebarActiveMembers: 'Thành viên tích cực',
      rankText: 'Hạng',
      
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
      navExplore: 'Explore',
      navFeed: 'Review Feed',
      navEvents: 'Events & Offers',
      navAbout: 'About Us',
      navSys: 'Management System',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navDashboard: 'Dashboard',
      navLogout: 'Log Out',
      
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
      
      sidebarDistTitle: 'Trending Districts',
      toastDistrictFilter: 'Filtering posts in',
      postCountText: 'posts',
      sidebarEventTitle: 'Culinary Events',
      sidebarEventBtnViewAll: 'View all events',
      postLikes: 'Likes',
      postComments: 'Comments',
      postShare: 'Share',
      postBookCTA: 'Book Table',
      toastCommentDisabled: 'Comments feature will be enabled once backend is active!',
      toastShareCopied: 'Share link copied to clipboard!',
      toastLikedPost: 'Added review to your favorites list!',
      
      sidebarTrending: 'Trending',
      toastHashtagFilter: 'Filtering posts by tag',
      sidebarActiveMembers: 'Top Contributors',
      rankText: 'Rank',
      
      bookingTitle: 'Booking Voucher',
      bookingSubtitle: 'Book table at',
      bookingSuccess: 'Booking Successful!',
      bookingCodeText: 'Your booking code is',
      bookingConfirmContact: 'Restaurant staff will contact you within 10 minutes to confirm.',
      bookingLabelName: 'Full name *',
      bookingLabelPhone: 'Phone number *',
      bookingLabelDate: 'Select date *',
      bookingLabelTime: 'Select time *',
      bookingLabelGuests: 'Number of guests *',
      bookingLabelNotes: 'Special notes (optional)',
      bookingPlaceholderName: 'E.g., John Doe',
      bookingPlaceholderPhone: 'E.g., 0912345678',
      bookingPlaceholderNotes: 'E.g., Window seat, anniversary...',
      bookingBtnCancel: 'Cancel',
      bookingBtnConfirm: 'Confirm booking',
      bookingBtnComplete: 'Done',
      bookingCustomer: 'Customer',
      bookingPhone: 'Phone',
      bookingTime: 'Time',
      bookingGuests: 'Guests',
      toastEnterName: 'Please enter full name',
      toastEnterPhone: 'Please enter phone number',
      toastBookingSuccess: 'Booking successful at',
      
      footerDesc: 'Connecting food lovers with premium and reputable restaurants. Search, review, and book tables online easily.',
      footerExplore: 'Explore',
      footerSearch: 'Search restaurants',
      footerCuisineCol: 'Cuisine collections',
      footerLatestRev: 'Latest reviews',
      footerWeeklyOffers: 'Weekly offers',
      footerPartner: 'Partnership',
      footerRegOwner: 'Register restaurant owner',
      footerAdPacks: 'Promotional packages',
      footerGuide: 'Booking guide',
      footerContact: 'Contact & Connect',
      footerTerms: 'Terms of service',
      footerPrivacy: 'Privacy policy',
      footerAllRights: 'All rights reserved.'
    };
  }, [locale]);

  const translateDistrict = (name: string) => {
    if (locale === 'vi') return name;
    return name
      .replace('Quận Hoàn Kiếm', 'Hoan Kiem District')
      .replace('Quận Cầu Giấy', 'Cau Giay District')
      .replace('Quận Tây Hồ', 'Tay Ho District')
      .replace('Quận Đống Đa', 'Dong Da District')
      .replace('Quận Hai Bà Trưng', 'Hai Ba Trung District');
  };

  const translateHashtagCount = (countStr: string) => {
    if (locale === 'vi') return countStr;
    return countStr.replace('bài', 'posts');
  };

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

  // --- API Load Operations ---
  const loadFeed = async (pageToLoad: number, append = false) => {
    setLoading(true);
    try {
      const res = await api.get<any>('/api/public/feed/posts', {
        params: { page: pageToLoad, size: 10 }
      });
      if (res && res.content) {
        if (append) {
          setPosts(prev => [...prev, ...res.content]);
        } else {
          setPosts(res.content);
        }
        setHasMore(!res.last);
      }
    } catch (err) {
      toast.error(locale === 'vi' ? 'Không thể tải bảng tin review.' : 'Failed to load review feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(0, false);
    // Fetch branches list
    api.get<any[]>('/api/public/branches')
      .then(list => {
        setBranchesList(list);
        if (list && list.length > 0) {
          setSelectedCreateBranchId(list[0].branchId);
        }
      })
      .catch(err => console.error("Error loading branches:", err));

    // Fetch leaderboard list
    api.get<any[]>('/api/public/feed/leaderboard')
      .then(setLeaderboardList)
      .catch(err => console.error("Error loading leaderboard:", err));

    // Connect to Feed WebSocket
    let ws: WebSocket | null = null;
    try {
      ws = connectWebSocket('/ws/feed');
      ws.onmessage = (event) => {
        const msg = event.data;
        console.log("[Feed WS Message]:", msg);
        if (!msg) return;

        if (msg.startsWith('LIKE_UPDATE:')) {
          const [_, postIdStr, likesCountStr] = msg.split(':');
          const pId = parseInt(postIdStr, 10);
          const likesCount = parseInt(likesCountStr, 10);
          if (!isNaN(pId) && !isNaN(likesCount)) {
            setPosts(prev => prev.map(post => post.id === pId ? { ...post, likesCount } : post));
          }
        } 
        else if (msg.startsWith('COMMENT_UPDATE:')) {
          const [_, postIdStr] = msg.split(':');
          const pId = parseInt(postIdStr, 10);
          if (!isNaN(pId)) {
            // Update comments if drawer is active
            if (activeCommentPostId === pId) {
              api.get<any[]>(`/api/public/feed/posts/${pId}/comments`)
                .then(list => setCommentsByPost(prev => ({ ...prev, [pId]: list })))
                .catch(err => console.error("Error reloading comments via WS:", err));
            }
          }
        } 
        else if (msg.startsWith('POST_REMOVED:')) {
          const [_, postIdStr] = msg.split(':');
          const pId = parseInt(postIdStr, 10);
          if (!isNaN(pId)) {
            setPosts(prev => prev.filter(post => post.id !== pId));
          }
        } 
        else if (msg === 'NEW_POST') {
          toast.success(locale === 'vi' 
            ? 'Có bài viết mới trên diễn đàn! Hãy cuộn lên đầu.' 
            : 'New post added to feed! Scroll up.');
          loadFeed(0, false);
        }
      };
      ws.onerror = (err) => {
        console.error("[Feed WS Error]:", err);
      };
    } catch (wsErr) {
      console.error("Failed to connect Feed WS:", wsErr);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [activeCommentPostId, locale]);

  useEffect(() => {
    if (selectedCreateBranchId) {
      api.get<any[]>(`/api/public/branches/${selectedCreateBranchId}/menu`)
        .then(setProductsList)
        .catch(err => console.error("Error loading menu:", err));
    }
  }, [selectedCreateBranchId]);

  // --- Filtering Posts locally on top of paginated results ---
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(p => 
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.tableCheckIn && p.tableCheckIn.toLowerCase().includes(q))
      );
    }

    if (selectedDistrict !== 'Tất cả khu vực') {
      // Find branch matches district
      const targetBranch = branchesList.find(b => b.address?.includes(selectedDistrict));
      if (targetBranch) {
        list = list.filter(p => p.branchId === targetBranch.branchId);
      }
    }

    if (activeHashtagFilter) {
      const cleanHash = activeHashtagFilter.toLowerCase();
      list = list.filter(p => p.content.toLowerCase().includes(cleanHash));
    }

    if (activeStarFilter !== 'Tất cả') {
      if (activeStarFilter === 'Có ảnh/video') {
        list = list.filter(p => p.mediaUrls && p.mediaUrls.trim().length > 0);
      } else {
        const stars = parseInt(activeStarFilter, 10);
        list = list.filter(p => p.rating === stars);
      }
    }

    if (activeReviewTab === 'popular') {
      list.sort((a, b) => b.likesCount - a.likesCount);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [posts, searchText, selectedDistrict, activeHashtagFilter, activeReviewTab, branchesList, activeStarFilter]);

  // --- Action Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const isVideo = files[0].type.includes('video');
    if (isVideo) {
      if (files.length > 1) {
        toast.error(locale === 'vi' ? 'Chỉ được chọn tối đa 1 video.' : 'You can only upload 1 video.');
        return;
      }
      if (files[0].size > 20 * 1024 * 1024) {
        toast.error(locale === 'vi' ? 'Video phải nhỏ hơn 20MB.' : 'Video size must be less than 20MB.');
        return;
      }
    } else {
      if (files.length > 5) {
        toast.error(locale === 'vi' ? 'Chỉ được chọn tối đa 5 hình ảnh.' : 'You can only upload up to 5 images.');
        return;
      }
      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(locale === 'vi' ? 'Mỗi hình ảnh phải nhỏ hơn 5MB.' : 'Each image must be less than 5MB.');
          return;
        }
      }
    }

    setUploadingFiles(true);
    const uploadedUrls: string[] = [];
    try {
      for (const file of files) {
        const res = await api.uploadFile<{ url: string }>('/api/public/feed/upload', file);
        if (res && res.url) {
          uploadedUrls.push(res.url);
        }
      }
      setMediaUrls(prev => [...prev, ...uploadedUrls]);
      toast.success(locale === 'vi' ? 'Tải tệp tin thành công!' : 'Files uploaded successfully!');
    } catch (err) {
      toast.error(locale === 'vi' ? 'Upload file thất bại.' : 'File upload failed.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng điền nội dung review.' : 'Please write post content.');
      return;
    }
    if (content.length > 2000) {
      toast.error(locale === 'vi' ? 'Nội dung tối đa 2000 ký tự.' : 'Content exceeds 2000 characters.');
      return;
    }

    try {
      const payload = {
        content,
        rating,
        tableCheckIn: tableCheckIn || null,
        branchId: selectedCreateBranchId,
        mediaUrls: mediaUrls.join(';'),
        taggedProductIds: taggedProducts.map(p => p.id)
      };

      const res = await api.post<any>('/api/public/feed/posts', payload);
      
      if (res.status === 'PENDING_MODERATION') {
        toast.warning(locale === 'vi' 
          ? 'Bài viết chứa từ nhạy cảm và đang được đưa vào hàng đợi kiểm duyệt!'
          : 'Post contains sensitive words and is pending moderation approval!');
      } else {
        toast.success(locale === 'vi'
          ? 'Đăng bài viết thành công! Bạn nhận được 50 điểm tích lũy.'
          : 'Review posted successfully! You received 50 points.');
      }

      setContent('');
      setRating(5);
      setTableCheckIn('');
      setTaggedProducts([]);
      setMediaUrls([]);
      setPage(0);
      loadFeed(0, false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo bài đăng thất bại.');
    }
  };

  const handleLikeReview = async (postId: number) => {
    if (!user) {
      toast.error(locale === 'vi' ? 'Vui lòng đăng nhập để thích bài viết.' : 'Please sign in to like reviews.');
      return;
    }
    try {
      const res = await api.post<any>(`/api/public/feed/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: res.likesCount } : p));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại.');
    }
  };

  const toggleComments = async (postId: number) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    try {
      const list = await api.get<any[]>(`/api/public/feed/posts/${postId}/comments`);
      setCommentsByPost(prev => ({ ...prev, [postId]: list }));
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const handleSendComment = async (postId: number) => {
    if (!newCommentText.trim()) return;
    try {
      const res = await api.post<any>(`/api/public/feed/posts/${postId}/comment`, {
        content: newCommentText
      });
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res]
      }));
      setNewCommentText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi bình luận.');
    }
  };

  const handleReportPost = async () => {
    if (!reportingPostId) return;
    if (!reportReason.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập lý do báo cáo.' : 'Please fill in report reason.');
      return;
    }
    try {
      await api.post(`/api/public/feed/posts/${reportingPostId}/report`, null, {
        params: { reason: reportReason }
      });
      toast.success(locale === 'vi' 
        ? 'Báo cáo thành công. Bài đăng đã ẩn khỏi tường của bạn.' 
        : 'Reported successfully. Post has been hidden.');
      setPosts(prev => prev.filter(p => p.id !== reportingPostId));
      setReportingPostId(null);
      setReportReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Báo cáo thất bại.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await api.delete(`/api/public/feed/posts/${postId}`, {
        params: { phone: user?.phone || undefined }
      });
      toast.success(locale === 'vi' ? 'Đã xóa bài viết thành công.' : 'Post deleted successfully.');
      setDeletingPostId(null);
    } catch (err: any) {
      toast.error(err.message || (locale === 'vi' ? 'Không thể xóa bài viết.' : 'Failed to delete post.'));
    }
  };

  const handleOpenBooking = (restaurantName: string) => {
    setBookingRestaurant(restaurantName);
    setBookingForm({
      name: user ? user.name : '',
      phone: user ? user.phone || '' : '',
      date: new Date().toISOString().split('T')[0],
      time: '18:30',
      guests: 2,
      notes: ''
    });
    setIsBookedSuccess(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name.trim()) {
      toast.error(t.toastEnterName);
      return;
    }
    if (!bookingForm.phone.trim()) {
      toast.error(t.toastEnterPhone);
      return;
    }
    setIsBookedSuccess(true);
    toast.success(`${t.toastBookingSuccess} ${bookingRestaurant}!`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-105 selection:text-blue-900 overflow-x-hidden">
      
      <Header />

      <section id="review-feed-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-4">
        
        {/* Search bar inside the feed */}
        <div className="mb-6 max-w-3xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text"
            placeholder={t.feedSearchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-700 placeholder-slate-400 shadow-sm transition-all"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* A. LEFT SIDEBAR (Span 3) */}
          <aside className="lg:col-span-3 space-y-6">
            
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
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition ${selectedDistrict === d.name ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
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

          {/* B. MIDDLE COLUMN */}
          <main className="lg:col-span-6 space-y-6">
            
            {/* Create Post Card */}
            {user ? (
              <form onSubmit={handleCreatePost} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-650 text-white flex items-center justify-center text-sm font-black shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{user.name}</h4>
                    <p className="text-[9px] text-slate-400 font-medium">{locale === 'vi' ? 'Đăng bài chất lượng để tích lũy 50 điểm thưởng!' : 'Share a quality review to earn 50 points!'}</p>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={locale === 'vi' ? 'Hãy chia sẻ trải nghiệm ẩm thực của bạn tại đây... (Tối thiểu 50 ký tự kèm hình ảnh để nhận điểm thưởng)' : 'Share your dining experience here... (Min 50 chars with media to earn points)'}
                  className="w-full p-3.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Branch Selector */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{locale === 'vi' ? 'Chọn chi nhánh:' : 'Select branch:'}</label>
                    <select
                      value={selectedCreateBranchId}
                      onChange={(e) => setSelectedCreateBranchId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    >
                      {branchesList.map(b => (
                        <option key={b.branchId} value={b.branchId}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Table Check-In */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{locale === 'vi' ? 'Vị trí bàn ăn:' : 'Table check-in:'}</label>
                    <input
                      type="text"
                      placeholder="E.g. Bàn 12 - Tầng 2"
                      value={tableCheckIn}
                      onChange={(e) => setTableCheckIn(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    />
                  </div>

                  {/* Stars Rating Selector */}
                  <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{locale === 'vi' ? 'Đánh giá:' : 'Rating:'}</label>
                    <div className="flex items-center gap-1.5 h-[34px]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`h-5 w-5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tag Menu Product search */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{locale === 'vi' ? 'Gắn thẻ món ăn từ menu:' : 'Tag menu items:'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={locale === 'vi' ? 'Nhập để tìm món ăn...' : 'Type to search dishes...'}
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-full px-2.5 py-1.5 pl-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    
                    {searchProductQuery && (
                      <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-lg z-20 text-xs">
                        {productsList
                          .filter(p => p.name.toLowerCase().includes(searchProductQuery.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (!taggedProducts.find(x => x.id === p.id)) {
                                  setTaggedProducts([...taggedProducts, p]);
                                }
                                setSearchProductQuery('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex justify-between items-center animate-fade-in"
                            >
                              <span>{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{p.price?.toLocaleString()}đ</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Display Tagged Badges */}
                  {taggedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {taggedProducts.map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                          🏷️ {p.name}
                          <button type="button" onClick={() => setTaggedProducts(taggedProducts.filter(x => x.id !== p.id))}>
                            <X className="h-3 w-3 text-blue-400 hover:text-blue-600" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media Uploader & Preview */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-xs font-bold transition">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                      <span>{locale === 'vi' ? 'Thêm ảnh/video' : 'Attach photo/video'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/mp4"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {uploadingFiles && (
                      <span className="text-[10px] text-slate-400 animate-pulse">{locale === 'vi' ? 'Đang tải file...' : 'Uploading files...'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{content.length}/2000</span>
                    <button
                      type="submit"
                      disabled={uploadingFiles}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition inline-flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      <span>{locale === 'vi' ? 'Đăng' : 'Post'}</span>
                    </button>
                  </div>
                </div>

                {/* Media Preview Thumbnails */}
                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                    {mediaUrls.map((url, idx) => (
                      <div key={idx} className="relative h-14 w-20 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shadow-sm shrink-0">
                        {url.toLowerCase().endsWith('.mp4') ? (
                          <video src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`} alt="thumbnail" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaUrls(mediaUrls.filter(x => x !== url))}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center space-y-3">
                <div className="text-2xl">✨</div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {locale === 'vi' ? 'Đăng bài viết nhận 50 điểm thưởng!' : 'Write Reviews to Earn 50 Points!'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {locale === 'vi' 
                    ? 'Hãy chia sẻ cảm nhận về món ăn và dịch vụ của chúng tôi để nhận điểm tích lũy đổi voucher đặt bàn cực sốc.'
                    : 'Share your dining feedback to collect reward points and redeem cool table discounts.'}
                </p>
                <div className="pt-1.5 flex justify-center gap-3">
                  <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    {t.navSignIn}
                  </Link>
                  <Link href="/customer-portal" className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    {t.navSignUp}
                  </Link>
                </div>
              </div>
            )}

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

            {/* STAR FILTER MATRIX */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
              {['Tất cả', '5 sao', '4 sao', '3 sao', '2 sao', '1 sao', 'Có ảnh/video'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveStarFilter(filter);
                    toast.info(locale === 'vi' ? `Lọc theo: ${filter}` : `Filtered by: ${filter}`);
                  }}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all ${
                    activeStarFilter === filter
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {filter === 'Tất cả' && (locale === 'vi' ? '🌟 Tất cả' : '🌟 All')}
                  {filter === 'Có ảnh/video' && (locale === 'vi' ? '🖼️ Có ảnh/video' : '🖼️ Media Only')}
                  {filter !== 'Tất cả' && filter !== 'Có ảnh/video' && `⭐ ${filter}`}
                </button>
              ))}
            </div>

            {/* Posts Feed */}
            {loading && posts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-full" />
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-3 w-1/3 bg-slate-100 rounded" />
                        <div className="h-2 w-1/4 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-20 bg-slate-50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
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
                {filteredPosts.map((post) => {
                  const isCommentsOpen = activeCommentPostId === post.id;
                  const comments = commentsByPost[post.id] || [];
                  const bName = branchesList.find(b => b.branchId === post.branchId)?.name || 'Hệ thống nhà hàng';

                  return (
                    <article key={post.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
                      
                      {/* Post Header */}
                      <div className="p-5 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-800">{post.authorName}</h4>
                              <span className="text-[9px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-full border border-blue-100">
                                {locale === 'vi' ? 'Thành viên' : 'Member'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {bName}
                              </span>
                              <span>•</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user && user.phone === post.authorPhone && (
                            <button
                              onClick={() => setDeletingPostId(post.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                              title={locale === 'vi' ? 'Xóa bài viết' : 'Delete post'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-amber-700">{post.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-5 space-y-3 flex-1">
                        {post.tableCheckIn && (
                          <div className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-md inline-block">
                            📍 {locale === 'vi' ? 'Đang ngồi tại:' : 'Sitting at:'} {post.tableCheckIn}
                          </div>
                        )}
                        <p className="text-xs text-slate-650 leading-relaxed break-words whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Intelligent Media Grid Preview with Lightbox Click Trigger */}
                        {post.mediaUrls && (() => {
                          const urls = post.mediaUrls.split(';').filter(Boolean);
                          if (urls.length === 0) return null;
                          const displayCount = Math.min(urls.length, 3);
                          return (
                            <div className={`grid gap-2 mt-3 ${
                              displayCount === 1 ? 'grid-cols-1' :
                              displayCount === 2 ? 'grid-cols-2' : 'grid-cols-3'
                            }`}>
                              {urls.slice(0, 3).map((url: string, idx: number) => {
                                const cleanUrl = url.startsWith('http') 
                                  ? url 
                                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`;
                                const isVid = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('video');
                                const isLast = idx === 2 && urls.length > 3;
                                
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => setLightboxMedia({ urls, index: idx })}
                                    className="relative h-28 sm:h-36 rounded-xl overflow-hidden shadow-sm bg-slate-50 border border-slate-100 cursor-zoom-in group"
                                  >
                                    {isVid ? (
                                      <video src={cleanUrl} className="w-full h-full object-cover pointer-events-none" />
                                    ) : (
                                      <img src={cleanUrl} alt="Review Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    )}
                                    {isLast && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-sm backdrop-blur-[1px]">
                                        +{urls.length - 3}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Tagged Products Badges */}
                        {post.taggedProducts && post.taggedProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {post.taggedProducts.map((prod: any) => (
                              <Link 
                                href="/booking"
                                key={prod.id}
                                className="text-[10px] font-bold bg-slate-50 text-slate-650 hover:bg-blue-50 hover:text-blue-600 px-2.5 py-0.5 rounded-full border border-slate-100 transition-colors inline-flex items-center gap-1"
                              >
                                🍽️ {prod.name}
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Official Restaurant Reply */}
                        {post.restaurantReply && (
                          <div className="mt-3 ml-6 pl-4 border-l-4 border-slate-700 bg-slate-50 p-3 rounded-r-xl space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-slate-800 text-white font-extrabold px-2 py-0.5 rounded-full">
                                {locale === 'vi' ? 'Phản hồi từ Nhà hàng' : 'Restaurant Response'}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {post.replyAuthorName} • {new Date(post.repliedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed italic">{post.restaurantReply}</p>
                          </div>
                        )}
                      </div>

                      {/* Post Footer Actions */}
                      <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Like Button */}
                            <button 
                              onClick={() => handleLikeReview(post.id)}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 transition focus:outline-none"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>{post.likesCount} {locale === 'vi' ? 'Thích' : 'Likes'}</span>
                            </button>

                            {/* Comment Button */}
                            <button 
                              onClick={() => toggleComments(post.id)}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition focus:outline-none"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>{locale === 'vi' ? 'Bình luận' : 'Comments'}</span>
                            </button>

                            {/* Report Button */}
                            <button
                              onClick={() => setReportingPostId(post.id)}
                              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition focus:outline-none"
                            >
                              <Flag className="h-3.5 w-3.5" />
                              <span>{locale === 'vi' ? 'Báo cáo' : 'Report'}</span>
                            </button>
                          </div>

                          {/* Booking CTA */}
                          <button
                            onClick={() => handleOpenBooking(bName)}
                            className="bg-blue-55 hover:bg-blue-105 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{t.postBookCTA}</span>
                          </button>
                        </div>

                        {/* Inline Comments Section */}
                        {isCommentsOpen && (
                          <div className="pt-3 border-t border-slate-200/60 space-y-3">
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {comments.length === 0 ? (
                                <p className="text-[10px] text-slate-450 italic py-1">{locale === 'vi' ? 'Chưa có bình luận nào cho bài viết này.' : 'No comments yet.'}</p>
                              ) : (
                                comments.map((c: any) => (
                                  <div key={c.id} className="text-xs bg-white p-2.5 rounded-xl border border-slate-100 flex gap-2">
                                    <div className="font-extrabold text-slate-700 shrink-0">{c.authorName}:</div>
                                    <div className="text-slate-650 flex-1 break-words">{c.content}</div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Write comment field */}
                            {user ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={locale === 'vi' ? 'Viết bình luận...' : 'Write a comment...'}
                                  value={newCommentText}
                                  onChange={(e) => setNewCommentText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSendComment(post.id);
                                  }}
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                                />
                                <button
                                  onClick={() => handleSendComment(post.id)}
                                  className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs hover:bg-blue-750 transition flex items-center justify-center shrink-0"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">{locale === 'vi' ? 'Đăng nhập để bình luận.' : 'Log in to comment.'}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}

                {hasMore && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        loadFeed(nextPage, true);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold px-6 py-2 rounded-xl text-xs shadow-sm transition"
                    >
                      {locale === 'vi' ? 'Xem thêm bài đăng' : 'Load more reviews'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* C. RIGHT SIDEBAR */}
          <aside className="lg:col-span-3 space-y-6">
            
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

            <div className="bg-white/90 rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-50">
                <Award className="h-4 w-4 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">{t.sidebarActiveMembers}</h3>
              </div>
              <div className="space-y-3.5">
                {(leaderboardList.length > 0 
                  ? leaderboardList.map((item: any, idx: number) => ({
                      rank: idx + 1,
                      name: item.name || 'Khách hàng',
                      points: item.loyaltyPoints || 0,
                      avatar: [
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
                        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'
                      ][idx % 5],
                      isTop: idx === 0
                    }))
                  : leaderboardUsers
                ).map((user) => (
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
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {user.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* UGC REPORT MODAL */}
      {reportingPostId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-base">⚠️ {locale === 'vi' ? 'Báo cáo vi phạm' : 'Report Violation'}</h3>
            <p className="text-xs text-slate-500">
              {locale === 'vi'
                ? 'Hãy cung cấp lý do báo cáo bài đăng này. Nếu bài đăng nhận đủ 3 lượt báo cáo từ các thành viên khác nhau, bài đăng sẽ tự động ẩn tạm thời để chờ quản trị viên xử lý.'
                : 'Please specify the reason for reporting this post. Once a post reaches 3 unique reports, it is hidden from the public feed until moderation review.'}
            </p>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={locale === 'vi' ? 'Nhập lý do báo cáo (ví dụ: spam, ngôn từ không phù hợp...)' : 'Enter report reason...'}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-700"
            />
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <button onClick={() => setReportingPostId(null)} className="px-4 py-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                {locale === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button onClick={handleReportPost} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md">
                {locale === 'vi' ? 'Gửi báo cáo' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 text-xl border border-rose-100">
              🗑️
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-800 text-base">
                {locale === 'vi' ? 'Xác nhận xóa bài viết' : 'Delete Post'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {locale === 'vi'
                  ? 'Bạn có chắc chắn muốn xóa bài viết này không? Hành động này sẽ ẩn bài viết khỏi bảng tin công khai.'
                  : 'Are you sure you want to delete this post? This action will hide it from the public feed.'}
              </p>
            </div>
            <div className="flex justify-center gap-2 text-xs font-bold pt-2">
              <button 
                onClick={() => setDeletingPostId(null)} 
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 rounded-xl transition"
              >
                {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button 
                onClick={() => handleDeletePost(deletingPostId)} 
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition"
              >
                {locale === 'vi' ? 'Đồng ý xóa' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA LIGHTBOX CAROUSEL MODAL */}
      {lightboxMedia && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full z-50 transition"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="relative max-w-4xl w-full h-[80vh] flex items-center justify-center">
            {/* Left navigation arrow */}
            {lightboxMedia.index > 0 && (
              <button 
                onClick={() => setLightboxMedia(prev => prev ? { ...prev, index: prev.index - 1 } : null)}
                className="absolute left-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full z-50 transition focus:outline-none"
              >
                ◀
              </button>
            )}

            {/* Current displaying image/video */}
            {(() => {
              const url = lightboxMedia.urls[lightboxMedia.index];
              const cleanUrl = url.startsWith('http') 
                ? url 
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`;
              const isVid = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('video');
              
              return isVid ? (
                <video src={cleanUrl} className="max-w-full max-h-full rounded-lg object-contain" controls autoPlay />
              ) : (
                <img src={cleanUrl} alt="Lightbox Preview" className="max-w-full max-h-full rounded-lg object-contain" />
              );
            })()}

            {/* Right navigation arrow */}
            {lightboxMedia.index < lightboxMedia.urls.length - 1 && (
              <button 
                onClick={() => setLightboxMedia(prev => prev ? { ...prev, index: prev.index + 1 } : null)}
                className="absolute right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full z-50 transition focus:outline-none"
              >
                ▶
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingRestaurant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelName}</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                    placeholder={t.bookingPlaceholderName}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelPhone}</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                    placeholder={t.bookingPlaceholderPhone}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelDate}</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelTime}</label>
                    <select
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-750"
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelGuests}</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm({...bookingForm, guests: parseInt(e.target.value) || 2})}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bookingLabelNotes}</label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    placeholder={t.bookingPlaceholderNotes}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-white text-slate-700"
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

      <Footer />

    </div>
  );
}
