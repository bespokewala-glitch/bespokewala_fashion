import { Metadata } from 'next';
import '../../auth.css';

export const metadata: Metadata = {
  title: 'Login',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
