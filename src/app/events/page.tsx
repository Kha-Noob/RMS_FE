'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
  Sparkles,
  Ticket,
  Users,
  ChevronDown,
  User as UserIcon,
  QrCode,
  Globe
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
  branchId?: string;
  eventDates?: string[];
  bookingDeadline?: string | null;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  bankBranch?: string;
}

const getVietQrBankId = (bankName: string) => {
  const name = bankName.toLowerCase().trim();
  if (name.includes('vietcombank') || name.includes('vcb')) return 'vietcombank';
  if (name.includes('techcombank') || name.includes('tcb')) return 'techcombank';
  if (name.includes('vietinbank') || name.includes('ctg')) return 'vietinbank';
  if (name.includes('bidv')) return 'bidv';
  if (name.includes('agribank')) return 'agribank';
  if (name.includes('mbbank') || name.includes('mb bank') || name.includes('mb')) return 'mb';
  if (name.includes('acb')) return 'acb';
  if (name.includes('tpbank') || name.includes('tp bank')) return 'tpbank';
  if (name.includes('vpbank') || name.includes('vp bank')) return 'vpbank';
  if (name.includes('sacombank')) return 'sacombank';
  if (name.includes('hdbank')) return 'hdbank';
  if (name.includes('shb')) return 'shb';
  if (name.includes('vib')) return 'vib';
  if (name.includes('eximbank')) return 'eximbank';
  if (name.includes('ocb')) return 'ocb';
  if (name.includes('scb')) return 'scb';
  return name.replace(/\s+/g, '');
};

export default function EventsPage() {
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
  const [eventSlotsInfo, setEventSlotsInfo] = useState<Record<number, { booked: number; max: number }>>({});
  const [culinaryEvents, setCulinaryEvents] = useState<CulinaryEvent[]>([]);

  const parseMaxCapacity = (capStr: string) => {
    if (!capStr || capStr.toLowerCase().includes('không giới hạn') || capStr.toLowerCase().includes('unlimited')) {
      return 99999;
    }
    const match = capStr.match(/\d+/);
    return match ? parseInt(match[0]) : 99999;
  };

  const loadEventCapacities = (eventsList?: CulinaryEvent[]) => {
    const list = eventsList || culinaryEvents;
    const infoMap: Record<number, { booked: number; max: number }> = {};
    Promise.all(
      list.map(async (evt) => {
        const dates = evt.eventDates || [];
        if (dates.length === 0) return;
        
        const maxCap = parseMaxCapacity(evt.capacity);
        if (maxCap >= 99999) {
          infoMap[evt.id] = { booked: 0, max: 99999 };
          return;
        }

        let totalBooked = 0;
        for (const d of dates) {
          try {
            const res = await api.get<{ bookedGuests: number }>('/api/public/bookings-capacity/event', {
              params: { branchId: evt.branchId || '01-2thang9', eventTitle: evt.title, date: d }
            });
            totalBooked += res.bookedGuests;
          } catch (err) {
            // ignore
          }
        }
        infoMap[evt.id] = { booked: totalBooked, max: maxCap * dates.length };
      })
    ).then(() => {
      setEventSlotsInfo({...infoMap});
    });
  };

  React.useEffect(() => {
    api.get<any[]>('/api/events/public')
      .then(res => {
        const mapped: CulinaryEvent[] = res.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time,
          location: e.location,
          restaurantName: e.restaurantName,
          tag: e.tag,
          imageUrl: e.imageUrl,
          price: e.price,
          capacity: e.capacity,
          description: e.description,
          highlights: Array.isArray(e.highlights) ? e.highlights : [],
          branchId: e.branchId,
          eventDates: Array.isArray(e.eventDates) ? e.eventDates : [],
          bookingDeadline: e.bookingDeadline,
          bankName: e.bankName,
          bankAccountNo: e.bankAccountNo,
          bankAccountName: e.bankAccountName,
          bankBranch: e.bankBranch
        }));
        setCulinaryEvents(mapped);
        loadEventCapacities(mapped);
        
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const eventIdStr = params.get('id');
          if (eventIdStr) {
            const eventId = parseInt(eventIdStr);
            const match = mapped.find(evt => evt.id === eventId);
            if (match) {
              setSelectedEvent(match);
            }
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch public events', err);
      });
  }, []);

  // --- Booking Modal State ---
  const [bookingRestaurant, setBookingRestaurant] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '18:30',
    guests: 2,
    notes: '',
    branchId: ''
  });
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payingBookingIds, setPayingBookingIds] = useState<number[]>([]);
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState<string | null>(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300); // 5 mins countdown

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (isPaying && payingBookingIds.length > 0) {
      setPaymentTimeLeft(300); // Reset timer

      // Timer countdown
      timerInterval = setInterval(() => {
        setPaymentTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            clearInterval(pollInterval);
            setIsPaying(false);
            setPayingBookingIds([]);
            toast.error(locale === 'vi' ? 'Hết thời gian thanh toán. Vui lòng thử lại!' : 'Payment timeout. Please try again!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Polling function
      const checkPaymentStatus = async () => {
        try {
          const checkPromises = payingBookingIds.map(id => api.get<any>(`/api/public/bookings/${id}`));
          const bookings = await Promise.all(checkPromises);
          
          // Check if all bookings are PAID
          const allPaid = bookings.every(b => b.paymentStatus === 'PAID');
          if (allPaid) {
            clearInterval(timerInterval);
            clearInterval(pollInterval);
            setIsPaying(false);
            setPayingBookingIds([]);
            setIsBookedSuccess(true);
            toast.success(locale === 'vi' ? 'Thanh toán thành công! Vé đã được xác nhận.' : 'Payment successful! Ticket confirmed.');
            loadEventCapacities();
          }
        } catch (err) {
          console.error("Error polling payment status", err);
        }
      };

      // Poll every 2 seconds
      pollInterval = setInterval(checkPaymentStatus, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isPaying, payingBookingIds, locale]);

  const filteredEvents = useMemo(() => {
    if (selectedTag === 'Tất cả') return culinaryEvents;
    return culinaryEvents.filter(e => e.tag === selectedTag);
  }, [selectedTag, culinaryEvents]);

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
          description: 'Learn the history and art behind mixing classic cocktails like Old Fashioned, Negroni, Whiskey Sour. You will be guided on shaker shaking skills, precise barspoon stirring and make 3 cocktails of your own under the guidance of top Bartenders.',
          highlights: ['Learn theory and practice mixing 3 cocktails', 'Separately equipped professional bartending kit', 'Exclusive recipe gift from the Head Barman']
        },
        7: {
          title: 'Premium Seafood Buffet Feast',
          date: '20/07 - 22/07/2026',
          location: 'Branch 2 Thang 9, Da Nang',
          price: '650,000 VND / guest',
          capacity: '100 guests',
          description: 'Premium seafood buffet feast featuring king crab, lobster, fresh oysters, and over 50 delicious side dishes. Enjoy a seafood feast in a romantic atmosphere.',
          highlights: ['Fresh imported seafood', 'Free-flow white wine', 'Live sushi & sashimi counter']
        },
        8: {
          title: 'International Grill & Craft Beer Festival',
          date: '28/07 - 30/07/2026',
          location: 'Branch Cooperator 2, Da Nang',
          price: '250,000 VND / ticket (includes 1 beer)',
          capacity: '200 guests',
          description: 'Experience over 15 premium grilled meats from lamb, oak-smoked American beef ribs, combined with cold craft beer from famous brands.',
          highlights: ['Specially marinated grilled meats', 'Diverse craft beer selection', 'Vibrant live music every night']
        },
        9: {
          title: 'Special Omakase Sushi Experience',
          date: '05/08/2026',
          location: 'Branch Cooperator 3, Da Nang',
          price: '2,000,000 VND / guest',
          capacity: '10 guests',
          description: 'A culinary journey discovering the delicate flavors of Japanese cuisine with an Omakase menu hand-prepared by the Head Chef from the freshest ingredients imported daily from Tokyo.',
          highlights: ['Freshest ingredients imported daily', 'Direct interaction with Japanese Head Chef', 'Premium Sake pairing']
        }
      };
      const tr = dict[evt.id];
      return tr ? { ...evt, ...tr } : evt;
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
        },
        7: {
          title: 'Premium Seafood Buffet Feast',
          date: '20/07 - 22/07/2026',
          location: 'Branch 2 Thang 9, Da Nang',
          price: '650,000 VND / guest',
          capacity: '100 guests',
          description: 'Premium seafood buffet feast featuring king crab, lobster, fresh oysters, and over 50 delicious side dishes. Enjoy a seafood feast in a romantic atmosphere.',
          highlights: ['Fresh imported seafood', 'Free-flow white wine', 'Live sushi & sashimi counter']
        },
        8: {
          title: 'International Grill & Craft Beer Festival',
          date: '28/07 - 30/07/2026',
          location: 'Branch Cooperator 2, Da Nang',
          price: '250,000 VND / ticket (includes 1 beer)',
          capacity: '200 guests',
          description: 'Experience over 15 premium grilled meats from lamb, oak-smoked American beef ribs, combined with cold craft beer from famous brands.',
          highlights: ['Specially marinated grilled meats', 'Diverse craft beer selection', 'Vibrant live music every night']
        },
        9: {
          title: 'Special Omakase Sushi Experience',
          date: '05/08/2026',
          location: 'Branch Cooperator 3, Da Nang',
          price: '2,000,000 VND / guest',
          capacity: '10 guests',
          description: 'A culinary journey discovering the delicate flavors of Japanese cuisine with an Omakase menu hand-prepared by the Head Chef from the freshest ingredients imported daily from Tokyo.',
          highlights: ['Freshest ingredients imported daily', 'Direct interaction with Japanese Head Chef', 'Premium Sake pairing']
        }
      };
      const tr = dict[evt.id];
      return tr ? { ...evt, ...tr } : evt;
    });
    return allTranslatedEvents.find(e => e.id === selectedEvent.id) || selectedEvent;
  }, [selectedEvent, culinaryEvents, locale]);

  // --- Open Booking Modal ---
  const [bookingCode, setBookingCode] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateCapacities, setDateCapacities] = useState<Record<string, number>>({});
  const [bookingEvent, setBookingEvent] = useState<CulinaryEvent | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'QR_PAY' | 'CARD' | 'WALLET'>('QR_PAY');

  const parseEventStartTime = (timeStr: string) => {
    if (!timeStr) return '18:30';
    const parts = timeStr.split('-');
    const start = parts[0].trim();
    const match = start.match(/\d{2}:\d{2}/);
    return match ? match[0] : '18:30';
  };

  const handleOpenBooking = (evt: CulinaryEvent) => {
    if (evt.bookingDeadline && new Date().getTime() > new Date(evt.bookingDeadline).getTime()) {
      toast.error(locale === 'vi' ? 'Sự kiện này đã hết thời hạn đăng ký!' : 'Booking period for this event has expired!');
      return;
    }
    setSelectedEvent(null); // Close detail modal first if open
    setBookingEvent(evt);
    setBookingRestaurant(evt.restaurantName);
    const parsedTime = evt.time ? parseEventStartTime(evt.time) : '18:30';
    
    // Default to today if event has no dates listed
    const dates = evt.eventDates && evt.eventDates.length > 0 ? evt.eventDates : [new Date().toISOString().split('T')[0]];
    setAvailableDates(dates);
    setSelectedDates([dates[0]]); // default select first date

    // Fetch capacity info for all dates
    const bId = evt.branchId || '01-2thang9';
    const title = evt.title;
    const capMap: Record<string, number> = {};

    Promise.all(
      dates.map(d => 
        api.get<{ bookedGuests: number }>('/api/public/bookings-capacity/event', {
          params: { branchId: bId, eventTitle: title, date: d }
        })
        .then(res => {
          capMap[d] = res.bookedGuests;
        })
        .catch(() => {
          capMap[d] = 0;
        })
      )
    ).then(() => {
      setDateCapacities({...capMap});
    });

    setBookingForm({
      name: '',
      phone: '',
      date: dates[0],
      time: parsedTime,
      guests: 2,
      notes: evt.title ? `${locale === 'vi' ? 'Đăng ký tham gia sự kiện' : 'Registering for event'}: ${evt.title}` : '',
      branchId: bId
    });
    setIsBookedSuccess(false);
  };

  const handleToggleDate = (date: string) => {
    if (selectedDates.includes(date)) {
      if (selectedDates.length > 1) {
        setSelectedDates(selectedDates.filter(d => d !== date));
      } else {
        toast.warning(locale === 'vi' ? 'Vui lòng chọn ít nhất một ngày!' : 'Please select at least one date!');
      }
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // --- Submit Booking ---
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name.trim()) {
      toast.error(t.toastEnterName);
      return;
    }
    if (!/^[A-Za-zÀ-ỹ\s']{2,100}$/.test(bookingForm.name.trim())) {
      toast.error(locale === 'vi' ? 'Họ và tên không hợp lệ (chỉ chứa chữ cái, từ 2-100 ký tự)!' : 'Invalid name (letters only, 2-100 chars)!');
      return;
    }
    if (!bookingForm.phone.trim()) {
      toast.error(t.toastEnterPhone);
      return;
    }
    if (!/^(0|\+84)[35789][0-9]{8}$/.test(bookingForm.phone.trim())) {
      toast.error(locale === 'vi' ? 'Số điện thoại không đúng định dạng Việt Nam hợp lệ (ví dụ: 0912345678)!' : 'Invalid Vietnamese phone format (ex: 0912345678)!');
      return;
    }

    if (selectedDates.length === 0) {
      toast.error(locale === 'vi' ? 'Vui lòng chọn ít nhất một ngày diễn ra!' : 'Please select at least one date!');
      return;
    }

    const minFutureTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins in future

    // Validate future restriction for all selected dates
    for (const d of selectedDates) {
      const bookingTime = `${d}T${bookingForm.time}:00`;
      const selectedDateTime = new Date(bookingTime);
      if (selectedDateTime.getTime() < minFutureTime.getTime()) {
        const displayD = d.split('-').reverse().join('/');
        toast.error(locale === 'vi' 
          ? `Thời gian của ngày ${displayD} phải ở tương lai (tối thiểu trước 15 phút)!` 
          : `Booking time for ${displayD} must be in the future (at least 15 minutes ahead)!`);
        return;
      }
    }

    try {
      const isPaid = bookingEvent && bookingEvent.price && !bookingEvent.price.includes('Miễn phí') && !bookingEvent.price.toLowerCase().includes('free');
      const singlePrice = isPaid ? (parseInt(bookingEvent.price.replace(/[^0-9]/g, '')) || 0) : 0;

      // Post all bookings in parallel
      const promises = selectedDates.map(d => {
        const payload = {
          eventId: bookingEvent?.id || null,
          customerName: bookingForm.name,
          customerPhone: bookingForm.phone,
          bookingTime: `${d}T${bookingForm.time}:00`,
          guests: bookingForm.guests,
          branchId: bookingForm.branchId,
          notes: bookingForm.notes,
          tableId: null,
          paymentMethod: isPaid ? paymentMethod : null,
          paymentStatus: isPaid ? 'PENDING' : 'PAID',
          depositPaid: false,
          depositAmount: isPaid ? (singlePrice * bookingForm.guests) : 0.0
        };
        return api.post<any>('/api/public/bookings', payload);
      });

      const results = await Promise.all(promises);
      const codes = results.map(res => res.id ? `#${res.id}` : '').filter(Boolean).join(', ');
      setBookingCode(codes || 'EVT-' + Math.floor(1000 + Math.random() * 9000));
      
      if (isPaid) {
        const ids = results.map(res => res.id).filter(Boolean);
        setPayingBookingIds(ids);
        const checkoutUrl = results.find(res => res.checkoutUrl)?.checkoutUrl || null;
        setPayosCheckoutUrl(checkoutUrl);
        setIsPaying(true);
      } else {
        setIsBookedSuccess(true);
        toast.success(`${t.toastBookingSuccess} ${bookingRestaurant}!`);
        loadEventCapacities();
      }
    } catch (err: any) {
      toast.error(err.message || (locale === 'vi' ? 'Đặt vé thất bại, vui lòng thử lại.' : 'Booking failed, please try again.'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      <Header />
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
                      <span>
                        {(() => {
                          const info = eventSlotsInfo[evt.id];
                          if (!info) return `${t.eventScale} ${evt.capacity}`;
                          if (info.max >= 99999) return locale === 'vi' ? 'Sức chứa: Không giới hạn' : 'Capacity: Unlimited';
                          const remaining = Math.max(0, info.max - info.booked);
                          return locale === 'vi' 
                            ? `Còn lại: ${remaining}/${info.max} chỗ` 
                            : `Remaining: ${remaining}/${info.max} slots`;
                        })()}
                      </span>
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
                    onClick={() => handleOpenBooking(evt)}
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
                onClick={() => handleOpenBooking(activeEventDetail)}
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-fade-in-scale max-h-[90vh] flex flex-col">
            
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
              <div className="p-6 text-center space-y-4 overflow-y-auto flex-1">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">{t.bookingSuccess}</h4>
                  <p className="text-xs text-slate-500 px-4">
                    {t.bookingCodeText} <strong className="text-blue-600">#{bookingCode}</strong>. {t.bookingConfirmContact}
                  </p>
                </div>

                {/* Check-in QR Block */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center space-y-2 max-w-sm mx-auto">
                  <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `=== THÔNG TIN VÉ SỰ KIỆN ===\n` +
                        `Mã vé: #${bookingCode.replace(/[^0-9]/g, '')}\n` +
                        `Sự kiện: ${bookingRestaurant || 'Sự kiện đã chọn'}\n` +
                        `Khách hàng: ${bookingForm.name}\n` +
                        `Số điện thoại: ${bookingForm.phone}\n` +
                        `Thời gian: ${bookingForm.time} - ${selectedDates.map(d => d.split('-').reverse().join('/')).join(', ')}\n` +
                        `Số lượng vé: ${bookingForm.guests} vé\n` +
                        `Ghi chú: ${bookingForm.notes || 'Không có'}\n` +
                        `============================`
                      )}`}
                      alt="Check-in QR"
                      className="w-28 h-28 rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Mã vé Check-in của bạn</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100">
                  <p><strong>{t.bookingCustomer}:</strong> {bookingForm.name}</p>
                  <p><strong>{t.bookingPhone}:</strong> {bookingForm.phone}</p>
                  <p><strong>{t.bookingTime}:</strong> {bookingForm.time} - {selectedDates.map(d => d.split('-').reverse().join('/')).join(', ')}</p>
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
            ) : isPaying ? (
              <div className="p-6 text-center space-y-5 overflow-y-auto flex-1 flex flex-col justify-between">
                <div className="space-y-4 flex-1">
                  {/* High-end loading animation */}
                  <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                    <QrCode className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {locale === 'vi' ? 'Đang chờ chuyển khoản...' : 'Waiting for transfer...'}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      {locale === 'vi' 
                        ? 'Hệ thống đang tự động xác thực giao dịch chuyển khoản. Vui lòng giữ nguyên màn hình này.' 
                        : 'System is verifying transfer transaction. Please keep this screen open.'}
                    </p>
                  </div>

                  {/* Timer display */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-700 font-extrabold text-[10px]">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      {Math.floor(paymentTimeLeft / 60)}:{(paymentTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Bank Info & VietQR */}
                  {bookingEvent && bookingEvent.bankAccountNo && (
                    <div className="bg-indigo-50/40 rounded-xl p-3 border border-indigo-100/40 space-y-2.5 text-xs font-semibold text-left text-slate-700">
                      <p className="text-[9px] text-indigo-550 font-black uppercase tracking-wider flex items-center gap-1">
                        <span>🏦</span> {locale === 'vi' ? 'Thông tin chuyển khoản thanh toán' : 'Transfer Details'}
                      </p>
                      <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px]">
                        <span className="text-slate-400 font-bold">{locale === 'vi' ? 'Ngân hàng:' : 'Bank Name:'}</span>
                        <span className="font-extrabold text-slate-800">{bookingEvent.bankName}</span>
                        
                        <span className="text-slate-400 font-bold">{locale === 'vi' ? 'Số tài khoản:' : 'Account No:'}</span>
                        <span className="font-black text-indigo-700 select-all">{bookingEvent.bankAccountNo}</span>
                        
                        <span className="text-slate-400 font-bold">{locale === 'vi' ? 'Chủ tài khoản:' : 'Holder Name:'}</span>
                        <span className="font-extrabold text-slate-850 uppercase">{bookingEvent.bankAccountName}</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-dashed border-indigo-200 gap-1 mt-2 shadow-inner">
                        <img 
                          src={`https://img.vietqr.io/image/${getVietQrBankId(bookingEvent.bankName || '')}-${bookingEvent.bankAccountNo}-compact.png?amount=${(parseInt(bookingEvent.price.replace(/[^0-9]/g, '')) || 0) * bookingForm.guests * selectedDates.length}&addInfo=${encodeURIComponent(`VE ${bookingForm.name.toUpperCase()} ${bookingForm.phone}`)}&accountName=${encodeURIComponent(bookingEvent.bankAccountName || '')}`}
                          alt="VietQR Payment Code"
                          className="w-32 h-32 object-contain rounded-lg border border-slate-100 shadow-sm"
                        />
                        <p className="text-[8px] text-rose-500 font-black text-center animate-pulse">
                          {locale === 'vi' 
                            ? '* Vui lòng giữ nguyên số tiền và nội dung chuyển khoản khi quét' 
                            : '* Please keep amount and transfer note unchanged'}
                        </p>
                        {payosCheckoutUrl && (
                          <a
                            href={payosCheckoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 w-full text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            💳 {locale === 'vi' ? 'Thanh toán tự động qua PayOS' : 'Pay Automatically via PayOS'}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              // Simulate bank transfer callback to Casso webhook
                              const amount = (parseInt(bookingEvent.price.replace(/[^0-9]/g, '')) || 0) * bookingForm.guests * selectedDates.length;
                              const description = payingBookingIds.map(id => `VE ${id}`).join(', ');
                              
                              await api.post('/api/public/webhook/banking', {
                                error: 0,
                                data: [
                                  {
                                    description: description,
                                    amount: amount,
                                    when: new Date().toISOString()
                                  }
                                ]
                              });
                              toast.success(locale === 'vi' ? 'Hệ thống đã tự động nhận diện giao dịch chuyển khoản thành công!' : 'System automatically detected successful bank transfer!');
                            } catch (err) {
                              toast.error('Simulation failed');
                            }
                          }}
                          className="mt-2 w-full py-1.5 px-3 bg-gradient-to-r from-emerald-550 to-teal-650 hover:from-emerald-650 hover:to-teal-750 text-white rounded-lg text-[9px] font-black transition shadow-sm cursor-pointer animate-pulse"
                        >
                          ⚡ {locale === 'vi' ? 'Giả lập Banking tự động nhận diện' : 'Simulate Auto-Banking Webhook'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaying(false);
                      setPayingBookingIds([]);
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                  >
                    {locale === 'vi' ? 'Hủy giao dịch' : 'Cancel Transaction'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 overflow-y-auto flex-1">
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

                {/* Date & Time selection */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {locale === 'vi' ? 'Chọn ngày tham gia *' : 'Select dates *'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableDates.map(date => {
                        const isSelected = selectedDates.includes(date);
                        const displayDate = date.split('-').reverse().join('/');
                        
                        const maxCap = bookingEvent ? parseMaxCapacity(bookingEvent.capacity) : 9999;
                        const booked = dateCapacities[date] || 0;
                        const remaining = Math.max(0, maxCap - booked);

                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => handleToggleDate(date)}
                            disabled={remaining <= 0}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex flex-col items-center ${
                              remaining <= 0
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            <span>{displayDate}</span>
                            <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {remaining <= 0 
                                ? (locale === 'vi' ? 'Hết chỗ' : 'Sold out')
                                : `${locale === 'vi' ? 'Còn' : 'Left'}: ${remaining}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{locale === 'vi' ? 'Giờ diễn ra' : 'Event time'}</label>
                    <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-600 h-[34px] flex items-center">
                      {bookingForm.time}
                    </div>
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

                {/* Upfront Payment Section if event is paid */}
                {bookingEvent && bookingEvent.price && !bookingEvent.price.includes('Miễn phí') && !bookingEvent.price.toLowerCase().includes('free') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{locale === 'vi' ? 'Tổng tiền thanh toán trước *:' : 'Total Ticket Price Owed Upfront *:'}</span>
                      <span className="font-black text-blue-650 text-xs">
                        {(() => {
                          const singlePriceStr = bookingEvent.price.replace(/[^0-9]/g, '');
                          const singlePrice = parseInt(singlePriceStr) || 0;
                          const total = singlePrice * bookingForm.guests * selectedDates.length;
                          return total.toLocaleString('vi-VN') + ' đ';
                        })()}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      {locale === 'vi' 
                        ? '* Vé tham gia sự kiện ẩm thực/workshop cần được thanh toán trước 100% để đảm bảo nhà hàng giữ chỗ và chuẩn bị chu đáo.' 
                        : '* Tickets for culinary events/workshops must be paid 100% upfront to confirm your reservation and guarantee seating.'}
                    </p>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500">{locale === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none bg-white font-semibold text-slate-700"
                      >
                        <option value="QR_PAY">{locale === 'vi' ? 'Quét mã QR Pay (VNPAY / BankTransfer)' : 'Scan QR Pay'}</option>
                        <option value="CARD">{locale === 'vi' ? 'Thẻ ATM / Visa / Mastercard' : 'Credit / Debit Card'}</option>
                        <option value="WALLET">{locale === 'vi' ? 'Ví điện tử (Momo / ZaloPay)' : 'E-Wallet'}</option>
                      </select>
                    </div>
                    {/* Bank Transfer Details (US#1) */}
                    {paymentMethod === 'QR_PAY' && bookingEvent && bookingEvent.bankAccountNo ? (
                      <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 space-y-2 text-xs font-semibold animate-fade-in text-slate-750">
                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider flex items-center gap-1">
                          <span>🏦</span> {locale === 'vi' ? 'Thông tin chuyển khoản thanh toán' : 'Transfer Details'}
                        </p>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px]">
                          <span className="text-slate-450 font-bold">{locale === 'vi' ? 'Ngân hàng:' : 'Bank Name:'}</span>
                          <span className="font-extrabold text-slate-800">{bookingEvent.bankName}</span>
                          
                          <span className="text-slate-450 font-bold">{locale === 'vi' ? 'Số tài khoản:' : 'Account No:'}</span>
                          <span className="font-black text-indigo-700 select-all">{bookingEvent.bankAccountNo}</span>
                          
                          <span className="text-slate-450 font-bold">{locale === 'vi' ? 'Chủ tài khoản:' : 'Holder Name:'}</span>
                          <span className="font-extrabold text-slate-800 uppercase">{bookingEvent.bankAccountName}</span>
                          
                          {bookingEvent.bankBranch && (
                            <>
                              <span className="text-slate-450 font-bold">{locale === 'vi' ? 'Chi nhánh:' : 'Branch:'}</span>
                              <span className="font-bold text-slate-700">{bookingEvent.bankBranch}</span>
                            </>
                          )}
                        </div>
                        {/* VietQR Code Display */}
                        <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-dashed border-indigo-200 gap-1.5 mt-2.5 shadow-inner">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                            <span>📲</span> {locale === 'vi' ? 'Quét mã VietQR để thanh toán tự động' : 'Scan VietQR to Pay'}
                          </p>
                          <img 
                            src={`https://img.vietqr.io/image/${getVietQrBankId(bookingEvent.bankName || '')}-${bookingEvent.bankAccountNo}-compact.png?amount=${(parseInt(bookingEvent.price.replace(/[^0-9]/g, '')) || 0) * bookingForm.guests * selectedDates.length}&addInfo=${encodeURIComponent(`VE ${bookingForm.name.toUpperCase()} ${bookingForm.phone}`)}&accountName=${encodeURIComponent(bookingEvent.bankAccountName || '')}`}
                            alt="VietQR Payment Code"
                            className="w-40 h-40 object-contain rounded-lg border border-slate-100 shadow-sm"
                          />
                          <p className="text-[8px] text-rose-500 font-black text-center animate-pulse">
                            {locale === 'vi' 
                              ? '* Vui lòng giữ nguyên số tiền và nội dung chuyển khoản khi quét' 
                              : '* Please keep amount and transfer note unchanged'}
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium pt-1.5 border-t border-dashed border-slate-200">
                          {locale === 'vi' 
                            ? 'Vui lòng ghi rõ nội dung chuyển khoản: Tên của bạn + Số điện thoại đăng ký vé.' 
                            : 'Please specify in transfer note: Your Name + Registered Phone Number.'}
                        </p>
                      </div>
                    ) : (
                      <div className="border-t border-dashed border-slate-200 pt-2 flex items-center gap-3">
                        <div className="h-10 w-10 border border-slate-200 rounded p-1 bg-white flex items-center justify-center shrink-0">
                          <QrCode className="h-full w-full text-slate-700" />
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium">
                          <p className="font-bold text-slate-700">{locale === 'vi' ? 'CỔNG THANH TOÁN RMS PAY' : 'RMS SECURE PAY'}</p>
                          <p>{locale === 'vi' ? 'Quét mã để chuyển khoản thanh toán và nhận vé ngay.' : 'Scan QR Code to pay and secure your tickets.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                    {bookingEvent && bookingEvent.price && !bookingEvent.price.includes('Miễn phí') && !bookingEvent.price.toLowerCase().includes('free')
                      ? (locale === 'vi' ? 'Thanh toán & Xác nhận' : 'Pay & Confirm')
                      : t.bookingBtnConfirm}
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
