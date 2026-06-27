'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { Utensils, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const { locale } = useLanguage();

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
              {t.footerDesc}
            </p>
          </div>

          {/* Col 2: Explore */}
          <div className="space-y-3 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerExplore}</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white transition">{t.footerSearch}</Link></li>
              <li><button onClick={() => toast.info(locale === 'vi' ? 'Tính năng bộ sưu tập sẽ sớm ra mắt!' : 'Food collections feature coming soon!')} className="hover:text-white transition">{t.footerCuisineCol}</button></li>
              <li><Link href="/feed" className="hover:text-white transition">{t.footerLatestRev}</Link></li>
              <li><button onClick={() => toast.info(locale === 'vi' ? 'Khuyến mãi sẽ được hiển thị khi BE sẵn sàng!' : 'Offers will be displayed when Backend is ready!')} className="hover:text-white transition">{t.footerWeeklyOffers}</button></li>
            </ul>
          </div>

          {/* Col 3: Partnerships */}
          <div className="space-y-3 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerPartner}</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/login" className="hover:text-white transition">{t.footerRegOwner}</a></li>
              <li><button onClick={() => toast.info(locale === 'vi' ? 'Các gói dịch vụ tiếp thị liên kết!' : 'Affiliate marketing packages!')} className="hover:text-white transition">{t.footerAdPacks}</button></li>
              <li><Link href="/" className="hover:text-white transition">{t.footerGuide}</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="space-y-3 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerContact}</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-blue-500" />
                <span>1900 1234 (24/7)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                <span>support@rms.com</span>
              </li>
              <li className="pt-2 text-slate-500 text-[10px]">
                Hanoi, Vietnam
              </li>
            </ul>
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
  );
}
