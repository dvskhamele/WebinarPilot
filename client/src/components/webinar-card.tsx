import { Link } from "wouter";
import { Webinar } from "@shared/types";

interface WebinarCardProps {
  webinar: Webinar;
}

export function WebinarCard({ webinar }: WebinarCardProps) {
  return (
    <Link href={`/webinar/${webinar.id}`} data-testid={`card-webinar-${webinar.id}`}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col">
        <div className="relative">
          <img 
            className="h-48 w-full object-cover" 
            src={webinar.image || 'https://placehold.co/600x400/e2e8f0/475569?text=WebinarHub'} 
            alt={webinar.title}
            data-testid={`img-webinar-${webinar.id}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=WebinarHub';
            }}
          />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <span 
            className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 self-start"
            data-testid={`text-category-${webinar.id}`}
          >
            {webinar.category}
          </span>
          <h3 
            className="mt-4 text-lg font-bold text-gray-900 flex-grow"
            data-testid={`text-title-${webinar.id}`}
          >
            {webinar.title}
          </h3>
          <p 
            className="mt-2 text-sm text-gray-600"
            data-testid={`text-host-${webinar.id}`}
          >
            by {webinar.host}
          </p>
          <p 
            className="mt-auto pt-4 text-sm font-semibold text-indigo-600"
            data-testid={`text-date-${webinar.id}`}
          >
            {new Date(webinar.dateTime).toLocaleDateString('en-IN', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
