import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ProjectCard, ProjectType } from '../components/ProjectCard';
import { Package, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Purchase {
  _id: string;
  projectId: ProjectType;
  date: string;
  status?: string;
}

export const Dashboard = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setPurchases(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load purchases', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Purchases</h1>
          <p className="mt-2 text-gray-500">View and download your purchased projects and source codes.</p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p>Loading your dashboard...</p>
          </div>
        ) : purchases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchases.map((purchase) => (
               <ProjectCard key={purchase._id} project={purchase.projectId} isPurchased={purchase.status === 'approved'} purchaseStatus={purchase.status} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 border-dashed">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No purchases yet</h3>
            <p className="text-gray-500 mt-1 mb-6 max-w-md mx-auto">You haven't bought any projects. Browse the marketplace to find high-quality code templates.</p>
            <a href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">
              Browse Projects
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
