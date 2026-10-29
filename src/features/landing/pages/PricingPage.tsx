import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Bảng giá minh bạch</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Chọn gói dịch vụ phù hợp nhất với nhu cầu của bạn. Không phí ẩn, hủy bất kỳ lúc nào.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-on-surface mb-2">Tài Xế Cá Nhân</h3>
          <p className="text-3xl font-black text-primary mb-6">Miễn phí</p>
          <ul className="space-y-4 mb-8">
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-primary text-sm">check</span> Tìm bãi đỗ trên bản đồ</li>
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-primary text-sm">check</span> Xem đánh giá và tiện ích</li>
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-primary text-sm">check</span> Đặt chỗ ngay lập tức</li>
          </ul>
          <Link to="/register" className="block w-full py-3 text-center border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">Đăng ký ngay</Link>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-primary text-white rounded-3xl p-8 shadow-xl relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF6B00] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Phổ biến nhất</div>
          <h3 className="text-xl font-bold mb-2">Đội Xe / Doanh Nghiệp</h3>
          <p className="text-3xl font-black mb-6">Liên hệ</p>
          <ul className="space-y-4 mb-8">
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-white text-sm">check</span> Mọi tính năng của Tài xế</li>
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-white text-sm">check</span> Thanh toán công ty tập trung</li>
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-white text-sm">check</span> Báo cáo chi phí xuất hóa đơn</li>
          </ul>
          <Link to="/company/contact" className="block w-full py-3 text-center bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors">Nhận báo giá</Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-on-surface mb-2">Chủ Bãi Đỗ</h3>
          <p className="text-3xl font-black text-primary mb-6">Chiết khấu %</p>
          <ul className="space-y-4 mb-8">
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-primary text-sm">check</span> Phần mềm quản lý bãi đỗ</li>
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-primary text-sm">check</span> Tự động hóa thanh toán</li>
            <li className="flex gap-2 items-center"><span className="material-symbols-outlined text-primary text-sm">check</span> Tiếp cận mạng lưới 10,000+ tài xế</li>
          </ul>
          <Link to="/register" className="block w-full py-3 text-center border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">Đăng ký bãi đỗ</Link>
        </motion.div>
      </div>
    </div>
  );
};
