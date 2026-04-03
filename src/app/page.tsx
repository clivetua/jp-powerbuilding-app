import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });
  
  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <h1 className="text-3xl font-semibold">Home Screen (WIP)</h1>
    </div>
  );
}
