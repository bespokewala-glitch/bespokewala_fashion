import { Metadata } from 'next';
import '../../auth.css';

export const metadata: Metadata = {
  title: 'Register',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
