import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function DownloadPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-[#a1a1a6]" />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-white">
          Under Construction
        </h1>
        
        <p className="text-base text-[#a1a1a6] mb-8">
          We are currently working on our native mobile applications. Please check back later.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </button>
      </div>
    </div>
  );
}
