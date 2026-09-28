import { session } from '@/lib/auth';
import Admin from './panel';
import './admin.css';
export const dynamic = 'force-dynamic';
export default async function Page() { return <Admin authenticated={Boolean(await session())} />; }
