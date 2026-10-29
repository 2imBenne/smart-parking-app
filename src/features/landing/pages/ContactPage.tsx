import React from 'react';


export const ContactPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Liên hệ với chúng tôi</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Đội ngũ hỗ trợ của SmartTruck luôn sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-on-surface mb-6">Gửi tin nhắn</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">Họ và tên</label>
              <input type="text" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">Email</label>
              <input type="email" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary" placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">Nội dung</label>
              <textarea className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary h-32 resize-none" placeholder="Bạn cần hỗ trợ gì?"></textarea>
            </div>
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">Gửi yêu cầu</button>
          </form>
        </div>
        <div className="flex flex-col gap-8">
          <div className="bg-surface-container rounded-3xl p-8">
            <h3 className="text-xl font-bold text-on-surface mb-4">Thông tin liên hệ</h3>
            <div className="space-y-4">
              <p className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">location_on</span> 123 Đường Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM</p>
              <p className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">phone</span> 1900 1234 (Tổng đài 24/7)</p>
              <p className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">mail</span> support@smarttruck.vn</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl overflow-hidden h-full min-h-[200px] flex items-center justify-center border border-outline-variant">
            <span className="material-symbols-outlined text-[48px] text-primary/20">map</span>
            <span className="ml-2 font-bold text-primary/40">Bản đồ Văn phòng</span>
          </div>
        </div>
      </div>
    </div>
  );
};
