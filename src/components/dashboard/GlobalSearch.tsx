'use client';

import * as React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Dialog, DialogContent } from '../ui/Dialog';
import { useAuthStore } from '@/lib/store';

export default function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const searchResults: any[] = [];
      
      // 1. Query Apartments (All users can search apartments)
      try {
        const apts = await databases.listDocuments(DATABASE_ID, 'apartments', [
          Query.limit(50)
        ]);
        const filtered = apts.documents.filter(doc => 
          doc.name.toLowerCase().includes(val.toLowerCase()) || 
          doc.slug.toLowerCase().includes(val.toLowerCase())
        );
        filtered.forEach(d => {
          searchResults.push({
            type: 'Apartman',
            title: d.name,
            subtitle: `/${d.slug}`,
            href: `/${d.slug}`
          });
        });
      } catch (e) {}

      // 2. Query Users (Admin and Manager only)
      if (user && (user.role === 'super_admin' || user.role === 'manager')) {
        try {
          const usrs = await databases.listDocuments(DATABASE_ID, 'users', [
            Query.limit(50)
          ]);
          const filtered = usrs.documents.filter(doc => 
            doc.fullName.toLowerCase().includes(val.toLowerCase()) || 
            doc.email.toLowerCase().includes(val.toLowerCase())
          );
          filtered.forEach(d => {
            searchResults.push({
              type: 'Kullanıcı',
              title: d.fullName,
              subtitle: `${d.role === 'manager' ? 'Yönetici' : 'Sakin'} • ${d.email}`,
              href: '#'
            });
          });
        } catch (e) {}
      }

      // 3. Query Announcements
      try {
        const anns = await databases.listDocuments(DATABASE_ID, 'announcements', [
          Query.limit(50)
        ]);
        const filtered = anns.documents.filter(doc => 
          doc.title.toLowerCase().includes(val.toLowerCase())
        );
        filtered.forEach(d => {
          searchResults.push({
            type: 'Duyuru',
            title: d.title,
            subtitle: 'Apartman Duyuru Panosu',
            href: '#'
          });
        });
      } catch (e) {}

      setResults(searchResults);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground border border-border bg-muted/20 px-3 py-1.5 rounded-lg w-40 md:w-60 justify-between cursor-pointer hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          Ara...
        </span>
        <kbd className="hidden sm:inline-flex bg-muted border border-border px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
          Ctrl+K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Apartman, kullanıcı, duyuru ara..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 w-full"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
          </div>

          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
            {results.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                {query.trim().length < 2 ? 'Arama yapmak için en az 2 harf girin.' : 'Sonuç bulunamadı.'}
              </p>
            ) : (
              results.map((res, idx) => (
                <div
                  key={idx}
                  className="p-2.5 hover:bg-muted/40 rounded-lg flex justify-between items-center transition-all border border-transparent hover:border-border cursor-pointer"
                  onClick={() => {
                    if (res.href && res.href !== '#') {
                      window.open(res.href, '_blank');
                    }
                    setOpen(false);
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{res.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{res.subtitle}</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                    {res.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
