import React from 'react';
import { motion } from 'motion/react';
import { Code, Users, Zap } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About ProjectHub</h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed text-lg">
            ProjectHub is a platform dedicated to providing robust, high-quality project source codes.
            Whether you are a student looking for a great college project, or a professional developer 
            seeking fully featured templates to bootstrap your product, we have you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Code className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Clean Code</h3>
            <p className="text-gray-500 text-sm">
              All projects are built with modern technologies and follow best practices.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Fast Setup</h3>
            <p className="text-gray-500 text-sm">
              Get up and running in minutes with detailed documentation and guidelines.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-gray-500 text-sm">
              We constantly improve and update our templates based on community feedback.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
