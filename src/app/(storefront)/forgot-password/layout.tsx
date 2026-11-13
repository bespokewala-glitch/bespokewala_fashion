import { Metadata } from 'next';
import '../../auth.css';

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

