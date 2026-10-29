import React, { useState } from 'react';
import { Form, Input, Button, message, Steps, Alert } from 'antd';
import { MailOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons';
import { AuthFormCard } from '../components/AuthFormCard';
import { sendOtpEmail } from '../api/emailJsApi';
import { sendForgotPasswordOtp, resetPasswordWithOtp } from '../api/authApi';
import { Link, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { extractApiError } from '../../../shared/api/errors';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSendOtp = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await sendForgotPasswordOtp({ email: values.email.trim() });
      setEmail(values.email.trim());

      // Lab only: nếu BE trả otpCode (OTP_EXPOSE_IN_RESPONSE=true) thì gửi EmailJS phụ trợ.
      if (response.otpCode) {
        const username = values.email.split('@')[0];
        await sendOtpEmail(username, values.email, response.otpCode);
      }

      message.success('Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.');
      setCurrentStep(1);
    } catch (error) {
      message.error(extractApiError(error as AxiosError));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: {
    otp: string;
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    try {
      await resetPasswordWithOtp({
        email,
        otpCode: values.otp.trim(),
        newPassword: values.password,
      });
      message.success('Đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.');
      navigate('/login');
    } catch (error) {
      message.error(extractApiError(error as AxiosError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormCard
      title="Khôi phục mật khẩu"
      eyebrow="SmartTruck"
      description="Nhập email đã đăng ký để nhận OTP và đặt mật khẩu mới trên server."
      footer={<p>Đã nhớ mật khẩu? <Link to="/login">Đăng nhập</Link></p>}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Đã kết nối backend"
        description="OTP do server phát hành và mật khẩu mới được ghi vào database sau khi xác thực thành công."
      />
      <Steps
        current={currentStep}
        items={[
          { title: 'Nhập Email' },
          { title: 'OTP & mật khẩu mới' },
        ]}
        className="mb-8"
        size="small"
      />

      {currentStep === 0 && (
        <Form layout="vertical" onFinish={handleSendOtp} requiredMark={false}>
          <Form.Item
            label="Địa chỉ Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email đã đăng ký" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Gửi mã xác nhận
          </Button>
        </Form>
      )}

      {currentStep === 1 && (
        <Form layout="vertical" onFinish={handleResetPassword} requiredMark={false}>
          <p className="text-sm text-gray-500 mb-4">
            Nhập mã OTP gửi tới <strong>{email}</strong> (hoặc đọc từ log server khi lab bật expose OTP), rồi đặt mật khẩu mới.
          </p>
          <Form.Item
            label="Mã OTP"
            name="otp"
            rules={[
              { required: true, message: 'Vui lòng nhập mã OTP!' },
              { len: 6, message: 'Mã OTP gồm 6 chữ số' },
            ]}
          >
            <Input prefix={<SafetyOutlined />} placeholder="Nhập mã 6 số" size="large" maxLength={6} />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" size="large" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Đổi mật khẩu
          </Button>
          <Button type="link" block onClick={() => setCurrentStep(0)} style={{ marginTop: 8 }}>
            Gửi lại OTP
          </Button>
        </Form>
      )}
    </AuthFormCard>
  );
};
