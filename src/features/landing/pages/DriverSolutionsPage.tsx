import React from 'react';
import { motion } from 'framer-motion';

export const DriverSolutionsPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Giải pháp dành cho Tài xế</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Lái xe an toàn hơn, nghỉ ngơi thoải mái hơn. SmartTruck giúp bạn tìm và đặt chỗ đỗ xe tải an ninh trên mọi tuyến đường.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="bg-surface-container rounded-3xl aspect-[4/3] w-full bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)' }}></div>
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-on-surface">Không còn chạy lòng vòng tìm chỗ đỗ</h2>
          <p className="text-on-surface-variant">Hệ thống bản đồ thời gian thực của chúng tôi cho bạn biết chính xác bãi đỗ nào còn chỗ, bãi nào đã đầy trước khi bạn kịp đến nơi.</p>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start"><span className="material-symbols-outlined text-primary">check_circle</span> <span>Đặt trước vị trí, đảm bảo có chỗ 100%.</span></li>
            <li className="flex gap-3 items-start"><span className="material-symbols-outlined text-primary">check_circle</span> <span>Thanh toán tự động qua thẻ của công ty.</span></li>
            <li className="flex gap-3 items-start"><span className="material-symbols-outlined text-primary">check_circle</span> <span>Tra cứu tiện ích như phòng tắm, quán ăn, trạm cân.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
