import React from 'react';


export const CareersPage: React.FC = () => {
  return (
    <div className="py-24 max-w-max-width-driver mx-auto px-container-padding">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display-md text-4xl font-black text-primary mb-6">Gia nhập đội ngũ</h1>
        <p className="font-body-lg text-lg text-on-surface-variant">Cùng chúng tôi xây dựng nền tảng thay đổi ngành logistics. Chúng tôi luôn tìm kiếm những tài năng xuất chúng.</p>
      </div>
      <div className="space-y-6">
        {[
          { title: 'Senior Frontend Engineer (React/Vite)', dept: 'Engineering', type: 'Full-time', loc: 'Hồ Chí Minh' },
          { title: 'Backend Node.js Developer', dept: 'Engineering', type: 'Full-time', loc: 'Hà Nội' },
          { title: 'Sales Executive (B2B)', dept: 'Sales', type: 'Full-time', loc: 'Remote' }
        ].map((job, idx) => (
          <div key={idx} className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{job.title}</h3>
              <div className="flex gap-4 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">work</span> {job.dept}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {job.type}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> {job.loc}</span>
              </div>
            </div>
            <button className="mt-4 md:mt-0 bg-primary/10 text-primary font-bold py-2 px-6 rounded-lg hover:bg-primary hover:text-white transition-colors">Ứng tuyển</button>
          </div>
        ))}
      </div>
    </div>
  );
};
