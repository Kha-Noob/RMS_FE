'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import {
  Search,
  MapPin,
  Utensils,
  Heart,
  Calendar,
  ChevronRight,
  Star,
  Award,
  Phone,
  Mail,
  X,
  CheckCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

// --- Types & Interfaces ---
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // --- Search & Filter States ---
  const [searchText, setSearchText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả khu vực');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả loại hình');
  const [sortBy, setSortBy] = useState('Sắp xếp');
  
  // --- Wishlist State ---
  const [wishlistedRestaurants, setWishlistedRestaurants] = useState<Record<string, boolean>>({});

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
      
      // Hero
      heroBadge: 'Nền tảng tìm kiếm ẩm thực hàng đầu của bạn',
      heroTitle: 'Khám phá & Đặt bàn tại những nhà hàng tuyệt vời',
      heroDesc: 'Tìm kiếm nhà hàng yêu thích, xem thông tin chi tiết, thực đơn và đặt bàn nhanh chóng, dễ dàng.',
      
      // Search
      searchPlaceholder: 'Tìm kiếm nhà hàng, món ăn, địa điểm...',
      filterDistrict: 'Tất cả khu vực',
      filterCuisine: 'Tất cả loại hình',
      filterSort: 'Sắp xếp',
      searchBtn: 'Tìm kiếm',
      activeFilters: 'Bộ lọc đang áp dụng:',
      clearFilters: 'Xóa bộ lọc',
      toastFilterUpdated: 'Đã cập nhật bộ lọc hiển thị!',
      
      // Districts
      districts: {
        'Tất cả khu vực': 'Tất cả khu vực',
        'Quận Hoàn Kiếm': 'Quận Hoàn Kiếm',
        'Quận Cầu Giấy': 'Quận Cầu Giấy',
        'Quận Tây Hồ': 'Quận Tây Hồ',
        'Quận Đống Đa': 'Quận Đống Đa'
      },
      cuisines: {
        'Tất cả loại hình': 'Tất cả loại hình',
        'Fine Dining': 'Fine Dining',
        'Món Việt': 'Món Việt',
        'Lounge & Cocktail': 'Lounge & Cocktail',
        'Hải sản': 'Hải sản'
      },
      sorts: {
        'Sắp xếp': 'Sắp xếp',
        'Đánh giá cao nhất': 'Đánh giá cao nhất',
        'Phổ biến nhất': 'Phổ biến nhất'
      },
      
      // Grid
      gridTitle: 'Nhà hàng nổi bật',
      gridBadge: 'Hot nhất tuần này',
      gridBtnViewAll: 'Xem tất cả',
      gridDistance: 'Khoảng cách:',
      gridBtnBook: 'Đặt bàn ngay',
      noRestaurant: 'Không tìm thấy nhà hàng nào khớp với tìm kiếm',
      noRestaurantDesc: 'Thử điều chỉnh lại từ khóa hoặc xóa các bộ lọc hiện tại để xem thêm kết quả.',
      toastWishlistAdd: 'Đã thêm nhà hàng vào danh sách yêu thích!',
      toastWishlistRemove: 'Đã xóa nhà hàng khỏi danh sách yêu thích!',
      
      // About Us Section
      aboutTag: 'Về chúng tôi - RMS',
      aboutTitle: 'Sứ mệnh kết nối tinh hoa ẩm thực',
      aboutDesc: 'RMS được sinh ra với mong muốn rút ngắn khoảng cách giữa thực khách và các nhà hàng cao cấp. Chúng tôi không chỉ cung cấp dịch vụ tìm kiếm và đặt bàn nhanh chóng, mà còn xây dựng cộng đồng đánh giá ẩm thực uy tín, nơi các tín đồ ẩm thực chia sẻ trải nghiệm chân thực.',
      aboutStat1: 'Nhà hàng đối tác',
      aboutStat2: 'Thực khách tin dùng',
      aboutStat3: 'Dịch vụ tận tâm',
      aboutOverlay: 'Đồng hành cùng thực khách Việt',
      
      // Booking Modal
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
      bookingBtnCancel: 'Hủy bộ',
      bookingBtnConfirm: 'Xác nhận đặt',
      bookingBtnComplete: 'Hoàn tất',
      bookingCustomer: 'Khách hàng',
      bookingPhone: 'Số điện thoại',
      bookingTime: 'Thời gian',
      bookingGuests: 'Số khách',
      toastEnterName: 'Vui lòng nhập họ và tên',
      toastEnterPhone: 'Vui lòng nhập số điện thoại',
      toastBookingSuccess: 'Đặt bàn thành công tại',
      
      // Promotion & Contact Banners
      bannerHelpTitle: 'Bạn cần hỗ trợ?',
      bannerHelpDesc: 'Liên hệ với đội ngũ CSKH của chúng tôi để được tư vấn dịch vụ tốt nhất.',
      bannerContactTitle: 'Contact Us',
      bannerContactSubtitle: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn!',
      bannerContactBtn: 'Liên hệ ngay',
      bannerHotline: 'Hotline 24/7',
      bannerEmail: 'Gửi Email',
      toastContactInfo: 'Hotline hỗ trợ: 1900 1234. Email: support@rms.com',
      
      // USP Banners
      usp1Title: 'Đặt bàn dễ dàng',
      usp1Desc: 'Chọn nhà hàng, chọn thời gian và đặt bàn chỉ với vài thao tác',
      usp2Title: 'Xác nhận nhanh chóng',
      usp2Desc: 'Nhà hàng sẽ xác nhận đặt bàn trong thời gian sớm nhất',
      usp3Title: 'Ưu đãi hấp dẫn',
      usp3Desc: 'Nhận nhiều ưu đãi và khuyến mãi độc quyền từ nhà hàng',
      usp4Title: 'Hỗ trợ 24/7',
      usp4Desc: 'Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn',
      
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
      
      // Hero
      heroBadge: 'Your Premium Culinary Discovery Platform',
      heroTitle: 'Discover & Book Tables at Amazing Restaurants',
      heroDesc: 'Search for your favorite restaurants, view details, menu, and book tables quickly and easily.',
      
      // Search
      searchPlaceholder: 'Search restaurants, dishes, locations...',
      filterDistrict: 'All Districts',
      filterCuisine: 'All Cuisines',
      filterSort: 'Sort By',
      searchBtn: 'Search',
      activeFilters: 'Active Filters:',
      clearFilters: 'Clear Filters',
      toastFilterUpdated: 'Filters updated successfully!',
      
      // Districts
      districts: {
        'Tất cả khu vực': 'All Districts',
        'Quận Hoàn Kiếm': 'Hoan Kiem District',
        'Quận Cầu Giấy': 'Cau Giay District',
        'Quận Tây Hồ': 'Tay Ho District',
        'Quận Đống Đa': 'Dong Da District'
      },
      cuisines: {
        'Tất cả loại hình': 'All Cuisines',
        'Fine Dining': 'Fine Dining',
        'Món Việt': 'Vietnamese Cuisine',
        'Lounge & Cocktail': 'Lounge & Cocktail',
        'Hải sản': 'Seafood'
      },
      sorts: {
        'Sắp xếp': 'Sort By',
        'Đánh giá cao nhất': 'Highest Rating',
        'Phổ biến nhất': 'Most Popular'
      },
      
      // Grid
      gridTitle: 'Featured Restaurants',
      gridBadge: 'Trending This Week',
      gridBtnViewAll: 'View All',
      gridDistance: 'Distance:',
      gridBtnBook: 'Book Now',
      noRestaurant: 'No restaurants match your search',
      noRestaurantDesc: 'Try adjusting your keywords or clearing current filters to see more results.',
      toastWishlistAdd: 'Added to your wishlist!',
      toastWishlistRemove: 'Removed from your wishlist!',
      
      // About Us Section
      aboutTag: 'About Us - RMS',
      aboutTitle: 'Our Mission to Connect Culinary Excellence',
      aboutDesc: 'RMS was born with the vision to bridge the gap between diners and premium restaurants. We don\'t just provide fast search and table booking services, but also build a reputable food review community where food lovers share authentic experiences.',
      aboutStat1: 'Partner Restaurants',
      aboutStat2: 'Happy Diners',
      aboutStat3: 'Dedicated Service',
      aboutOverlay: 'Accompanying Vietnamese Diners',
      
      // Booking Modal
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
      
      // Promotion & Contact Banners
      bannerHelpTitle: 'Need Assistance?',
      bannerHelpDesc: 'Contact our customer support team for the best service consultation.',
      bannerContactTitle: 'Contact Us',
      bannerContactSubtitle: 'We are always ready to help you!',
      bannerContactBtn: 'Contact Now',
      bannerHotline: '24/7 Hotline',
      bannerEmail: 'Send Email',
      toastContactInfo: 'Support Hotline: 1900 1234. Email: support@rms.com',
      
      // USP Banners
      usp1Title: 'Easy Booking',
      usp1Desc: 'Choose restaurant, choose time, and book table in just a few clicks',
      usp2Title: 'Quick Confirmation',
      usp2Desc: 'Restaurant will confirm your booking as soon as possible',
      usp3Title: 'Attractive Offers',
      usp3Desc: 'Receive exclusive deals and promotions from the restaurant',
      usp4Title: '24/7 Support',
      usp4Desc: 'Our support team is always ready to assist you',
      
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

  // --- Mock Database ---
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

  // --- Filtering Logic for Restaurants ---
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];

    // Filter by search text (name or categories)
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.categories.some(cat => cat.toLowerCase().includes(q))
      );
    }

    // Filter by district (location)
    if (selectedDistrict !== 'Tất cả khu vực') {
      const districtShort = selectedDistrict.replace('Quận ', '');
      list = list.filter(r => r.location.toLowerCase().includes(districtShort.toLowerCase()));
    }

    // Filter by cuisine type (categories)
    if (selectedCuisine !== 'Tất cả loại hình') {
      const cuisineShort = selectedCuisine.split(' & ')[0];
      list = list.filter(r => 
        r.categories.some(cat => 
          cat.toLowerCase().includes(cuisineShort.toLowerCase()) || 
          cuisineShort.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Sort logic
    if (sortBy === 'Đánh giá cao nhất') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'Phổ biến nhất') {
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    return list;
  }, [searchText, selectedDistrict, selectedCuisine, sortBy]);

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

          {/* Nav Items - Pill shaped (Khám phá is active) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-blue-50/50 p-1 rounded-full border border-blue-100/50">
            <Link 
              href="/"
              className="rounded-full bg-white shadow-sm px-4 py-1.5 text-sm font-bold text-blue-600 transition-all"
            >
              {t.navExplore}
            </Link>
            <Link 
              href="/feed"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navFeed}
            </Link>
            <Link 
              href="/events"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navEvents}
            </Link>
            <a 
              href="#about-us-section"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navAbout}
            </a>
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

            {/* Premium Book a Table CTA button */}
            <Link 
              href="/booking" 
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 hover:scale-102 active:scale-98 text-white px-4.5 py-2 text-xs font-black shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 text-white" />
              <span>{locale === 'vi' ? 'Đặt bàn ngay' : 'Book Table'}</span>
            </Link>

            {/* Nút dẫn vào phần mềm quản lý nhà hàng */}
            <Link 
              href="/dashboard" 
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/40 hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:scale-102 hover:shadow"
            >
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span>{t.navSys}</span>
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-full border border-blue-100/75 transition duration-200 cursor-pointer focus:outline-none shadow-sm"
                >
                  <div className="h-6.5 w-6.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black uppercase shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-blue-900 hidden sm:inline max-w-[120px] truncate select-none">
                    {user.name}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-blue-600 transition-transform duration-250 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50 animate-fade-in-scale">
                      <Link 
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Utensils className="h-4 w-4 text-slate-400" />
                        <span>{locale === 'vi' ? 'Nhà hàng của tôi' : 'My Restaurant'}</span>
                      </Link>
                      <Link 
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        <span>{locale === 'vi' ? 'Trang cá nhân' : 'My Profile'}</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setUserDropdownOpen(false);
                          toast.info(locale === 'vi' ? 'Tính năng lịch sử đặt bàn đang được phát triển!' : 'Booking history feature is under development!');
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{locale === 'vi' ? 'Lịch sử đặt bàn' : 'Booking History'}</span>
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button 
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{locale === 'vi' ? 'Đăng xuất' : 'Log Out'}</span>
                      </button>
                    </div>
                  </>
                )}
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

      {/* 2. HEADER SEARCH SECTION */}
      <section id="search-section" className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-indigo-50/30 to-[#F8FAFC] pt-16 pb-14">
        {/* Background design accents */}
        <div className="absolute top-[-20%] left-[-10%] h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute bottom-10 right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 text-center relative z-10 space-y-8">
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
            <span>{t.heroBadge}</span>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent">
              {t.heroTitle}
            </h1>
            <p className="text-base text-slate-500 sm:text-lg max-w-2xl mx-auto">
              {t.heroDesc}
            </p>
          </div>

          {/* Floating Search Container - Redesigned with Search Input on Top */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xl p-5 max-w-4xl mx-auto transition-all duration-300 flex flex-col gap-4 text-left">
            
            {/* Input Keyword - Full width on top */}
            <div className="w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder={t.searchPlaceholder}
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
                  <option value="Tất cả khu vực">{t.districts['Tất cả khu vực']}</option>
                  <option value="Quận Hoàn Kiếm">{t.districts['Quận Hoàn Kiếm']}</option>
                  <option value="Quận Cầu Giấy">{t.districts['Quận Cầu Giấy']}</option>
                  <option value="Quận Tây Hồ">{t.districts['Quận Tây Hồ']}</option>
                  <option value="Quận Đống Đa">{t.districts['Quận Đống Đa']}</option>
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
                  <option value="Tất cả loại hình">{t.cuisines['Tất cả loại hình']}</option>
                  <option value="Fine Dining">{t.cuisines['Fine Dining']}</option>
                  <option value="Món Việt">{t.cuisines['Món Việt']}</option>
                  <option value="Lounge & Cocktail">{t.cuisines['Lounge & Cocktail']}</option>
                  <option value="Hải sản">{t.cuisines['Hải sản']}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort Select */}
              <div className="relative w-full">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer text-slate-750 truncate shadow-sm"
                >
                  <option value="Sắp xếp">{t.sorts['Sắp xếp']}</option>
                  <option value="Đánh giá cao nhất">{t.sorts['Đánh giá cao nhất']}</option>
                  <option value="Phổ biến nhất">{t.sorts['Phổ biến nhất']}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Search Submit CTA */}
              <button 
                onClick={() => {
                  const section = document.getElementById('featured-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                  toast.info(t.toastFilterUpdated);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white rounded-xl py-3 px-4 text-sm font-semibold shadow-md transition-all duration-200 active:scale-98 cursor-pointer text-center"
              >
                {t.searchBtn}
              </button>
            </div>

            {/* Active Filters Summary */}
            {(searchText || selectedDistrict !== 'Tất cả khu vực' || selectedCuisine !== 'Tất cả loại hình') && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-blue-950">{t.activeFilters}</span>
                {searchText && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    "{searchText}"
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setSearchText('')} />
                  </span>
                )}
                {selectedDistrict !== 'Tất cả khu vực' && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    {t.districts[selectedDistrict as keyof typeof t.districts] || selectedDistrict}
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedDistrict('Tất cả khu vực')} />
                  </span>
                )}
                {selectedCuisine !== 'Tất cả loại hình' && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                    {t.cuisines[selectedCuisine as keyof typeof t.cuisines] || selectedCuisine}
                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedCuisine('Tất cả loại hình')} />
                  </span>
                )}
                <button 
                  onClick={() => {
                    setSearchText('');
                    setSelectedDistrict('Tất cả khu vực');
                    setSelectedCuisine('Tất cả loại hình');
                    setSortBy('Sắp xếp');
                  }}
                  className="text-slate-400 hover:text-blue-600 transition text-xs font-bold"
                >
                  {t.clearFilters}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. FEATURED RESTAURANTS GRID */}
      <section id="featured-section" className="bg-gradient-to-b from-white to-blue-50/20 border-y border-blue-100/50 py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">{t.gridTitle}</h2>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                {t.gridBadge}
              </span>
            </div>
            <button 
              onClick={() => toast.info(locale === 'vi' ? 'Tính năng xem danh sách chi tiết sẽ sớm ra mắt!' : 'Full listings page coming soon!')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>{t.gridBtnViewAll}</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Responsive 4-Column Restaurant Grid */}
          {filteredRestaurants.length === 0 ? (
            <div className="bg-white/80 rounded-2xl border border-slate-100 py-16 px-6 text-center space-y-3">
              <div className="text-3xl">🍲</div>
              <h3 className="font-bold text-slate-700">{t.noRestaurant}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {t.noRestaurantDesc}
              </p>
              <button 
                onClick={() => {
                  setSearchText('');
                  setSelectedDistrict('Tất cả khu vực');
                  setSelectedCuisine('Tất cả loại hình');
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRestaurants.map((rest) => {
                const isWishlisted = wishlistedRestaurants[rest.id] || false;

                // Dynamic translation maps for mock data badges & categories
                const badgeText = rest.badge ? (
                  locale === 'vi' ? rest.badge : { 'Mới': 'New', 'Ưu đãi': 'Offer', 'Đặt nhiều': 'Popular' }[rest.badge] || rest.badge
                ) : null;

                const translateCategory = (cat: string) => {
                  if (locale === 'vi') return cat;
                  const dict: Record<string, string> = {
                    'Hải sản': 'Seafood',
                    'Á Âu': 'Asian-Western',
                    'Sang trọng': 'Luxury',
                    'Bar': 'Bar',
                    'Cocktail': 'Cocktail',
                    'View đẹp': 'Nice View',
                    'Món Việt': 'Vietnamese',
                    'Mộc mạc': 'Rustic',
                    'Ấm cúng': 'Cozy',
                    'Bình dân': 'Casual',
                    'Gia định': 'Family',
                    'Sân vườn': 'Garden',
                    'Lãng mạn': 'Romantic',
                    'Yên tĩnh': 'Quiet',
                    'Nhạc sống': 'Live Music'
                  };
                  return dict[cat] || cat;
                };

                return (
                  <div key={rest.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
                    
                    {/* Restaurant Image */}
                    <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                      <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      {/* Top-Left Badge */}
                      {badgeText && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md">
                          {badgeText}
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
                          <span className="text-slate-400">({rest.reviewsCount} {locale === 'vi' ? 'đánh giá' : 'reviews'})</span>
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
                              {translateCategory(cat)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Book Now Button */}
                      <button
                        onClick={() => router.push('/booking')}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 group-hover:shadow-md"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>{t.gridBtnBook}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* 5. ABOUT US SECTION */}
      <section id="about-us-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-transparent rounded-3xl border border-blue-100/50 mt-12 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
          {/* Left Block: Slogan & Mission */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
              <span>{t.aboutTag}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 leading-tight">
              {t.aboutTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.aboutDesc}
            </p>
            {/* Stat indicators */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-100">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 block">50+</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{t.aboutStat1}</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 block">10,000+</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{t.aboutStat2}</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 block">24/7</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{t.aboutStat3}</span>
              </div>
            </div>
          </div>

          {/* Right Block: Image with card overlays */}
          <div className="lg:col-span-5 relative">
            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-100 relative">
              <img 
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600" 
                alt="RMS Team Culinary" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              {/* Overlay card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/50 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow">
                  R
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">RMS Platform</span>
                  <span className="text-[10px] text-slate-500">{t.aboutOverlay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PROMOTION & CONTACT BANNERS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Banner 1: Contact Us */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Block */}
          <div className="flex items-center gap-4 md:w-1/3">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-800">{t.bannerHelpTitle}</h4>
              <p className="text-xs text-slate-500 leading-normal">
                {t.bannerHelpDesc}
              </p>
            </div>
          </div>

          {/* Middle Block */}
          <div className="flex flex-col items-center text-center space-y-3 md:w-1/3">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{t.bannerContactTitle}</h3>
            <p className="text-xs text-slate-500">{t.bannerContactSubtitle}</p>
            <button 
              onClick={() => toast.info(t.toastContactInfo)}
              className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl py-2.5 px-6 text-xs font-bold shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-98"
            >
              <span>{t.bannerContactBtn}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right Block */}
          <div className="flex flex-col gap-3 md:w-1/3 text-left">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-600 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">{t.bannerHotline}</span>
                <span className="text-xs font-extrabold text-slate-800">1900 1234</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-600 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">{t.bannerEmail}</span>
                <span className="text-xs font-extrabold text-slate-800">support@rms.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner 2: Core Values (USPs) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* USP 1 */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800">{t.usp1Title}</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                {t.usp1Desc}
              </p>
            </div>
          </div>

          {/* USP 2 */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800">{t.usp2Title}</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                {t.usp2Desc}
              </p>
            </div>
          </div>

          {/* USP 3 */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800">{t.usp3Title}</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                {t.usp3Desc}
              </p>
            </div>
          </div>

          {/* USP 4 */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Phone className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800">{t.usp4Title}</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                {t.usp4Desc}
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* 7. PLATFORM FOOTER */}
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
