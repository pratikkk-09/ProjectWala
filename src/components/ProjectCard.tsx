import React from 'react';
import { motion } from 'motion/react';
import { Download, ShoppingCart, Tag, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { api } from '../lib/api';

export interface ProjectType {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  previewImage: string;
  fileUrl?: string; // Sometimes available
  previewUrl?: string;
}

interface ProjectCardProps {
  project: ProjectType;
  isPurchased?: boolean;
  purchaseStatus?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, isPurchased = false, purchaseStatus }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handlePurchase = () => {
    if (!user) {
      addToast('Please login to purchase items', 'info');
      navigate('/login');
      return;
    }
    
    navigate(`/checkout/${project._id}`);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Use standard fetch here to easily handle blobs and avoid axios interceptor issues with arraybuffers,
      // or we can use axios.
      const response = await api.get(`/download/${project._id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from headers if possible, or fallback
      let fileName = `${project.title.replace(/\s+/g, '_')}_source.zip`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        fileName = contentDisposition.split('filename=')[1].replace(/["']/g, '');
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response && error.response.data instanceof Blob) {
         // Try to read blob to get error message
         const text = await error.response.data.text();
         try {
           const json = JSON.parse(text);
           addToast(json.message || 'Error downloading file', 'error');
         } catch {
           addToast('Error downloading file', 'error');
         }
      } else {
         addToast(error.response?.data?.message || 'Error downloading file', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
    >
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        <img 
          src={project.previewImage} 
          alt={project.title} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // fallback image
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80';
          }}
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700 flex items-center gap-1.5 shadow-sm">
            <Tag className="w-3 h-3" />
            {project.category}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{project.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-baseline gap-1 mr-2">
            <span className="text-sm font-medium text-gray-500">₹</span>
            <span className="text-xl font-bold text-gray-900">{project.price}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {project.previewUrl && (
              <a 
                href={project.previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview</span>
              </a>
            )}
            
            {isPurchased || user?.role === 'Admin' ? (
              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-70"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Downloading...' : 'Download'}
              </button>
            ) : purchaseStatus === 'pending' ? (
              <button
                disabled
                className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium text-sm opacity-80 cursor-not-allowed"
              >
                Pending
              </button>
            ) : purchaseStatus === 'rejected' ? (
              <button
                disabled
                className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium text-sm opacity-80 cursor-not-allowed"
              >
                Rejected
              </button>
            ) : (
               <button
                onClick={handlePurchase}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-70"
              >
                <ShoppingCart className="w-4 h-4" />
                {loading ? '...' : 'Buy Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
