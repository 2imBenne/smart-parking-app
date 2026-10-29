import React from 'react';


export const BlogPage: React.FC = () => {
  const posts = [
    { title: 'Tối ưu hóa nhiên liệu với phần mềm tìm bãi đỗ', category: 'Giải pháp Tài xế', date: '28/07/2026', img: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80' },
    { title: 'Kinh nghiệm tăng 30% doanh thu bãi đỗ xe tải', category: 'Chủ bãi đỗ', date: '25/07/2026', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80' },
    { title: 'SmartTruck ra mắt tính năng đặt chỗ qua API', category: 'Sản phẩm', date: '20/07/2026', img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80' }
  ];

  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Blog & Tin Tức</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Cập nhật tin tức mới nhất về ngành vận tải, mẹo tối ưu chi phí và các tính năng mới của SmartTruck.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {posts.map((post, idx) => (
          <div key={idx} className="bg-surface border border-outline-variant rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
            <div className="h-48 bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${post.img})` }}>
              <div className="w-full h-full bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-wide">
                <span className="text-primary">{post.category}</span>
                <span>{post.date}</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{post.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
