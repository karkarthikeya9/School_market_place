import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">The page or listing you are looking for does not exist.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to marketplace
      </Link>
    </div>
  );
}
