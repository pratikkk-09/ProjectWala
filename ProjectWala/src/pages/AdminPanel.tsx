import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { Upload, Plus, ShieldCheck, Image as ImageIcon, Users, FolderKanban, Trash2, Edit, X, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'purchases'>('projects');
  
  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const { addToast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchUsersAndPurchases();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast('Failed to load projects', 'error');
    }
  };

  const fetchUsersAndPurchases = async () => {
    try {
      const [usersRes, purchasesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/purchases')
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
    } catch (error) {
      addToast('Failed to load users data', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPrice('');
    setPreviewUrl('');
    setImageFile(null);
    setFile(null);
    setEditingProject(null);
    setIsProjectModalOpen(false);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setPrice(project.price.toString());
    setPreviewUrl(project.previewUrl || '');
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      addToast('Project deleted', 'success');
      fetchProjects();
    } catch (error) {
      addToast('Failed to delete project', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject && !file) {
      addToast('Please select a project ZIP file', 'error');
      return;
    }
    setLoading(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', price);
    if (previewUrl) {
      formData.append('previewUrl', previewUrl);
    }
    if (imageFile) {
        formData.append('image', imageFile);
    }
    if (file) {
        formData.append('file', file);
    }

    try {
      if (editingProject) {
        await api.put(`/admin/projects/${editingProject._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        addToast('Project updated successfully', 'success');
      } else {
        await api.post('/admin/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        addToast('Project uploaded successfully', 'success');
      }
      resetForm();
      fetchProjects();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getUserPurchases = (userId: string) => {
    return purchases.filter(p => {
        // Handle mock schema where userId might be an object due to populate
        const id = p.userId?._id || p.userId;
        return id === userId;
    });
  };

  const handleUpdatePurchaseStatus = async (purchaseId: string, status: string) => {
    try {
      await api.put(`/admin/purchases/${purchaseId}/status`, { status });
      addToast(`Purchase marked as ${status}`, 'success');
      fetchUsersAndPurchases();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
              <p className="mt-1 text-gray-500 text-sm">Manage marketplace projects and users</p>
            </div>
          </div>
          
          <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'purchases' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Purchases
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'projects' && (
            <motion.div
              key="projects-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                  <h2 className="text-lg font-bold text-gray-900">Projects Directory</h2>
                  <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Project</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Price</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {projects.map((project) => (
                        <tr key={project._id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={project.previewImage} alt={project.title} className="w-12 h-12 rounded object-cover border border-gray-200" />
                              <div>
                                <p className="font-medium text-gray-900">{project.title}</p>
                                <p className="text-xs text-gray-500 truncate max-w-xs">{project.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{project.category}</span>
                          </td>
                          <td className="p-4 font-medium text-gray-900 text-sm">₹{project.price}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal(project)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProject(project._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {projects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No projects found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">User Management</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Purchases</th>
                        <th className="p-4 font-medium">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {users.map((user) => {
                        const userPurchases = getUserPurchases(user._id);
                        const totalSpent = userPurchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                        return (
                          <tr key={user._id} className="hover:bg-gray-50/50 transition">
                            <td className="p-4">
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                {userPurchases.length > 0 ? (
                                  userPurchases.map((p, idx) => (
                                    <span key={idx} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block w-fit">
                                      {p.projectId?.title || 'Unknown Project'} <span className="text-gray-400">({new Date(p.createdAt).toLocaleDateString()})</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400">No purchases</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-medium text-gray-900 text-sm">
                              ₹{totalSpent}
                            </td>
                          </tr>
                        );
                      })}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'purchases' && (
            <motion.div
              key="purchases-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Purchases & Approvals</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">User Details</th>
                        <th className="p-4 font-medium">Contact No</th>
                        <th className="p-4 font-medium">Project</th>
                        <th className="p-4 font-medium">UPI/Transaction Ref</th>
                        <th className="p-4 font-medium">Screenshot</th>
                        <th className="p-4 font-medium">Status & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {purchases.map((purchase) => (
                        <tr key={purchase._id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{purchase.name || purchase.userId?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{purchase.email || purchase.userId?.email || 'N/A'}</p>
                          </td>
                          <td className="p-4">
                            {purchase.phone ? (
                              <p className="text-sm text-gray-900">{purchase.phone}</p>
                            ) : (
                              <span className="text-gray-400 italic text-xs">N/A</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {purchase.projectId?.title || 'Unknown Project'}
                              </span>
                              <span className="text-sm text-indigo-600 font-medium">₹{purchase.amount}</span>
                              <span className="text-xs text-gray-400">{new Date(purchase.date || purchase.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-gray-900 text-sm">
                            <div className="flex flex-col gap-1">
                              {purchase.upiRef ? (
                                <span className="font-mono text-gray-700">{purchase.upiRef}</span>
                              ) : (
                                <span className="text-gray-400 italic">None</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {purchase.screenshotUrl ? (
                              <a href={purchase.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded overflow-hidden border border-gray-200">
                                <img src={purchase.screenshotUrl} alt="Payment Screenshot" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                              </a>
                            ) : (
                              <span className="text-gray-400 italic text-xs">None</span>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                purchase.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                purchase.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {purchase.status || 'pending'}
                              </span>
                              
                              {(purchase.status === 'pending' || !purchase.status) && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdatePurchaseStatus(purchase._id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition" title="Approve">
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => handleUpdatePurchaseStatus(purchase._id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Reject">
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {purchases.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No purchases found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Project Form Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={resetForm}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-150px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g. React Admin Dashboard" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g. Web Development" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview URL (Optional)</label>
                <input type="url" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="https://example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Briefly describe the project..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" required min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="499" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 relative overflow-hidden">
                      {editingProject && !imageFile ? (
                        <img src={editingProject.previewImage} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange} 
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Source File (ZIP)</label>
                <div className="mt-1 flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors bg-gray-50">
                  <div className="space-y-1 text-center flex flex-col items-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="project-file" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 px-1">
                        <span>Upload a file</span>
                        <input id="project-file" name="project-file" type="file" className="sr-only" accept=".zip,.rar,.tar.gz" onChange={handleFileChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {file ? <span className="font-semibold text-indigo-600">{file.name}</span> : 
                        (editingProject ? "Upload new file to replace existing" : "ZIP, RAR up to 50MB")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex justify-center items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-colors">
                  {loading ? <span className="animate-pulse">Saving...</span> : (editingProject ? 'Update Project' : 'Publish Project')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

