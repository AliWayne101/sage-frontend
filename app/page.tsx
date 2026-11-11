import type { Metadata } from 'next';
import { getSession } from '@/lib/nextauth';
import LoginPage from '@/section/LoginPage';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Login | SAGE',
  description: 'Sign in to access your SAGE automated trading terminal and bot controls.',
};

export default async function Home() {
  const session = await getSession();
  const user = session?.user ?? null;

  if (user) {
    redirect(`/dashboard`);
  }

  return <LoginPage />;
}