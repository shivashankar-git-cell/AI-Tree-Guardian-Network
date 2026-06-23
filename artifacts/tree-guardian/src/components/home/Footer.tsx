import { Globe, Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-primary" />
          <span className="font-serif font-bold text-lg text-foreground">AI Tree Guardian</span>
        </div>
        
        <div className="flex gap-6 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4" /> SDG 13
          </div>
          <div className="flex items-center gap-1">
            <Leaf className="w-4 h-4" /> SDG 15
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI Tree Guardian Network. All rights reserved.
        </p>
      </div>
    </footer>
  );
}