import { getSession } from '@/lib/nextauth';
import LoginPage from '@/section/LoginPage';
import { redirect } from 'next/navigation';
export default async function Home() {
  const session = await getSession();
  const user = session?.user ?? null;

  if (user) {
    redirect(`/dashboard`);
  }

  return <LoginPage />;
}