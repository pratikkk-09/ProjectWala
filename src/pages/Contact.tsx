import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Contact Us</h1>
        <p className="text-gray-500 text-center mb-10 max-w-lg mx-auto">
          Have a question or need assistance? Feel free to reach out to us using the information below.
        </p>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Phone & WhatsApp</h3>
              <p className="text-gray-600 mt-1">
                <a href="https://wa.me/919309128464" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">
                  +91 93091 28464
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Address</h3>
              <p className="text-gray-600 mt-1">
                <a href="mailto:pratikc0203@gmail.com" className="hover:text-indigo-600 transition">
                  pratikc0203@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
