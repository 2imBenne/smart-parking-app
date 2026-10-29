import React from 'react';


export const ApiIntegrationPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Tích hợp REST API & Webhooks</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Kết nối hệ thống ERP, TMS của bạn trực tiếp với mạng lưới bãi đỗ xe của SmartTruck để tự động hóa hoàn toàn quy trình.</p>
      </div>
      <div className="bg-[#051821] text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-[120px]">code</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Tài liệu API dành cho Nhà phát triển</h2>
          <p className="text-white/70 mb-8">API của chúng tôi được thiết kế theo chuẩn RESTful, sử dụng JSON và hỗ trợ xác thực qua Bearer Token (JWT). Khởi tạo ứng dụng trong vài phút.</p>
          <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-[#4ade80] overflow-x-auto mb-8">
            <p>GET /api/v1/parks/search?lat=10.762&lng=106.660&radius=5km</p>
            <p className="text-white/50 mt-2">// Response</p>
            <p>{`{`}</p>
            <p className="pl-4">{`"status": "success",`}</p>
            <p className="pl-4">{`"data": [`}</p>
            <p className="pl-8">{`{ "id": "p_123", "name": "Bãi đỗ xe tải Q9", "available_spots": 15 }`}</p>
            <p className="pl-4">{`]`}</p>
            <p>{`}`}</p>
          </div>
          <button className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors">Xem Tài Liệu API</button>
        </div>
      </div>
    </div>
  );
};
