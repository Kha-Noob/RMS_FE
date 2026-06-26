'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import {
  Calendar,
  MapPin,
  Clock,
  Utensils,
  ChevronRight,
  Star,
  Award,
  Phone,
  Mail,
  X,
  CheckCircle,
  LogOut,
  Sparkles,
  Ticket,
  Users
} from 'lucide-react';

// --- Types & Interfaces ---
interface CulinaryEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  restaurantName: string;
  tag: 'Festival' | 'Fine Dining' | 'Workshop';
  imageUrl: string;
  price: string;
  capacity: string;
  description: string;
  highlights: string[];
}

export default function EventsPage() {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLanguage();

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
      
      // Events Header
      eventsHeroBadge: 'Đặc quyền trải nghiệm tinh hoa ẩm thực đỉnh cao',
      eventsHeroTitle: 'Sự Kiện Ẩm Thực Đặc Sắc',
      eventsHeroDesc: 'Đồng hành cùng những lễ hội ẩm thực náo nhiệt, đêm nhạc ngắm hoàng hôn lãng mạn hay các buổi học làm món ăn trực tiếp cùng Bếp trưởng chuyên nghiệp.',
      
      // Categories
      catAll: 'Tất cả',
      catFestival: 'Festival',
      catFineDining: 'Fine Dining',
      catWorkshop: 'Workshop',
      toastFilterGroup: 'Đang hiển thị sự kiện thuộc nhóm:',
      
      // Event Info & Details
      eventPriceFree: 'Miễn phí vào cửa',
      eventPriceUnit: 'khách',
      eventPriceTicket: 'vé (gồm 1 đồ uống)',
      eventCapacityUnlimited: 'Không giới hạn',
      eventCapacityUnit: 'khách',
      eventCapacityStudent: 'học viên',
      eventScale: 'Quy mô:',
      eventBtnDetails: 'Xem chi tiết',
      eventBtnBook: 'Đăng ký chỗ',
      eventDetailTitle: 'Giới thiệu sự kiện',
      eventDetailHighlight: 'Hoạt động nổi bật',
      eventDetailVenue: 'Địa điểm tổ chức',
      eventBtnClose: 'Đóng lại',
      eventBtnBookTicket: 'Đăng ký vé & Đặt bàn',
      
      // Dialogs / Booking Modal
      bookingTitle: 'Phiếu Đặt Bàn',
      bookingSubtitle: 'Đặt bàn tại',
      bookingSuccess: 'Đặt bàn thành công!',
      bookingCodeText: 'Mã đặt bàn của bạn là',
      bookingConfirmContact: 'Nhân viên nhà hàng sẽ liên hệ lại với bạn trong vòng 10 phút để xác nhận vé sự kiện và chỗ ngồi.',
      bookingLabelName: 'Họ và tên *',
      bookingLabelPhone: 'Số điện thoại *',
      bookingLabelDate: 'Chọn ngày *',
      bookingLabelTime: 'Giờ đặt *',
      bookingLabelGuests: 'Số lượng khách *',
      bookingLabelNotes: 'Ghi chú đặc biệt / Ghi chú Sự kiện',
      bookingPlaceholderName: 'VD: Nguyễn Văn A',
      bookingPlaceholderPhone: 'VD: 0912345678',
      bookingPlaceholderNotes: 'VD: Muốn ngồi cạnh sân khấu, đăng ký vé Vip...',
      bookingBtnCancel: 'Hủy bỏ',
      bookingBtnConfirm: 'Xác nhận đặt',
      bookingBtnComplete: 'Hoàn tất',
      bookingCustomer: 'Khách hàng',
      bookingPhone: 'Số điện thoại',
      bookingTime: 'Thời gian',
      bookingGuests: 'Số khách',
      bookingNotes: 'Ghi chú',
      toastEnterName: 'Vui lòng nhập họ và tên',
      toastEnterPhone: 'Vui lòng nhập số điện thoại',
      toastBookingSuccess: 'Đặt chỗ thành công tại',
      
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
      
      // Events Header
      eventsHeroBadge: 'Exclusive privileges to experience culinary excellence',
      eventsHeroTitle: 'Culinary Events & Offers',
      eventsHeroDesc: 'Join exciting culinary festivals, romantic sunset acoustic nights, or hands-on cooking masterclasses with professional Head Chefs.',
      
      // Categories
      catAll: 'All',
      catFestival: 'Festival',
      catFineDining: 'Fine Dining',
      catWorkshop: 'Workshop',
      toastFilterGroup: 'Displaying events in group:',
      
      // Event Info & Details
      eventPriceFree: 'Free Admission',
      eventPriceUnit: 'guest',
      eventPriceTicket: 'ticket (includes 1 drink)',
      eventCapacityUnlimited: 'Unlimited',
      eventCapacityUnit: 'guests',
      eventCapacityStudent: 'students',
      eventScale: 'Capacity:',
      eventBtnDetails: 'View Details',
      eventBtnBook: 'Register Venue',
      eventDetailTitle: 'About the Event',
      eventDetailHighlight: 'Key Highlights',
      eventDetailVenue: 'Event Venue',
      eventBtnClose: 'Close',
      eventBtnBookTicket: 'Book Ticket & Table',
      
      // Dialogs / Booking Modal
      bookingTitle: 'Booking Voucher',
      bookingSubtitle: 'Book table at',
      bookingSuccess: 'Booking Successful!',
      bookingCodeText: 'Your booking code is',
      bookingConfirmContact: 'Restaurant staff will contact you within 10 minutes to confirm event tickets and seating.',
      bookingLabelName: 'Full name *',
      bookingLabelPhone: 'Phone number *',
      bookingLabelDate: 'Select date *',
      bookingLabelTime: 'Select time *',
      bookingLabelGuests: 'Guest count *',
      bookingLabelNotes: 'Special notes / Event notes',
      bookingPlaceholderName: 'E.g., John Doe',
      bookingPlaceholderPhone: 'E.g., 0912345678',
      bookingPlaceholderNotes: 'E.g., Window seat, VIP ticket registration...',
      bookingBtnCancel: 'Cancel',
      bookingBtnConfirm: 'Confirm Booking',
      bookingBtnComplete: 'Complete',
      bookingCustomer: 'Customer',
      bookingPhone: 'Phone',
      bookingTime: 'Time',
      bookingGuests: 'Guests',
      bookingNotes: 'Notes',
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

  // --- States ---
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [selectedEvent, setSelectedEvent] = useState<CulinaryEvent | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const eventIdStr = params.get('id');
      if (eventIdStr) {
        const eventId = parseInt(eventIdStr);
        const match = culinaryEvents.find(e => e.id === eventId);
        if (match) {
          setSelectedEvent(match);
        }
      }
    }
  }, []);

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

  // --- Mock Database for Culinary Events ---
  const culinaryEvents: CulinaryEvent[] = [
    {
      id: 1,
      title: 'Lễ hội Tinh hoa Ẩm thực Đường phố',
      date: '28/06 - 30/06/2026',
      time: '16:00 - 22:00',
      location: 'Phố đi bộ Hồ Gươm, Hoàn Kiếm, Hà Nội',
      restaurantName: 'RMS Premium Catering',
      tag: 'Festival',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
      price: 'Miễn phí vào cửa',
      capacity: 'Không giới hạn',
      description: 'Lễ hội quy tụ hơn 50 gian hàng ẩm thực đường phố đặc sắc từ khắp các vùng miền Việt Nam và các nước châu Á. Du khách sẽ được thưởng thức các món ăn truyền thống được chế biến bởi các đầu bếp hàng đầu, tham gia các trò chơi dân gian ẩm thực và thưởng thức đêm nhạc Acoustic đường phố náo nhiệt.',
      highlights: ['Hơn 50 gian hàng ẩm thực đặc sắc', 'Biểu diễn nhạc sống Acoustic mỗi tối', 'Trải nghiệm tự tay làm bánh dân gian']
    },
    {
      id: 2,
      title: 'Đêm nhạc Acoustic & Fine Wine Tasting',
      date: '04/07/2026',
      time: '19:30 - 22:30',
      location: 'Tầng 25, Skyline Lounge, Cầu Giấy, Hà Nội',
      restaurantName: 'Skyline Lounge',
      tag: 'Fine Dining',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600',
      price: '850.000đ / khách',
      capacity: '40 khách',
      description: 'Hòa mình vào không gian lộng gió trên cao, thưởng thức ly rượu vang thượng hạng được tuyển chọn từ các vùng nho nổi tiếng nước Pháp và Ý, kết hợp hài hòa với thực đơn Canapes hải sản tinh tế. Đêm tiệc được đệm nhạc Acoustic guitar mộc mạc và du dương đón hoàng hôn thành phố.',
      highlights: ['Thử nếm 5 dòng rượu vang thượng hạng', 'Thực đơn Canapes hải sản cao cấp', 'View ngắm trọn hoàng hôn từ tầng cao']
    },
    {
      id: 3,
      title: 'Masterclass: Nghệ thuật làm Sushi truyền thống',
      date: '12/07/2026',
      time: '09:00 - 12:00',
      location: 'The Én Restaurant, Hoàn Kiếm, Hà Nội',
      restaurantName: 'The Én Restaurant',
      tag: 'Workshop',
      imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600',
      price: '1.200.000đ / khách',
      capacity: '15 học viên',
      description: 'Khóa học thực hành trực tiếp cùng Bếp trưởng người Nhật với hơn 15 năm kinh nghiệm. Bạn sẽ được hướng dẫn từ khâu chọn cá hồi tươi sống, kỹ thuật nấu và trộn cơm giấm Shari chuẩn vị, đến nghệ thuật cuốn maki, nigiri đẹp mắt. Cuối buổi học là thời gian thưởng thức thành quả cùng trà xanh thượng hạng.',
      highlights: ['Hướng dẫn trực tiếp bởi bếp trưởng Nhật Bản', 'Nguyên liệu cá hồi/sò điệp nhập khẩu tươi ngon', 'Chứng nhận hoàn thành Masterclass từ The Én']
    },
    {
      id: 4,
      title: 'Lễ hội Bia thủ công và Đồ nướng BBQ khổng lồ',
      date: '18/07 - 19/07/2026',
      time: '17:00 - 23:00',
      location: 'Vườn bia ngoài trời Cục Gạch Quán, Đống Đa, Hà Nội',
      restaurantName: 'Cục Gạch Quán',
      tag: 'Festival',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
      price: '150.000đ / vé (gồm 1 đồ uống)',
      capacity: '300 khách',
      description: 'Lễ hội thưởng thức hơn 20 loại bia thủ công đặc sắc từ các xưởng nấu bia danh tiếng Việt Nam kết hợp với đại tiệc nướng sườn tảng khổng lồ, bò Mỹ hun khói bằng gỗ sồi thơm nức. Không gian lễ hội trẻ trung sôi động với ban nhạc Rock nhẹ ngoài trời.',
      highlights: ['Hơn 20 vị bia thủ công độc đáo', 'BBQ hun khói khổng lồ chuẩn vị Mỹ', 'Đêm nhạc Rock & Gameshow vui nhộn']
    },
    {
      id: 5,
      title: 'Đại tiệc Truffle trắng nước Ý (Truffle Fine Dining)',
      date: '25/07/2026',
      time: '18:30 - 21:30',
      location: 'Phòng VIP Hoàng Gia, Tầm Vị Restaurant, Tây Hồ, Hà Nội',
      restaurantName: 'Tầm Vị Restaurant',
      tag: 'Fine Dining',
      imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=600',
      price: '3.500.000đ / khách',
      capacity: '20 khách',
      description: 'Một hành trình ẩm thực xa hoa tôn vinh "kim cương trắng" của giới ẩm thực - Truffle Alba nhập khẩu trực tiếp từ Ý. Bếp trưởng thiết kế thực đơn 6 món Fine Dining kết hợp tài tình truffle bào mỏng trên nền mì tươi làm tay, súp kem măng tây và thăn bò Wagyu nướng sốt truffle.',
      highlights: ['Truffle trắng Alba tươi nhập khẩu trực tiếp', 'Thực đơn 6 món Fine Dining kết hợp rượu vang Ý', 'Không gian phòng VIP sang trọng, riêng tư']
    },
    {
      id: 6,
      title: 'Workshop: Nghệ thuật pha chế Cocktails cổ điển',
      date: '02/08/2026',
      time: '14:30 - 17:30',
      location: 'Skyline Lounge Bar, Cầu Giấy, Hà Nội',
      restaurantName: 'Skyline Lounge',
      tag: 'Workshop',
      imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600',
      price: '500.000đ / khách',
      capacity: '25 học viên',
      description: 'Tìm hiểu lịch sử và nghệ thuật đằng sau các ly cocktail cổ điển trường tồn với thời gian như Old Fashioned, Negroni, Whiskey Sour. Bạn được hướng dẫn kỹ năng lắc shaker, khuấy barspoon chuẩn xác và tự tay pha chế 3 ly cocktail của riêng mình dưới sự chỉ dẫn của các Bartender hàng đầu.',
      highlights: ['Học lý thuyết và thực hành pha chế 3 ly cocktail', 'Bộ dụng cụ pha chế chuyên nghiệp trang bị riêng', 'Quà tặng công thức pha chế độc quyền từ Bar trưởng']
    }
  ];

  const filteredEvents = useMemo(() => {
    if (selectedTag === 'Tất cả') return culinaryEvents;
    return culinaryEvents.filter(e => e.tag === selectedTag);
  }, [selectedTag]);

  const translatedEvents = useMemo(() => {
    return filteredEvents.map(evt => {
      if (locale === 'vi') return evt;
      const dict: Record<number, Partial<CulinaryEvent>> = {
        1: {
          title: 'Street Food Essence Festival',
          date: '28/06 - 30/06/2026',
          location: 'Hoan Kiem Lake Walking Street, Hoan Kiem, Hanoi',
          price: 'Free admission',
          capacity: 'Unlimited',
          description: 'The festival gathers more than 50 special street food stalls from all over Vietnam and Asian countries. Visitors will enjoy traditional dishes prepared by top chefs, participate in folk food games, and enjoy the lively acoustic street music night.',
          highlights: ['Over 50 unique street food stalls', 'Live acoustic music performances every night', 'Hands-on folk cake making experience']
        },
        2: {
          title: 'Acoustic Night & Fine Wine Tasting',
          date: '04/07/2026',
          location: '25th Floor, Skyline Lounge, Cau Giay, Hanoi',
          price: '850,000 VND / guest',
          capacity: '40 guests',
          description: 'Immerse yourself in the breezy space high above, enjoy glass of premium wine handpicked from the famous grape regions of France and Italy, harmoniously combined with an exquisite seafood Canape menu. The party is accompanied by rustic and melodious Acoustic guitar music to welcome the city sunset.',
          highlights: ['Taste 5 premium wine selections', 'Premium seafood Canape menu', 'Full view of the city sunset from high above']
        },
        3: {
          title: 'Masterclass: The Art of Traditional Sushi Making',
          date: '12/07/2026',
          location: 'The En Restaurant, Hoan Kiem, Hanoi',
          price: '1,200,000 VND / guest',
          capacity: '15 students',
          description: 'Hands-on course directly with a Japanese Head Chef with more than 15 years of experience. You will be guided from choosing fresh salmon, techniques of cooking and mixing Shari vinegar rice, to the art of wrapping beautiful maki, nigiri. At the end of the lesson is time to enjoy the results with premium green tea.',
          highlights: ['Direct guidance from Japanese head chef', 'Fresh imported salmon/scallops ingredients', 'Certificate of completion of Masterclass from The En']
        },
        4: {
          title: 'Craft Beer & Giant BBQ Smoked Ribs Festival',
          date: '18/07 - 19/07/2026',
          location: 'Outdoor Beer Garden, Cuc Gach Quan, Dong Da, Hanoi',
          price: '150,000 VND / ticket (includes 1 drink)',
          capacity: '300 guests',
          description: 'Festival to enjoy more than 20 unique craft beers from famous Vietnamese breweries combined with a giant smoked ribs party, oak-smoked American beef. Young and vibrant festival space with an outdoor light rock band.',
          highlights: ['Over 20 unique craft beer flavors', 'Giant American-style smoked BBQ', 'Melodious Rock night & gameshows']
        },
        5: {
          title: 'Italian Alba White Truffle Dinner (Truffle Fine Dining)',
          date: '25/07/2026',
          location: 'Royal VIP Room, Tam Vi Restaurant, Tay Ho, Hanoi',
          price: '3,500,000 VND / guest',
          capacity: '20 guests',
          description: 'A luxurious culinary journey honoring the "white diamond" of the culinary world - Alba Truffle imported directly from Italy. The Head Chef designs a 6-course Fine Dining menu combining shaved truffles on handmade fresh pasta, asparagus cream soup, and grilled Wagyu beef tenderloin with truffle sauce.',
          highlights: ['Fresh Alba white truffles imported directly', '6-course Fine Dining menu paired with Italian wines', 'Luxurious, private VIP room space']
        },
        6: {
          title: 'Workshop: The Art of Mixing Classic Cocktails',
          date: '02/08/2026',
          location: 'Skyline Lounge Bar, Cau Giay, Hanoi',
          price: '500,000 VND / guest',
          capacity: '25 students',
          description: 'Learn the history and art behind timeless classic cocktails like Old Fashioned, Negroni, Whiskey Sour. You will be guided on shaker shaking skills, precise barspoon stirring and make 3 cocktails of your own under the guidance of top Bartenders.',
          highlights: ['Learn theory and practice mixing 3 cocktails', 'Separately equipped professional bartending kit', 'Exclusive recipe gift from the Head Barman']
        }
      };
      return { ...evt, ...dict[evt.id] };
    });
  }, [filteredEvents, locale]);

  const activeEventDetail = useMemo(() => {
    if (!selectedEvent) return null;
    const allTranslatedEvents = culinaryEvents.map(evt => {
      if (locale === 'vi') return evt;
      const dict: Record<number, Partial<CulinaryEvent>> = {
        1: {
          title: 'Street Food Essence Festival',
          date: '28/06 - 30/06/2026',
          location: 'Hoan Kiem Lake Walking Street, Hoan Kiem, Hanoi',
          price: 'Free admission',
          capacity: 'Unlimited',
          description: 'The festival gathers more than 50 special street food stalls from all over Vietnam and Asian countries. Visitors will enjoy traditional dishes prepared by top chefs, participate in folk food games, and enjoy the lively acoustic street music night.',
          highlights: ['Over 50 unique street food stalls', 'Live acoustic music performances every night', 'Hands-on folk cake making experience']
        },
        2: {
          title: 'Acoustic Night & Fine Wine Tasting',
          date: '04/07/2026',
          location: '25th Floor, Skyline Lounge, Cau Giay, Hanoi',
          price: '850,000 VND / guest',
          capacity: '40 guests',
          description: 'Immerse yourself in the breezy space high above, enjoy glass of premium wine handpicked from the famous grape regions of France and Italy, harmoniously combined with an exquisite seafood Canape menu. The party is accompanied by rustic and melodious Acoustic guitar music to welcome the city sunset.',
          highlights: ['Taste 5 premium wine selections', 'Premium seafood Canape menu', 'Full view of the city sunset from high above']
        },
        3: {
          title: 'Masterclass: The Art of Traditional Sushi Making',
          date: '12/07/2026',
          location: 'The En Restaurant, Hoan Kiem, Hanoi',
          price: '1,200,000 VND / guest',
          capacity: '15 students',
          description: 'Hands-on course directly with a Japanese Head Chef with more than 15 years of experience. You will be guided from choosing fresh salmon, techniques of cooking and mixing Shari vinegar rice, to the art of wrapping beautiful maki, nigiri. At the end of the lesson is time to enjoy the results with premium green tea.',
          highlights: ['Direct guidance from Japanese head chef', 'Fresh imported salmon/scallops ingredients', 'Certificate of completion of Masterclass from The En']
        },
        4: {
          title: 'Craft Beer & Giant BBQ Smoked Ribs Festival',
          date: '18/07 - 19/07/2026',
          location: 'Outdoor Beer Garden, Cuc Gach Quan, Dong Da, Hanoi',
          price: '150,000 VND / ticket (includes 1 drink)',
          capacity: '300 guests',
          description: 'Festival to enjoy more than 20 unique craft beers from famous Vietnamese breweries combined with a giant smoked ribs party, oak-smoked American beef. Young and vibrant festival space with an outdoor light rock band.',
          highlights: ['Over 20 unique craft beer flavors', 'Giant American-style smoked BBQ', 'Melodious Rock night & gameshows']
        },
        5: {
          title: 'Italian Alba White Truffle Dinner (Truffle Fine Dining)',
          date: '25/07/2026',
          location: 'Royal VIP Room, Tam Vi Restaurant, Tay Ho, Hanoi',
          price: '3,500,000 VND / guest',
          capacity: '20 guests',
          description: 'A luxurious culinary journey honoring the "white diamond" of the culinary world - Alba Truffle imported directly from Italy. The Head Chef designs a 6-course Fine Dining menu combining shaved truffles on handmade fresh pasta, asparagus cream soup, and grilled Wagyu beef tenderloin with truffle sauce.',
          highlights: ['Fresh Alba white truffles imported directly', '6-course Fine Dining menu paired with Italian wines', 'Luxurious, private VIP room space']
        },
        6: {
          title: 'Workshop: The Art of Mixing Classic Cocktails',
          date: '02/08/2026',
          location: 'Skyline Lounge Bar, Cau Giay, Hanoi',
          price: '500,000 VND / guest',
          capacity: '25 students',
          description: 'Learn the history and art behind mixing classic cocktails like Old Fashioned, Negroni, Whiskey Sour. You will be guided on shaker shaking skills, precise barspoon stirring and make 3 cocktails of your own under the guidance of top Bartenders.',
          highlights: ['Learn theory and practice mixing 3 cocktails', 'Separately equipped professional bartending kit', 'Exclusive recipe gift from the Head Barman']
        }
      };
      return { ...evt, ...dict[evt.id] };
    });
    return allTranslatedEvents.find(e => e.id === selectedEvent.id) || selectedEvent;
  }, [selectedEvent, locale]);

  // --- Open Booking Modal ---
  const handleOpenBooking = (restaurantName: string, eventTitle?: string) => {
    setSelectedEvent(null); // Close detail modal first if open
    setBookingRestaurant(restaurantName);
    setBookingForm({
      name: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      time: '18:30',
      guests: 2,
      notes: eventTitle ? `${locale === 'vi' ? 'Đăng ký tham gia sự kiện' : 'Registering for event'}: ${eventTitle}` : ''
    });
    setIsBookedSuccess(false);
  };

  // --- Submit Booking ---
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

          {/* Nav Items - Pill shaped (Sự kiện & Ưu đãi is active) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-blue-50/50 p-1 rounded-full border border-blue-100/50">
            <Link 
              href="/"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
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
              className="rounded-full bg-white shadow-sm px-4 py-1.5 text-sm font-bold text-blue-600 transition-all"
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
      {/* 2. HERO HEADER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-indigo-50/30 to-[#F8FAFC] pt-16 pb-12">
        <div className="absolute top-[-20%] left-[-10%] h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute bottom-10 right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
            <span>{t.eventsHeroBadge}</span>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent">
              {t.eventsHeroTitle}
            </h1>
            <p className="text-sm text-slate-500 sm:text-base max-w-2xl mx-auto">
              {t.eventsHeroDesc}
            </p>
          </div>

          {/* Category Tabs Lọc sự kiện */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {['Tất cả', 'Festival', 'Fine Dining', 'Workshop'].map((tag) => {
              const tagLabel = tag === 'Tất cả' ? t.catAll : tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    toast.info(`${t.toastFilterGroup} ${tagLabel}`);
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 shadow-sm ${selectedTag === tag ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white hover:brightness-105' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                >
                  {tagLabel}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. EVENTS GRID SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {translatedEvents.map((evt) => (
            <div key={evt.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
              
              {/* Event Image */}
              <div className="h-56 w-full relative overflow-hidden bg-slate-100">
                <img src={evt.imageUrl} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md">
                  {evt.tag}
                </span>
                <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[10px] font-bold">
                  {evt.price}
                </span>
              </div>

              {/* Event Information */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    📍 {evt.restaurantName}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {evt.title}
                  </h3>
                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{evt.date} | {evt.time}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{t.eventScale} {evt.capacity}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-150 transition"
                  >
                    {t.eventBtnDetails}
                  </button>
                  <button
                    onClick={() => handleOpenBooking(evt.restaurantName, evt.title)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition"
                  >
                    {t.eventBtnBook}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* 4. EVENT DETAILS MODAL (Phương án Slide Overlay) */}
      {activeEventDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white h-full max-w-lg w-full shadow-2xl overflow-y-auto relative animate-slide-in-right flex flex-col justify-between">
            <div>
              {/* Image Banner */}
              <div className="h-64 w-full relative bg-slate-100">
                <img src={activeEventDetail.imageUrl} alt={activeEventDetail.title} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/75 p-2 rounded-full transition shadow-md"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="absolute bottom-4 left-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-black px-3.5 py-1.5 rounded-lg shadow-lg">
                  {activeEventDetail.tag}
                </span>
              </div>

              {/* Content Description */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
                    📍 {activeEventDetail.restaurantName}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {activeEventDetail.title}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 mt-3">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{activeEventDetail.time}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{activeEventDetail.date}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-blue-500" />
                      <span className="font-extrabold text-blue-600">{activeEventDetail.price}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{locale === 'vi' ? 'Giới hạn' : 'Limit'}: {activeEventDetail.capacity}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800">{t.eventDetailTitle}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeEventDetail.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-800">{t.eventDetailHighlight}</h4>
                  <ul className="space-y-2">
                    {activeEventDetail.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800">{t.eventDetailVenue}</h4>
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{activeEventDetail.location}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions inside overlay */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs bg-white hover:bg-slate-50 transition"
              >
                {t.eventBtnClose}
              </button>
              <button
                onClick={() => handleOpenBooking(activeEventDetail.restaurantName, activeEventDetail.title)}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-105 text-white font-bold text-xs shadow-md transition"
              >
                {t.eventBtnBookTicket}
              </button>
            </div>

          </div>
        </div>
      )}

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
                    {t.bookingCodeText} <strong className="text-blue-600">#EVT-{Math.floor(1000 + Math.random() * 9000)}</strong>. {t.bookingConfirmContact}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100">
                  <p><strong>{t.bookingCustomer}:</strong> {bookingForm.name}</p>
                  <p><strong>{t.bookingPhone}:</strong> {bookingForm.phone}</p>
                  <p><strong>{t.bookingTime}:</strong> {bookingForm.time} - {bookingForm.date}</p>
                  <p><strong>{t.bookingGuests}:</strong> {bookingForm.guests} {locale === 'vi' ? 'người' : 'guests'}</p>
                  {bookingForm.notes && <p><strong>{t.bookingNotes}:</strong> {bookingForm.notes}</p>}
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

      {/* 6. PLATFORM FOOTER */}
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
                <li><Link href="/events" className="hover:text-white transition">{t.footerWeeklyOffers}</Link></li>
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
