'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { Utensils, Phone, Mail, X, Briefcase, Gift, Copy } from 'lucide-react';
import { api } from '@/lib/api';

export default function Footer() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [footerData, setFooterData] = useState<{
    footerDesc?: string;
    hotline?: string;
    email?: string;
    location?: string;
  } | null>(null);

  const [showPromotionsModal, setShowPromotionsModal] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [showCooperationModal, setShowCooperationModal] = useState(false);
  const [cooperationPackages, setCooperationPackages] = useState<any[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const handleOpenReviews = async () => {
    setShowReviewsModal(true);
    try {
      const data = await api.get('/api/public/reviews');
      if (data) {
        setReviews(data as any[]);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const handleOpenPromotions = async () => {
    setShowPromotionsModal(true);
    try {
      const data = await api.get('/api/public/promotions');
      if (data) {
        setPromotions(data as any[]);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    }
  };

  const handleOpenCooperation = async () => {
    setShowCooperationModal(true);
    try {
      const data = await api.get('/api/public/cooperation/packages');
      if (data) {
        setCooperationPackages(data as any[]);
      }
    } catch (err) {
      console.error('Failed to load cooperation packages:', err);
    }
  };

  const handleSelectPackage = (code: string) => {
    setShowCooperationModal(false);
    if (user) {
      router.push(`/profile?registerPartner=true&requestType=${code}`);
    } else {
      router.push(`/login?registerPartner=true&requestType=${code}`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(locale === 'vi' ? `Đã sao chép mã: ${code}` : `Copied code: ${code}`);
  };

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const data = await api.get('/api/public/footer');
        if (data) {
          setFooterData(data as any);
        }
      } catch (err) {
        console.error('Failed to fetch footer info:', err);
      }
    };
    fetchFooter();
  }, []);

  const t = useMemo(() => {
    return locale === 'vi' ? {
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
      footerDesc: 'Connecting food lovers with premium and reputable restaurants. Search, review, and book tables online with ease.',
      footerExplore: 'Explore',
      footerSearch: 'Find Restaurants',
      footerCuisineCol: 'Food Collections',
      footerLatestRev: 'Latest Reviews',
      footerWeeklyOffers: 'Weekly Offers',
      footerPartner: 'Partnerships',
      footerRegOwner: 'Register Restaurant Owner',
      footerAdPacks: 'Ad Campaign Packages',
      footerGuide: 'Booking Guide',
      footerContact: 'Contact & Socials',
      footerTerms: 'Terms of Service',
      footerPrivacy: 'Privacy Policy',
      footerAllRights: 'All rights reserved.'
    };
  }, [locale]);

  return (
    <footer id="footer" className="bg-[#111827] text-slate-400 border-t border-slate-900 pt-16 pb-8 mt-12 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between gap-8 pb-12 border-b border-slate-800">
          
          {/* Col 1: Platform Info */}
          <div className="max-w-xs space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-650">
                <Utensils className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-wider">RMS</span>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed">
              {footerData?.footerDesc || t.footerDesc}
            </p>
          </div>

          {/* Col 2: Explore */}
          <div className="space-y-3 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerExplore}</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white transition">{t.footerSearch}</Link></li>
              <li><button onClick={handleOpenReviews} className="hover:text-white transition">{t.footerLatestRev}</button></li>
              <li><button onClick={handleOpenPromotions} className="hover:text-white transition">{t.footerWeeklyOffers}</button></li>
            </ul>
          </div>

          {/* Col 3: Partnerships */}
          <div className="space-y-3 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerPartner}</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href={user ? "/profile?registerPartner=true" : "/login?registerPartner=true"} className="hover:text-white transition">{t.footerRegOwner}</Link></li>
              <li><button onClick={handleOpenCooperation} className="hover:text-white transition">{t.footerAdPacks}</button></li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="space-y-3 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerContact}</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-blue-500" />
                <span>{footerData?.hotline || '1900 1234 (24/7)'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                <span>{footerData?.email || 'support@rms.com'}</span>
              </li>
              <li className="pt-2 text-slate-500 text-[10px]">
                {footerData?.location || 'Hanoi, Vietnam'}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-slate-500 text-[10px]">
          <p>© {new Date().getFullYear()} RMS. {t.footerAllRights}</p>
        </div>

      </div>

      {/* Promotions Modal */}
      {showPromotionsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-2xl w-full shadow-[0_24px_60px_rgba(0,0,0,0.12)] border border-slate-100/80 overflow-hidden relative animate-fade-in-scale max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Gift className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                    {locale === 'vi' ? 'Khuyến mãi tuần này' : 'Weekly Offers'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {locale === 'vi' ? 'Nhận mã giảm giá độc quyền dành riêng cho khách hàng RMS' : 'Claim exclusive discount codes available only on RMS'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPromotionsModal(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 p-2 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              {promotions.length === 0 ? (
                <div className="text-center py-8 text-slate-450 text-xs font-semibold">
                  {locale === 'vi' ? 'Hiện không có khuyến mãi nào đang kích hoạt.' : 'No active offers at the moment.'}
                </div>
              ) : (
                promotions.map((p, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30 hover:border-blue-200 hover:bg-blue-50/5 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Code: {p.promoCode}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{p.description}</h4>
                      <p className="text-[10px] text-slate-450 font-medium">
                        {locale === 'vi' 
                          ? `Hạn dùng: ${p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}`
                          : `Expires: ${p.endDate ? new Date(p.endDate).toLocaleDateString('en-US') : 'Lifetime'}`
                        }
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                      <div>
                        <span className="text-base font-black text-blue-600 block leading-tight">
                          {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()}đ`}
                        </span>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">
                          {locale === 'vi' ? 'Giảm giá' : 'Discount'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(p.promoCode)}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{locale === 'vi' ? 'Sao chép' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cooperation Packages Modal */}
      {showCooperationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-2xl w-full shadow-[0_24px_60px_rgba(0,0,0,0.12)] border border-slate-100/80 overflow-hidden relative animate-fade-in-scale max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                    {locale === 'vi' ? 'Gói dịch vụ hợp tác' : 'Cooperation Plans'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {locale === 'vi' ? 'Chọn gói dịch vụ phù hợp để khởi chạy hệ thống nhà hàng của bạn' : 'Select a perfect plan to launch your restaurant business'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCooperationModal(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 p-2 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Packages List */}
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              {cooperationPackages.map((p, idx) => {
                const isLifetime = p.code === 'APP_LIFETIME';
                const isSubscription = p.code === 'APP_SUBSCRIPTION';
                
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl p-5 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                      isLifetime 
                        ? 'border-indigo-150 bg-indigo-50/20 hover:border-indigo-300 hover:bg-indigo-50/30' 
                        : isSubscription
                          ? 'border-blue-150 bg-blue-50/10 hover:border-blue-300 hover:bg-blue-50/20'
                          : 'border-slate-150 bg-slate-50/30 hover:border-slate-350 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isLifetime
                            ? 'bg-indigo-100 text-indigo-700'
                            : isSubscription
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.code}
                        </span>
                        {isLifetime && (
                          <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                            {locale === 'vi' ? 'Tiết kiệm nhất' : 'Best Value'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {locale === 'vi' ? p.titleVi : p.titleEn}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {locale === 'vi' ? p.descVi : p.descEn}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div>
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {p.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">
                          {p.code === 'APP_SUBSCRIPTION' 
                            ? (locale === 'vi' ? 'Mỗi tháng' : 'Per Month') 
                            : (p.code === 'EVENT_ONLY' ? (locale === 'vi' ? 'Mỗi sự kiện' : 'Per Event') : (locale === 'vi' ? 'Một lần' : 'One-time'))
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => handleSelectPackage(p.code)}
                        className={`w-full md:w-auto font-extrabold text-[10px] px-5 py-2.5 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer text-center ${
                          isLifetime
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {locale === 'vi' ? 'Đăng ký ngay' : 'Apply Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Latest Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-fade-in-scale max-h-[85vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm tracking-wide">
                {locale === 'vi' ? '⭐ ĐÁNH GIÁ MỚI NHẤT' : '⭐ LATEST REVIEWS'}
              </h3>
              <button 
                onClick={() => setShowReviewsModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
              >
                {locale === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-slate-450 text-xs font-semibold">
                  {locale === 'vi' ? 'Chưa có đánh giá nào được phê duyệt.' : 'No approved reviews yet.'}
                </div>
              ) : (
                reviews.map((r, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-xs font-black">{r.customerName}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-450 fill-amber-400' : 'text-slate-200'}`} 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed">"{r.comment}"</p>
                    <div className="text-[9px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
