import React from 'react';


export const AboutUsPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Về SmartTruck</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Sứ mệnh của chúng tôi là số hóa ngành hậu cần bãi đỗ xe tải, mang lại sự an toàn, tiện lợi và minh bạch cho chuỗi cung ứng toàn cầu.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-4">Câu chuyện của chúng tôi</h2>
          <p className="text-on-surface-variant leading-relaxed mb-4">Thành lập năm 2024, SmartTruck bắt nguồn từ một vấn đề nhức nhối: Tài xế xe tải mất hàng giờ mỗi ngày chỉ để tìm nơi đỗ xe an toàn, dẫn đến lãng phí nhiên liệu, vi phạm giờ giấc và rủi ro trộm cắp hàng hóa.</p>
          <p className="text-on-surface-variant leading-relaxed">Chúng tôi xây dựng nền tảng kết nối trực tiếp tài xế với các chủ bãi, biến những khoảng sân trống thành không gian đỗ xe an toàn, tối ưu hóa lợi nhuận cho cả hai bên.</p>
        </div>
        <div className="bg-surface-container rounded-3xl overflow-hidden shadow-lg h-64 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)' }}></div>
      </div>
    </div>
  );
};
