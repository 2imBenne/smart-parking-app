import React from 'react';
import { motion } from 'framer-motion';

export const OwnerSolutionsPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-[#E65100] mb-6">Giải pháp dành cho Chủ bãi</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Số hóa bãi đỗ xe của bạn. Quản lý ra vào, doanh thu và tối ưu hóa không gian trống chỉ bằng một phần mềm duy nhất.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6 order-2 md:order-1">
          <h2 className="text-2xl font-bold text-on-surface">Tối đa hóa lợi nhuận từng m2</h2>
          <p className="text-on-surface-variant">Phần mềm quản lý bãi đỗ của SmartTruck cung cấp cho bạn một trang tổng quan để theo dõi doanh thu hàng ngày, công suất sử dụng bãi và định giá động theo giờ cao điểm.</p>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start"><span className="material-symbols-outlined text-[#E65100]">bar_chart</span> <span>Báo cáo doanh thu và phân tích chuyên sâu.</span></li>
            <li className="flex gap-3 items-start"><span className="material-symbols-outlined text-[#E65100]">price_change</span> <span>Hệ thống định giá động thông minh.</span></li>
            <li className="flex gap-3 items-start"><span className="material-symbols-outlined text-[#E65100]">account_balance</span> <span>Tự động thanh toán đối soát vào tài khoản ngân hàng.</span></li>
          </ul>
        </div>
        <div className="bg-surface-container rounded-3xl aspect-[4/3] w-full bg-cover bg-center order-1 md:order-2" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)' }}></div>
      </div>
    </div>
  );
};
