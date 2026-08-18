import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wishlist | Bespokewala',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
