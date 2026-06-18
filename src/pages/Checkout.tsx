import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, CreditCard, Download, QrCode } from 'lucide-react';
import type { ProjectType } from '../components/ProjectCard';

export const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [upiRefInfo, setUpiRefInfo] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const upiId = 'pratikchougule60212724@oksbi';

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        setProject(data);
      } catch (error) {
        addToast('Project not found', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, user, navigate, addToast]);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    setProcessingPayment(true);
    try {
      // Create Razorpay order (or mock order depending on backend config)
      const { data: order } = await api.post('/payment/create-order', { projectId: project._id });
      
      const formData = new FormData();
      formData.append('razorpay_payment_id', `upi_manual_${Date.now()}`);
      formData.append('projectId', project._id);
      formData.append('amount', order.amount.toString());
      formData.append('mock', 'true');
      formData.append('upiRef', upiRefInfo);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      // Simulate verification since the user manually paid via UPI
      await api.post('/payment/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPaymentDone(true);
      addToast('Payment info submitted! Please wait for admin approval.', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Error processing payment', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/download/${project?._id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = project?.title ? `${project.title.replace(/\s+/g, '_')}_source.zip` : 'source.zip';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        fileName = contentDisposition.split('filename=')[1].replace(/["']/g, '');
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      addToast('Error downloading your file. Please try again from Dashboard.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="md:flex">
            {/* Project Summary */}
            <div className="md:w-1/3 bg-gray-900 p-6 md:p-8 text-white flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Order Summary</p>
                <h2 className="text-xl font-bold mb-4">{project.title}</h2>
                <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800 mb-6">
                  <img src={project.previewImage} alt={project.title} className="object-cover w-full h-full" />
                </div>
              </div>
              <div className="border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Total</span>
                  <span className="font-bold">₹{project.price}</span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="md:w-2/3 p-6 md:p-8">
              {paymentDone ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Payment Submitted for Approval</h3>
                  <p className="text-gray-500 max-w-sm">Thank you for your purchase. An admin will review your transaction reference, and then your project will be available to download from your dashboard.</p>
                  
                  <div className="pt-6 flex gap-4">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSimulatePayment} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                          <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-indigo-600" />
                      Payment Information
                    </h3>
                    
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg mb-4 text-sm text-blue-800 text-center">
                      <p className="font-medium mb-4 text-base">Scan to Pay via UPI</p>
                      
                      <div className="bg-white p-4 rounded-xl border border-blue-200 inline-block mb-4">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Pratik Chougule&am=${project.price}&cu=INR`)}`} 
                          alt="UPI QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      
                      <p>Or send exactly <strong>₹{project.price}</strong> to the following UPI ID:</p>
                      <div className="mt-3 flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-200 max-w-sm mx-auto">
                        <span className="font-mono font-medium text-gray-900">{upiId}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(upiId);
                            addToast('UPI ID copied to clipboard', 'info');
                          }}
                          className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Ref. No / Note <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required 
                        value={upiRefInfo} 
                        onChange={e => setUpiRefInfo(e.target.value)} 
                        placeholder="Enter UTR or UPI Reference Number"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Screenshot <span className="text-red-500">*</span></label>
                      <input 
                        type="file" 
                        required 
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors border border-gray-200 rounded-lg bg-gray-50 p-2" 
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={processingPayment || !phone || !upiRefInfo || !screenshot}
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-colors"
                    >
                      {processingPayment ? 'Processing...' : `Confirm Payment of ₹${project.price}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
