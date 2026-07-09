import { redirect } from 'next/navigation';

export default function MemberProfileRedirect() {
  redirect('/dashboard/profile');
}
